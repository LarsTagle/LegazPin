import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.utils.class_weight import compute_class_weight
import pickle
import nltk
import os
from transformers import DistilBertTokenizer, TFDistilBertForSequenceClassification
from sklearn.metrics import precision_score, recall_score, f1_score

nltk.download('punkt', quiet=True)

# Load dataset
df = pd.read_csv("Intent Data.csv", on_bad_lines='skip', quoting=3)
df['text'] = df['text'].fillna("").str.strip()
df['intent'] = df['intent'].fillna("").str.strip()
df = df[df['text'] != ""]
df = df[df['intent'] != ""]
print(f"Loaded CSV with {len(df)} rows after skipping bad lines.")

# Treat intents as single labels
df['intent'] = df['intent'].apply(lambda x: [x.strip()] if isinstance(x, str) else x)
print("Sample of processed intents:")
print(df[['text', 'intent']].head(10))

# Encode labels
mlb = MultiLabelBinarizer()
y = mlb.fit_transform(df['intent'])
print(f"Unique intents detected: {list(mlb.classes_)}")

# Compute class weights
class_weights = {}
for i in range(len(mlb.classes_)):
    weights = compute_class_weight('balanced', classes=np.array([0, 1]), y=y[:, i])
    class_weights[i] = weights[1]
class_weights_tensor = tf.constant(list(class_weights.values()), dtype=tf.float32)

# Load tokenizer
max_length = 30
tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')

# Tokenize text
encodings = tokenizer(
    df['text'].tolist(),
    add_special_tokens=True,
    max_length=max_length,
    padding='max_length',
    truncation=True,
    return_tensors='tf'
)

# Split data
input_ids_np = encodings['input_ids'].numpy()
attention_masks_np = encodings['attention_mask'].numpy()
y_np = y
X_train_ids_np, X_test_ids_np, X_train_masks_np, X_test_masks_np, y_train, y_test = train_test_split(
    input_ids_np, attention_masks_np, y_np, test_size=0.3, random_state=50
)
X_train_ids = tf.convert_to_tensor(X_train_ids_np)
X_test_ids = tf.convert_to_tensor(X_test_ids_np)
X_train_masks = tf.convert_to_tensor(X_train_masks_np)
X_test_masks = tf.convert_to_tensor(X_test_masks_np)
y_train = tf.convert_to_tensor(y_train, dtype=tf.float32)
y_test = tf.convert_to_tensor(y_test, dtype=tf.float32)

# Create datasets
train_dataset = tf.data.Dataset.from_tensor_slices(
    ({'input_ids': X_train_ids, 'attention_mask': X_train_masks}, y_train)
).shuffle(1000).batch(16)
test_dataset = tf.data.Dataset.from_tensor_slices(
    ({'input_ids': X_test_ids, 'attention_mask': X_test_masks}, y_test)
).batch(16)

# Load model
model = TFDistilBertForSequenceClassification.from_pretrained(
    'distilbert-base-uncased',
    num_labels=len(mlb.classes_),
    problem_type="multi_label_classification"
)

# Optimizer and loss
optimizer = tf.keras.optimizers.Adam(learning_rate=2e-5)
loss_fn = tf.keras.losses.BinaryCrossentropy(from_logits=True)

def weighted_loss(y_true, y_pred):
    loss = loss_fn(y_true, y_pred)
    weights = tf.gather(class_weights_tensor, tf.where(y_true > 0)[:, 1])
    return tf.reduce_mean(loss * weights)

model.compile(
    optimizer=optimizer,
    loss=weighted_loss,
    metrics=['accuracy', tf.keras.metrics.Precision(), tf.keras.metrics.Recall()]
)

# Training loop
best_val_f1 = 0.0
patience = 7
patience_counter = 0
lr = 2e-5
min_lr = 1e-5

for epoch in range(5):
    train_loss = 0
    train_preds = []
    train_labels = []
    for batch, labels in train_dataset:
        with tf.GradientTape() as tape:
            outputs = model(batch, training=True)
            loss = weighted_loss(labels, outputs.logits)
            train_loss += loss
        gradients = tape.gradient(loss, model.trainable_variables)
        optimizer.apply_gradients(zip(gradients, model.trainable_variables))
        preds = tf.cast(tf.sigmoid(outputs.logits) > 0.5, tf.float32).numpy()
        train_preds.extend(preds)
        train_labels.extend(labels.numpy())

    train_loss = train_loss / len(list(train_dataset))
    train_preds = np.array(train_preds)
    train_labels = np.array(train_labels)
    train_precision = precision_score(train_labels, train_preds, average='micro')
    train_recall = recall_score(train_labels, train_preds, average='micro')
    train_f1 = f1_score(train_labels, train_preds, average='micro')

    print(f"Epoch {epoch + 1}:")
    print(f"  Training Loss: {train_loss:.4f}")
    print(f"  Training Precision: {train_precision:.4f}")
    print(f"  Training Recall: {train_recall:.4f}")
    print(f"  Training F1 Score: {train_f1:.4f}")

    val_loss = 0
    val_preds = []
    val_labels = []
    for batch, labels in test_dataset:
        outputs = model(batch, training=False)
        val_loss += weighted_loss(labels, outputs.logits)
        preds = tf.cast(tf.sigmoid(outputs.logits) > 0.5, tf.float32).numpy()
        val_preds.extend(preds)
        val_labels.extend(labels.numpy())

    val_loss = val_loss / len(list(test_dataset))
    val_preds = np.array(val_preds)
    val_labels = np.array(val_labels)
    val_precision = precision_score(val_labels, val_preds, average='micro')
    val_recall = recall_score(val_labels, val_preds, average='micro')
    val_f1 = f1_score(val_labels, val_preds, average='micro')

    print(f"  Validation Loss: {val_loss:.4f}")
    print(f"  Validation Precision: {val_precision:.4f}")
    print(f"  Validation Recall: {val_recall:.4f}")
    print(f"  Validation F1 Score: {val_f1:.4f}")

    if val_f1 > best_val_f1:
        best_val_f1 = val_f1
        patience_counter = 0
    else:
        patience_counter += 1
        if patience_counter >= patience:
            print("Early stopping triggered.")
            break
    if patience_counter >= 3 and lr > min_lr:
        lr *= 0.3
        optimizer.learning_rate.assign(lr)
        print(f"Reduced learning rate to {lr}")

# Final evaluation
val_loss = 0
all_preds = []
all_labels = []
for batch, labels in test_dataset:
    outputs = model(batch, training=False)
    logits = outputs.logits
    val_loss += weighted_loss(labels, logits)
    preds = tf.cast(tf.sigmoid(logits) > 0.5, tf.float32).numpy()
    all_preds.extend(preds)
    all_labels.extend(labels.numpy())

all_preds = np.array(all_preds)
all_labels = np.array(all_labels)
precision = precision_score(all_labels, all_preds, average='micro')
recall = recall_score(all_labels, all_preds, average='micro')
f1 = f1_score(all_labels, all_preds, average='micro')

print("Final Test Set Evaluation:")
print(f"Loss: {val_loss / len(list(test_dataset)):.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall: {recall:.4f}")
print(f"F1 Score: {f1:.4f}")

# Save model and tokenizer
model_dir = 'intent_model_distilbert'
if os.path.exists(model_dir):
    print("Clearing existing model directory...")
    import shutil
    shutil.rmtree(model_dir)
model.save_pretrained(model_dir)
tokenizer.save_pretrained(model_dir)
print(f"DistilBERT model and tokenizer saved successfully at {model_dir}")
print("Saved directory contents:", os.listdir(model_dir))

# Save MultiLabelBinarizer
mlb_path = 'intent_mlb.pkl'
if os.path.exists(mlb_path):
    os.remove(mlb_path)
with open(mlb_path, 'wb') as f:
    pickle.dump(mlb, f)
print("MultiLabelBinarizer saved successfully.")