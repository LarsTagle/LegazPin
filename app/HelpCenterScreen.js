import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const HelpCenterScreen = ({ toggleDrawer }) => {
  const [faqOpen, setFaqOpen] = useState(null);
  const navigation = useNavigation();

  const faqs = [
    {
      category: "Using the Chatbot",
      questions: [
        {
          question: "How do I start a conversation?",
          answer:
            "Simply type your query in the Home screen's chat input, and the chatbot will respond instantly!",
        },
        {
          question: "Can I get fare estimates?",
          answer:
            "Yes, ask for fare estimates by specifying your start and end locations, e.g., 'Fare from Daraga to Legazpi Port.'",
        },
        {
          question: "What if I get an error message from the chatbot?",
          answer:
            "Try rephrasing your query or check your internet connection. If the issue persists, contact support.",
        },
      ],
    },
    {
      category: "Navigating Routes",
      questions: [
        {
          question: "How do I find jeepney routes?",
          answer:
            "Enter your current location and destination in the chat or use the Map screen to set start and end points.",
        },
        {
          question: "Can LegazPin work offline?",
          answer:
            "LegazPin requires an internet connection for real-time route and fare information.",
        },
      ],
    },
  ];

  const openEmail = () => {
    const mailtoUrl = `mailto:support@legazpin.com`;
    Linking.openURL(mailtoUrl).catch((err) =>
      console.error("Failed to open email:", err)
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.drawerButton}>
          <Ionicons name="menu" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
      </View>

      <ScrollView style={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Getting Started</Text>
          <Text style={styles.subtitle}>
            Welcome to LegazPin! Here's how to make the most of our features:
          </Text>
          <View style={styles.featureContainer}>
            <View style={styles.featureRow}>
              <Ionicons
                name="chatbubbles-outline"
                size={20}
                color="#6366F1"
                style={styles.icon}
              />
              <Text style={styles.featureText}>
                Chat with AI to find jeepney routes, fares, and travel times.
              </Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons
                name="map-outline"
                size={20}
                color="#6366F1"
                style={styles.icon}
              />
              <Text style={styles.featureText}>
                Explore popular spots with the AI Tour Guide.
              </Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons
                name="settings-outline"
                size={20}
                color="#6366F1"
                style={styles.icon}
              />
              <Text style={styles.featureText}>
                Customize your experience for a smoother commute.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Frequently Asked Questions</Text>
          {faqs.map((category, catIndex) => (
            <View key={catIndex} style={styles.faqCategory}>
              <Text style={styles.categoryTitle}>{category.category}</Text>
              {category.questions.map((item, index) => (
                <TouchableOpacity
                  key={`${catIndex}-${index}`}
                  onPress={() =>
                    setFaqOpen(
                      faqOpen === `${catIndex}-${index}`
                        ? null
                        : `${catIndex}-${index}`
                    )
                  }
                  style={styles.faqItem}
                >
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{item.question}</Text>
                    <Ionicons
                      name={
                        faqOpen === `${catIndex}-${index}`
                          ? "chevron-up"
                          : "chevron-down"
                      }
                      size={20}
                    />
                  </View>
                  {faqOpen === `${catIndex}-${index}` && (
                    <Text style={styles.faqAnswer}>{item.answer}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Troubleshooting</Text>
          <View style={styles.featureRow}>
            <Ionicons
              name="warning-outline"
              size={20}
              color="#6366F1"
              style={styles.icon}
            />
            <Text style={styles.featureText}>
              <Text style={styles.bold}>Location not detected:</Text> Ensure
              location permissions are enabled in your device settings.
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons
              name="warning-outline"
              size={20}
              color="#6366F1"
              style={styles.icon}
            />
            <Text style={styles.featureText}>
              <Text style={styles.bold}>Chatbot not responding:</Text> Check
              your internet connection or try rephrasing your query.
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons
              name="warning-outline"
              size={20}
              color="#6366F1"
              style={styles.icon}
            />
            <Text style={styles.featureText}>
              <Text style={styles.bold}>Route not found:</Text> Verify that both
              locations are within Albay.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Tips & Tricks</Text>
          <View style={styles.featureRow}>
            <Ionicons
              name="bulb-outline"
              size={20}
              color="#6366F1"
              style={styles.icon}
            />
            <Text style={styles.featureText}>
              <Text style={styles.proTip}>Pro Tip:</Text> Instead of “Route to
              Legazpi,” try “Jeepney route from Daraga to Legazpi Port.”
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons
              name="bulb-outline"
              size={20}
              color="#6366F1"
              style={styles.icon}
            />
            <Text style={styles.featureText}>
              <Text style={styles.proTip}>Pro Tip:</Text> Use landmarks, e.g.,
              “What's near Albay Cathedral?” for better results.
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons
              name="bulb-outline"
              size={20}
              color="#6366F1"
              style={styles.icon}
            />
            <Text style={styles.featureText}>
              <Text style={styles.proTip}>Pro Tip:</Text> Keep queries concise
              to save time, e.g., “Fare from SM City to Albay.”
            </Text>
          </View>
        </View>

        <View style={[styles.card, { marginBottom: 50 }]}>
          <Text style={styles.title}>Contact Support</Text>
          <TouchableOpacity style={styles.contactButton} onPress={openEmail}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="white"
              style={styles.icon}
            />
            <Text style={styles.contactButtonText}>
              Email Us: support@legazpin.com
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.feedbackButton}
            onPress={() => navigation.navigate("Feedback")}
          >
            <Text style={styles.feedbackButtonText}>
              Didn't find what you need? Share Feedback
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F4F8",
  },
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
    fontFamily: "Fredoka-Regular",
  },
  scrollContent: {
    padding: 20,
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
    fontFamily: "Fredoka-Regular",
  },
  subtitle: {
    textAlign: "left",
    color: "#6b7280",
    marginBottom: 10,
    flexWrap: "wrap",
    fontFamily: "Fredoka-Regular",
  },
  featureContainer: {
    paddingRight: 20,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  featureText: {
    fontFamily: "Fredoka-Regular",
    fontSize: 14,
    flex: 1,
  },
  bold: {
    fontWeight: "bold",
  },
  proTip: {
    color: "#6366F1",
    fontWeight: "bold",
  },
  faqCategory: {
    marginBottom: 15,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4F46E5",
    marginBottom: 10,
    fontFamily: "Fredoka-Regular",
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
  faqQuestion: {
    fontSize: 16,
    fontFamily: "Fredoka-Regular",
    flex: 1,
  },
  faqAnswer: {
    marginTop: 5,
    color: "#555",
    fontFamily: "Fredoka-Regular",
  },
  contactButton: {
    backgroundColor: "#4F46E5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  contactButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Fredoka-Regular",
    marginLeft: 8,
  },
  feedbackButton: {
    marginTop: 10,
  },
  feedbackButtonText: {
    fontSize: 14,
    color: "#4F46E5",
    textAlign: "center",
    fontFamily: "Fredoka-Regular",
  },
  backButton: {
    marginBottom: 20,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 14,
    color: "#4F46E5",
    fontFamily: "Fredoka-Regular",
  },
});

export default HelpCenterScreen;
