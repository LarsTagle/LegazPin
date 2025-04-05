import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

const FeedbackScreen = ({ navigation, toggleDrawer }) => {
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Error", "Please select a rating.");
      return;
    }

    try {
      await addDoc(collection(db, "feedback"), {
        rating,
        feedbackText,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Thank you for your feedback!");
      setRating(0);
      setFeedbackText("");
    } catch (error) {
      Alert.alert("Error", "Failed to submit feedback.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F1F4F8" }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.drawerButton}>
          <Ionicons name="menu" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Feedback</Text>
      </View>

      <View style={{ flex: 1, padding: 20 }}>
        <View style={styles.card}>
          <Text style={styles.title}>Rate Your Experience</Text>
          <Text style={{ textAlign: "center" }}>
            Help us improve by sharing your feedback.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>How would you rate our service?</Text>

          <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={{ paddingHorizontal: 7 }}
              >
                <Ionicons
                  name={rating >= star ? "star" : "star-outline"}
                  size={32}
                  color={rating >= star ? "gold" : "gray"}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subtitle}>Tell us what you think</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Share your experience with us..."
            multiline
            value={feedbackText}
            onChangeText={setFeedbackText}
          />

          <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
            <Text style={styles.submitText}>Submit Feedback</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = {
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 30,
    paddingHorizontal: 10,
    height: 90,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  drawerButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
  },
  card: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  starContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
    fontWeight: "bold",
  },
  textInput: {
    height: 80,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    backgroundColor: "#F1F4F8",
  },
  submitButton: {
    backgroundColor: "#4F46E5",
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
  },
  submitText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
};

export default FeedbackScreen;
