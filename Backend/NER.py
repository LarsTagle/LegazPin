import torch
from torch.utils.data import Dataset
from transformers import DistilBertTokenizerFast, DistilBertForTokenClassification, Trainer, TrainingArguments, DataCollatorForTokenClassification
import transformers
import numpy as np
import pandas as pd
from sklearn.metrics import precision_score, recall_score, f1_score
from collections import Counter

print(f"Transformers version: {transformers.__version__}")

# 1. Define the tag scheme
TAGS = ['O', 'B-FARE', 'I-FARE', 'B-DESTINATION', 'I-DESTINATION', 'B-TRANSPORT', 'I-TRANSPORT', 'B-DISCOUNT', 
        'B-ORIGIN', 'I-ORIGIN', 'B-ROUTE', 'I-ROUTE', 'B-TIME', 'I-TIME', 'B-COMMUTER', 'I-COMMUTER', 
        'B-LOCATION', 'I-LOCATION', 'B-ACTIVITY', 'I-ACTIVITY', 'B-PURPOSE', 'I-PURPOSE', 'B-EVENT', 'I-EVENT', 
        'B-SUGGEST', 'I-SUGGEST', 'B-CONDITION', 'I-CONDITION', 'B-DISTANCE', 'I-DISTANCE', 'B-ATTRACTION', 
        'I-ATTRACTION', 'B-ALTERNATIVE', 'I-ALTERNATIVE']
tag2id = {tag: idx for idx, tag in enumerate(TAGS)}
id2tag = {idx: tag for tag, idx in tag2id.items()}

# 2. Split contractions
def split_contractions(text, tags):
    new_text, new_tags = [], []
    for token, tag in zip(text, tags):
        if token.lower() == "what's":
            new_text.extend(["What", "'s"])
            new_tags.extend([tag, tag])
        elif token.lower() == "how's":
            new_text.extend(["How", "'s"])
            new_tags.extend([tag, tag])
        elif token.lower() == "isn't":
            new_text.extend(["is", "n't"])
            new_tags.extend([tag, tag])
        elif token.lower() == "doesn't":
            new_text.extend(["does", "n't"])
            new_tags.extend([tag, tag])
        elif token.lower() == "can't":
            new_text.extend(["can", "n't"])
            new_tags.extend([tag, tag])
        else:
            new_text.append(token)
            new_tags.append(tag)
    return new_text, new_tags

# 3. Load and process CSV data with tag distribution analysis
def load_csv_data(csv_path, text_col='text', tag_col='labels', sep=','):
    df = pd.read_csv(csv_path, sep=sep)
    texts, tags = [], []
    all_tags = []
    skipped_rows, invalid_label_rows = [], []
    
    for idx, row in df.iterrows():
        text = str(row[text_col]).strip().split()
        tag = str(row[tag_col]).strip().split()
        
        invalid_labels = [t for t in tag if t not in TAGS]
        if invalid_labels:
            invalid_label_rows.append((idx, text, tag, invalid_labels))
            continue
        
        text, tag = split_contractions(text, tag)
        if len(text) != len(tag):
            skipped_rows.append((idx, text, tag))
            continue
        
        texts.append(text)
        tags.append(tag)
        all_tags.extend(tag)
    
    tag_counts = Counter(all_tags)
    print("\nTag Distribution:")
    for tag, count in tag_counts.items():
        print(f"{tag}: {count}")
    
    if invalid_label_rows:
        print("\nRows with invalid labels:")
        for idx, text, tag, invalid_labels in invalid_label_rows:
            print(f"Row {idx}: Text: {' '.join(text)}, Labels: {tag}, Invalid: {invalid_labels}")
    if skipped_rows:
        print("\nSkipped rows due to length mismatch:")
        for idx, text, tag in skipped_rows:
            print(f"Row {idx}: Text: {' '.join(text)}, Labels: {tag}")
    
    print(f"\nLoaded {len(texts)} valid samples.")
    return texts, tags, tag_counts

# 4. Split data
def split_data(texts, tags, train_ratio=0.8):
    split_idx = int(len(texts) * train_ratio)
    train_texts, val_texts = texts[:split_idx], texts[split_idx:]
    train_tags, val_tags = tags[:split_idx], tags[split_idx:]
    return train_texts, train_tags, val_texts, val_tags

# 5. Custom Dataset
class NERDataset(Dataset):
    def __init__(self, texts, tags, tokenizer, max_len=128):
        self.texts = texts
        self.tags = tags
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = self.texts[idx]
        labels = self.tags[idx]
        encoding = self.tokenizer(
            text,
            max_length=self.max_len,
            padding='max_length',
            truncation=True,
            return_tensors='pt',
            is_split_into_words=True
        )
        word_ids = encoding.word_ids()
        label_ids = [-100] * self.max_len
        previous_word_idx = None
        
        for i, word_idx in enumerate(word_ids):
            if word_idx is None:
                label_ids[i] = -100
            elif word_idx != previous_word_idx:
                label_ids[i] = tag2id[labels[word_idx]]
            else:
                if labels[word_idx].startswith('B-'):
                    subword_tag = f'I-{labels[word_idx][2:]}'
                    label_ids[i] = tag2id.get(subword_tag, tag2id[labels[word_idx]])
                else:
                    label_ids[i] = tag2id[labels[word_idx]]
            previous_word_idx = word_idx

        return {
            'input_ids': encoding['input_ids'].squeeze(),
            'attention_mask': encoding['attention_mask'].squeeze(),
            'labels': torch.tensor(label_ids, dtype=torch.long)
        }

# 6. Compute class weights for imbalance
def compute_class_weights(tag_counts):
    total = sum(tag_counts.values())
    weights = [total / (len(TAGS) * tag_counts.get(id2tag[i], 1)) for i in range(len(TAGS))]
    return weights

# 7. Custom Trainer with weighted loss (fixed for num_items_in_batch)
class WeightedNERTrainer(Trainer):
    def __init__(self, tag_counts, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.tag_counts = tag_counts

    def compute_loss(self, model, inputs, return_outputs=False, num_items_in_batch=None):
        labels = inputs.pop("labels")
        outputs = model(**inputs)
        logits = outputs.logits
        weights = torch.tensor(compute_class_weights(self.tag_counts), device=logits.device)
        loss_fct = torch.nn.CrossEntropyLoss(weight=weights)
        loss = loss_fct(logits.view(-1, len(TAGS)), labels.view(-1))
        return (loss, outputs) if return_outputs else loss

# 8. Training function with manual evaluation using sklearn
def train_model(csv_path, epochs=5, batch_size=16, train_ratio=0.8, output_dir='./ner_model'):
    model = DistilBertForTokenClassification.from_pretrained('distilbert-base-uncased', num_labels=len(TAGS))
    tokenizer = DistilBertTokenizerFast.from_pretrained('distilbert-base-uncased')
    
    # Load data and get tag counts
    texts, tags, tag_counts = load_csv_data(csv_path)
    train_texts, train_tags, val_texts, val_tags = split_data(texts, tags, train_ratio)
    
    train_dataset = NERDataset(train_texts, train_tags, tokenizer)
    val_dataset = NERDataset(val_texts, val_tags, tokenizer)
    
    training_args = TrainingArguments(
        output_dir='./results',
        num_train_epochs=1,  # Set to 1 for manual epoch loop
        per_device_train_batch_size=batch_size,
        per_device_eval_batch_size=batch_size,
        warmup_steps=200,
        weight_decay=0.01,
        logging_dir='./logs',
        logging_steps=10,
    )
    
    # Define metrics function using sklearn
    def compute_metrics(predictions, labels):
        predictions = np.argmax(predictions, axis=2)
        true_labels_flat, pred_labels_flat = [], []
        for pred_seq, label_seq in zip(predictions, labels):
            for pred, label in zip(pred_seq, label_seq):
                if label != -100:
                    true_labels_flat.append(label)
                    pred_labels_flat.append(pred)
        precision = precision_score(true_labels_flat, pred_labels_flat, average='weighted', zero_division=0)
        recall = recall_score(true_labels_flat, pred_labels_flat, average='weighted', zero_division=0)
        f1 = f1_score(true_labels_flat, pred_labels_flat, average='weighted', zero_division=0)
        return precision, recall, f1
    
    trainer = WeightedNERTrainer(
        tag_counts=tag_counts,
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        data_collator=DataCollatorForTokenClassification(tokenizer=tokenizer),
    )
    
    # Manual epoch loop with sklearn evaluation
    for epoch in range(epochs):
        print(f"\nTraining Epoch {epoch + 1}/{epochs}")
        trainer.train()
        
        # Manual evaluation on validation set
        model.eval()
        val_predictions, val_labels = [], []
        with torch.no_grad():
            for batch in trainer.get_eval_dataloader():
                outputs = model(**{k: v.to(model.device) for k, v in batch.items()})
                val_predictions.append(outputs.logits.cpu().numpy())
                val_labels.append(batch['labels'].cpu().numpy())
        
        val_predictions = np.concatenate(val_predictions, axis=0)
        val_labels = np.concatenate(val_labels, axis=0)
        precision, recall, f1 = compute_metrics(val_predictions, val_labels)
        
        print(f"Epoch {epoch + 1} Metrics:")
        print(f"Precision: {precision:.4f}")
        print(f"Recall: {recall:.4f}")
        print(f"F1-Score: {f1:.4f}")
    
    # Final evaluation
    print("\nFinal Model Evaluation:")
    final_predictions, final_labels = [], []
    with torch.no_grad():
        for batch in trainer.get_eval_dataloader():
            outputs = model(**{k: v.to(model.device) for k, v in batch.items()})
            final_predictions.append(outputs.logits.cpu().numpy())
            final_labels.append(batch['labels'].cpu().numpy())
    
    final_predictions = np.concatenate(final_predictions, axis=0)
    final_labels = np.concatenate(final_labels, axis=0)
    final_precision, final_recall, final_f1 = compute_metrics(final_predictions, final_labels)
    
    print(f"Final Precision: {final_precision:.4f}")
    print(f"Final Recall: {final_recall:.4f}")
    print(f"Final F1-Score: {final_f1:.4f}")
    
    # Save the model and tokenizer
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    print(f"Model saved to {output_dir}")
    return model, tokenizer

# 9. Inference
def predict(model, tokenizer, text):
    text = text.split()
    text, _ = split_contractions(text, ['O'] * len(text))
    encoding = tokenizer(text, return_tensors='pt', truncation=True, padding=True, is_split_into_words=True)
    with torch.no_grad():
        outputs = model(**encoding)
        predictions = torch.argmax(outputs.logits, dim=-1)[0].numpy()
    tokens = tokenizer.convert_ids_to_tokens(encoding['input_ids'][0])
    predicted_tags = [id2tag[pred] for pred in predictions]
    return list(zip(tokens, predicted_tags))

if __name__ == "__main__":
    csv_path = r"C:\Users\tagle\OneDrive\Desktop\Thesis\ExpoProject\Backend\NER Data.csv"
    model, tokenizer = train_model(csv_path)
    test_text = "What's the fare to Manila"
    predictions = predict(model, tokenizer, test_text)
    print("\nPrediction Results:")
    for token, tag in predictions:
        print(f"{token}: {tag}")