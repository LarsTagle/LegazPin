import torch
import tensorflow as tf
import numpy as np
from transformers import DistilBertTokenizerFast, TFDistilBertForSequenceClassification, DistilBertForTokenClassification
import pickle
import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os

# Initialize FastAPI
app = FastAPI()

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL, e.g., ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase
cred = credentials.Certificate("C:/Users/tagle/OneDrive/Desktop/Thesis/ExpoProject/Backend/firebase-adminsdk.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# === Intent Model Setup ===
intent_model_dir = 'intent_model_distilbert'
intent_tokenizer = DistilBertTokenizerFast.from_pretrained(intent_model_dir)
intent_model = TFDistilBertForSequenceClassification.from_pretrained(intent_model_dir)
with open('intent_mlb.pkl', 'rb') as f:
    mlb = pickle.load(f)
intent_classes = mlb.classes_
max_length = 30

# === NER Model Setup ===
ner_model_dir = './ner_model'
ner_tokenizer = DistilBertTokenizerFast.from_pretrained(ner_model_dir)
ner_model = DistilBertForTokenClassification.from_pretrained(ner_model_dir)
TAGS = ['O', 'B-FARE', 'I-FARE', 'B-DESTINATION', 'I-DESTINATION', 'B-TRANSPORT', 'I-TRANSPORT', 'B-DISCOUNT', 
        'B-ORIGIN', 'I-ORIGIN', 'B-ROUTE', 'I-ROUTE', 'B-TIME', 'I-TIME', 'B-COMMUTER', 'I-COMMUTER', 
        'B-LOCATION', 'I-LOCATION', 'B-ACTIVITY', 'I-ACTIVITY', 'B-PURPOSE', 'I-PURPOSE', 'B-EVENT', 'I-EVENT', 
        'B-SUGGEST', 'I-SUGGEST', 'B-CONDITION', 'I-CONDITION', 'B-DISTANCE', 'I-DISTANCE', 'B-ATTRACTION', 
        'I-ATTRACTION', 'B-ALTERNATIVE', 'I-ALTERNATIVE']
tag2id = {tag: idx for idx, tag in enumerate(TAGS)}
id2tag = {idx: tag for tag, idx in tag2id.items()}

# Pydantic model for request body
class QueryRequest(BaseModel):
    message: str

# Intent prediction function
def predict_intent(query):
    query = query.strip()
    if not query:
        return ["Error: Empty query provided"]
    delimiters = [" and ", " & ", ",", ";", " then "]
    sub_queries = [query]
    for delim in delimiters:
        sub_queries = [sub_q for q in sub_queries for sub_q in q.split(delim)]
    sub_queries = [q.strip() for q in sub_queries if q.strip()]
    
    predicted_intents = []
    for sub_query in sub_queries:
        encoding = intent_tokenizer(
            [sub_query],
            add_special_tokens=True,
            max_length=max_length,
            padding='max_length',
            truncation=True,
            return_tensors='tf'
        )
        batch = {'input_ids': encoding['input_ids'], 'attention_mask': encoding['attention_mask']}
        outputs = intent_model(batch, training=False)
        probabilities = tf.sigmoid(outputs.logits).numpy()[0]
        sorted_probs = np.sort(probabilities)[::-1]
        max_prob = sorted_probs[0]
        margin = sorted_probs[0] - sorted_probs[1]
        ood_prob_threshold = 0.3
        ood_margin_threshold = 0.1
        if max_prob < ood_prob_threshold or margin < ood_margin_threshold:
            predicted_intents.append("ood_intent")
        else:
            threshold = 0.4
            intents = [intent_classes[idx] for idx, prob in enumerate(probabilities) if prob >= threshold]
            predicted_intents.extend(intents if intents else ["No intent predicted for: " + sub_query])
    seen = set()
    predicted_intents = [x for x in predicted_intents if not (x in seen or seen.add(x))]
    return predicted_intents if predicted_intents else ["No intents predicted"]

# NER prediction function
def split_contractions(text, tags):
    new_text, new_tags = [], []
    for token, tag in zip(text, tags):
        if token.lower() in ["what's", "how's", "isn't", "doesn't", "can't"]:
            expansions = {
                "what's": ["What", "'s"], "how's": ["How", "'s"], "isn't": ["is", "n't"],
                "doesn't": ["does", "n't"], "can't": ["can", "n't"]
            }
            new_text.extend(expansions[token.lower()])
            new_tags.extend([tag, tag])
        else:
            new_text.append(token)
            new_tags.append(tag)
    return new_text, new_tags

def predict_ner(query):
    text = query.split()
    text, _ = split_contractions(text, ['O'] * len(text))
    encoding = ner_tokenizer(text, return_tensors='pt', truncation=True, padding=True, is_split_into_words=True)
    with torch.no_grad():
        outputs = ner_model(**encoding)
        predictions = torch.argmax(outputs.logits, dim=-1)[0].numpy()
    tokens = ner_tokenizer.convert_ids_to_tokens(encoding['input_ids'][0])
    predicted_tags = [id2tag[pred] for pred in predictions]
    
    entities = {}
    current_entity = None
    current_type = None
    for token, tag in zip(tokens, predicted_tags):
        if tag.startswith('B-'):
            if current_entity:
                entities[current_type] = entities.get(current_type, []) + [current_entity]
            current_entity = token.replace('##', '')
            current_type = tag[2:]
        elif tag.startswith('I-') and current_type == tag[2:]:
            current_entity += ' ' + token.replace('##', '')
        else:
            if current_entity:
                entities[current_type] = entities.get(current_type, []) + [current_entity]
            current_entity = None
            current_type = None
    if current_entity:
        entities[current_type] = entities.get(current_type, []) + [current_entity]
    return entities

# Fetch data from Firestore based on intent and entities
def fetch_firestore_data(intent, entities):
    response_data = {}
    
    if intent in ["get_fare", "check_fare"]:
        distance = entities.get("DISTANCE", [None])[0]
        discount = "DISCOUNT" in entities
        query = db.collection("fares")
        if distance:
            try:
                distance_value = float(distance.split()[0])
                print(f"Querying fares for distance: {distance_value}")
                query = query.where("distance", "==", distance_value)
            except (ValueError, AttributeError) as e:
                print(f"Error parsing distance '{distance}': {str(e)}")
                response_data["fares"] = []
                return response_data
        docs = query.stream()
        fares = []
        for doc in docs:
            data = doc.to_dict()
            fare = data["discounted"] if discount else data["regular"]
            fares.append({"distance": data["distance"], "fare": fare})
            print(f"Found fare for distance {data['distance']}: {'discounted' if discount else 'regular'} = {fare}")
        if not fares:
            print("No fares found for the given distance.")
        response_data["fares"] = fares
    
    elif intent in ["get_route", "find_route"]:
        origin = entities.get("ORIGIN", [None])[0]
        destination = entities.get("DESTINATION", [None])[0]
        query = db.collection("routes")
        if origin:
            print(f"Querying routes with start: {origin}")
            query = query.where("start", "==", origin)
        if destination:
            print(f"Querying routes with end: {destination}")
            query = query.where("end", "==", destination)
        docs = query.stream()
        routes = []
        for doc in docs:
            data = doc.to_dict()
            routes.append({
                "name": data["name"],
                "start": data["start"],
                "end": data["end"],
                "distance": data["distance"],
                "via": data.get("via", []),
                "landmarks": data.get("landmarks", []),
                "zones": data.get("zones", []),
                "startCoords": data.get("startCoords", {}),
                "endCoords": data.get("endCoords", {}),
                "isPrimary": data.get("isPrimary", False)
            })
            print(f"Found route: {data['name']} from {data['start']} to {data['end']}")
        if not routes:
            print("No routes found for the given origin and destination.")
        response_data["routes"] = routes
    
    elif intent in ["get_feedback", "check_feedback"]:
        print("Querying recent feedback...")
        docs = db.collection("feedback").order_by("createdAt", direction=firestore.Query.DESCENDING).limit(5).stream()
        feedback = [{"rating": doc.to_dict()["rating"], "text": doc.to_dict()["feedbackText"]} for doc in docs]
        if not feedback:
            print("No feedback found.")
        response_data["feedback"] = feedback
    
    return response_data

# Generate response 
def generate_response(query, intents, entities, firestore_data):
    responses = []
    rasa_payload = {
        "sender": "user",
        "message": query,
        "metadata": {"intents": intents, "entities": entities, "firestore_data": firestore_data}
    }
    try:
        # Handle each intent separately to ensure all are processed
        for intent in intents:
            rasa_payload["metadata"]["intents"] = [intent]  # Process one intent at a time
            response = requests.post("http://localhost:5005/webhooks/rest/webhook", json=rasa_payload)
            response.raise_for_status()
            rasa_responses = response.json()
            responses.extend([msg["text"] for msg in rasa_responses])
        return " ".join(responses)
    except requests.exceptions.RequestException as e:
        return f"Error calling Rasa: {str(e)}"

# FastAPI endpoint
@app.post("/predict")
async def predict(request: QueryRequest):
    try:
        query = request.message
        intents = predict_intent(query)
        entities = predict_ner(query)
        firestore_data = fetch_firestore_data(intents[0] if intents else None, entities)
        response = generate_response(query, intents, entities, firestore_data)
        return {"response": response, "intent": intents, "entities": entities}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# Run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)