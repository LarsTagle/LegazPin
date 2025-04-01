import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

const FeedbackScreen = () => {
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");

  // Moved handleSubmit inside the component
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
    <View style={{ flex: 1, padding: 20, backgroundColor: "#F1F4F8" }}>
      <View
        style={{
          backgroundColor: "white",
          padding: 15,
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          Rate Your Experience
        </Text>
        <Text style={{ textAlign: "center" }}>
          Help us improve by sharing your feedback.
        </Text>
      </View>

      <View
        style={{
          backgroundColor: "white",
          padding: 15,
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          How would you rate our service?
        </Text>

        {/* Star Rating */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginVertical: 10,
          }}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={{ paddingLeft: 7, paddingRight: 7 }}
            >
              <Ionicons
                name={rating >= star ? "star" : "star-outline"}
                size={32}
                color={rating >= star ? "gold" : "gray"}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Text Input for Feedback */}
        <Text
          style={{
            fontSize: 16,
            marginTop: 10,
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          Tell us what you think
        </Text>
        <TextInput
          style={{
            height: 80,
            borderColor: "#ddd",
            borderWidth: 1,
            borderRadius: 5,
            padding: 10,
            marginTop: 10,
            backgroundColor: "#F1F4F8",
          }}
          placeholder="Share your experience with us..."
          multiline
          value={feedbackText}
          onChangeText={setFeedbackText}
        />

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          style={{
            backgroundColor: "#4F46E5",
            padding: 15,
            borderRadius: 8,
            marginTop: 15,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
            Submit Feedback
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FeedbackScreen;
