import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const HelpCenter = () => {
  const [faqOpen, setFaqOpen] = useState(null);

  const faqs = [
    {
      question: "How do I start a conversation?",
      answer: "Simply type your query and the chatbot will respond!",
    },
    {
      question: "How do I find jeepney routes?",
      answer:
        "Enter your current location and destination to see the best routes.",
    },
    {
      question: "Can I get fare estimates?",
      answer: "Yes, the chatbot provides fare estimates for different routes.",
    },
  ];

  return (
    <ScrollView style={{ padding: 20, backgroundColor: "#F1F4F8" }}>
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
          Getting Started
        </Text>
        <Text
          style={{
            textAlign: "left",
            color: "#6b7280",
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          Welcome to LegazPIN! Here's how to make the most of our features:
        </Text>
        <View style={{ paddingRight: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={20}
              color="#6366F1"
              style={{ marginRight: 8 }}
            />
            <Text>
              Chat with AI to find jeepney routes, fares, and travel times.
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Ionicons
              name="map-outline"
              size={20}
              color="#6366F1"
              style={{ marginRight: 8 }}
            />
            <Text>Explore popular spots with the AI Tour Guide.</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="settings-outline"
              size={20}
              color="#6366F1"
              style={{ marginRight: 8 }}
            />
            <Text>Customize your experience for a smoother commute.</Text>
          </View>
        </View>
      </View>

      {/* FAQ Section */}
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
          Frequently Asked Questions
        </Text>
        {faqs.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setFaqOpen(faqOpen === index ? null : index)}
            style={{
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: "#ddd",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 16 }}>{item.question}</Text>
              <Ionicons
                name={faqOpen === index ? "chevron-up" : "chevron-down"}
                size={20}
              />
            </View>
            {faqOpen === index && (
              <Text style={{ marginTop: 5, color: "#555" }}>{item.answer}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tips & Tricks Section */}
      <View style={{ backgroundColor: "white", padding: 15, borderRadius: 10 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          Tips & Tricks
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Ionicons
            name="bulb-outline"
            size={20}
            color="#6366F1"
            style={{ marginRight: 8 }}
          />
          <Text>Be specific in your route descriptions.</Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Ionicons
            name="time-outline"
            size={20}
            color="#6366F1"
            style={{ marginRight: 8 }}
          />
          <Text>Use concise requests to save time.</Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons
            name="options-outline"
            size={20}
            color="#6366F1"
            style={{ marginRight: 8 }}
          />
          <Text>Refine your results as needed.</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default HelpCenter;
