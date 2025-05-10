import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const HomeScreen = ({ toggleDrawer }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.drawerButton}>
          <Ionicons name="menu" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Welcome to </Text>
        <Image
          source={require("../assets/LegazPin Logo Black.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <ScrollView>
        <View style={styles.content}>
          <Text style={styles.tagline}>
            Your AI Guide to Legazpi City's Jeepney Routes & More!
          </Text>

          <View style={styles.card}>
            <Text style={styles.title}>Meet LegazPin</Text>
            <Text style={styles.description}>
              LegazPin is your AI-powered travel companion for navigating
              Legazpi City. Here's what you can do:
            </Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>
                • <Text style={styles.bold}>Discover jeepney routes</Text> in
                seconds
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>
                • <Text style={styles.bold}>Get fare estimates</Text> and travel
                times
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>
                • <Text style={styles.bold}>Explore Legazpi's top spots</Text>{" "}
                with ease
              </Text>
            </View>
            <Text style={styles.trustBadge}>Powered by AI & Google Maps</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Try This!</Text>
            <View style={styles.queryCallout}>
              <Ionicons
                name="chatbubble-outline"
                size={20}
                color="#6366F1"
                style={styles.icon}
              />
              <Text style={styles.featureText}>
                Ask: “Jeepney route from SM City to Albay Cathedral”
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>What Can LegazPin Do?</Text>
            <View style={styles.featureRow}>
              <Ionicons
                name="map-outline"
                size={20}
                color="#6366F1"
                style={styles.icon}
              />
              <Text style={styles.featureText}>
                Find the best jeepney routes
              </Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons
                name="cash-outline"
                size={20}
                color="#6366F1"
                style={styles.icon}
              />
              <Text style={styles.featureText}>Get fare estimates</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons
                name="time-outline"
                size={20}
                color="#6366F1"
                style={styles.icon}
              />
              <Text style={styles.featureText}>Check travel times</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons
                name="compass-outline"
                size={20}
                color="#6366F1"
                style={styles.icon}
              />
              <Text style={styles.featureText}>Explore nearby landmarks</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Tips for Great Queries</Text>
            <View style={styles.featureRow}>
              <Ionicons
                name="bulb-outline"
                size={20}
                color="#6366F1"
                style={styles.icon}
              />
              <Text style={styles.featureText}>
                Be specific: “Jeepney route from SM City to Albay Cathedral”
              </Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons
                name="chatbubble-outline"
                size={20}
                color="#6366F1"
                style={styles.icon}
              />
              <Text style={styles.featureText}>
                Keep it concise: “Fare from Daraga to Legazpi Port”
              </Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons
                name="search-outline"
                size={20}
                color="#6366F1"
                style={styles.icon}
              />
              <Text style={styles.featureText}>
                Try asking: “What's near Legazpi Boulevard?”
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.startButton, styles.prominentButton]}
            onPress={() => navigation.navigate("Chat")}
          >
            <Text style={styles.startButtonText}>Let's Start Chatting!</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("HelpCenter")}
          >
            <Text style={styles.secondaryButtonText}>
              Need Help? Explore Our Help Center
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
  logo: {
    width: 100,
    height: 50,
    marginTop: 5,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  tagline: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4F46E5",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Fredoka-Regular",
  },
  card: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 20,
    borderRadius: 10,
    width: "100%",
    elevation: 3,
  },
  highlightCard: {
    backgroundColor: "linear-gradient(135deg, #F1F4F8, #E0E7FF)", // Fallback color
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    fontFamily: "Fredoka-Regular",
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    color: "#555",
    fontFamily: "Fredoka-Regular",
    marginBottom: 10,
  },
  bulletPoint: {
    marginBottom: 5,
  },
  bulletText: {
    fontSize: 14,
    fontFamily: "Fredoka-Regular",
  },
  bold: {
    fontWeight: "bold",
  },
  trustBadge: {
    fontSize: 12,
    color: "#6366F1",
    textAlign: "center",
    marginTop: 10,
    fontFamily: "Fredoka-Regular",
  },
  queryCallout: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0E7FF",
    padding: 10,
    borderRadius: 8,
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
    fontSize: 14,
    fontFamily: "Fredoka-Regular",
    flex: 1,
  },
  startButton: {
    backgroundColor: "#4F46E5",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
  },
  prominentButton: {
    paddingVertical: 18,
    paddingHorizontal: 40,
  },
  startButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Fredoka-Regular",
  },
  secondaryButton: {
    marginTop: 10,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: "#4F46E5",
    textAlign: "center",
    fontFamily: "Fredoka-Regular",
  },
});

export default HomeScreen;
