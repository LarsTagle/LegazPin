import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const HelpCenterScreen = ({ navigation, toggleDrawer }) => {
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
    <View style={{ flex: 1, backgroundColor: "#F1F4F8" }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.drawerButton}>
          <Ionicons name="menu" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
      </View>

      <ScrollView style={{ padding: 20 }}>
        <View style={styles.card}>
          <Text style={styles.title}>Getting Started</Text>
          <Text style={styles.subtitle}>
            Welcome to LegazPIN! Here's how to make the most of our features:
          </Text>
          <View style={{ paddingRight: 20 }}>
            <View style={styles.featureRow}>
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
            <View style={styles.featureRow}>
              <Ionicons
                name="map-outline"
                size={20}
                color="#6366F1"
                style={{ marginRight: 8 }}
              />
              <Text>Explore popular spots with the AI Tour Guide.</Text>
            </View>
            <View style={styles.featureRow}>
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

        <View style={styles.card}>
          <Text style={styles.title}>Frequently Asked Questions</Text>
          {faqs.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setFaqOpen(faqOpen === index ? null : index)}
              style={styles.faqItem}
            >
              <View style={styles.faqHeader}>
                <Text style={{ fontSize: 16 }}>{item.question}</Text>
                <Ionicons
                  name={faqOpen === index ? "chevron-up" : "chevron-down"}
                  size={20}
                />
              </View>
              {faqOpen === index && (
                <Text style={{ marginTop: 5, color: "#555" }}>
                  {item.answer}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Tips & Tricks</Text>
          <View style={styles.featureRow}>
            <Ionicons
              name="bulb-outline"
              size={20}
              color="#6366F1"
              style={{ marginRight: 8 }}
            />
            <Text>Be specific in your route descriptions.</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons
              name="time-outline"
              size={20}
              color="#6366F1"
              style={{ marginRight: 8 }}
            />
            <Text>Use concise requests to save time.</Text>
          </View>
          <View style={styles.featureRow}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 30,
    paddingHorizontal: 10,
    height: 70,
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
  subtitle: {
    textAlign: "left",
    color: "#6b7280",
    marginBottom: 10,
    flexWrap: "wrap",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  faqItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

export default HelpCenterScreen;
