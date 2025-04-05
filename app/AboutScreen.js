import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native"; // Added TouchableOpacity
import { Ionicons } from "@expo/vector-icons";

const teamMembers = [
  {
    name: "Lars John Tagle",
    role: "Software Developer",
    image: "https://via.placeholder.com/100",
  },
  {
    name: "Daniel Cedeño",
    role: "Software Developer",
    image: "https://via.placeholder.com/100",
  },
  {
    name: "Luar Matthew Basilla",
    role: "Software Developer",
    image: "https://via.placeholder.com/100",
  },
];

const AboutScreen = ({ navigation, toggleDrawer }) => {
  React.useEffect(() => {
    console.log("AboutScreen mounted");
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            console.log("Drawer button pressed");
            toggleDrawer();
          }}
          style={styles.drawerButton}
        >
          <Ionicons name="menu" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.legazpin}>LegazPin</Text>
          <Text style={styles.version}>Version 1.0.1</Text>
          <Text style={styles.description}>
            LegazPin is an AI-powered chatbot designed to simplify commuting and
            navigation in Legazpi City by providing real-time information on
            jeepney routes, fares, travel times, and popular destinations. Using
            NLP and Google Maps integration, it offers accurate and personalized
            recommendations.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.featureTitle}>How It Works</Text>
          <Text style={styles.howItWorksText}>
            1️⃣ Enter your location and destination.{"\n"}
            2️⃣ LegazPIN suggests the best routes and fares.{"\n"}
            3️⃣ Get real-time navigation and updates!
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.featureTitle}>Features</Text>
          <View style={styles.featureRow}>
            <Ionicons
              name="flash-outline"
              size={20}
              color="#6366F1"
              style={styles.icon}
            />
            <Text>Fast Response Generation</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons
              name="chatbubbles-outline"
              size={20}
              color="#6366F1"
              style={styles.icon}
            />
            <Text>Natural Conversations</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons
              name="map-outline"
              size={20}
              color="#6366F1"
              style={styles.icon}
            />
            <Text>Google Maps Integration</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.featureTitle}>Meet the Team</Text>
          {/* Uncomment if you want to show team members
          {teamMembers.map((member, index) => (
            <View key={index} style={styles.teamMember}>
              <Image source={{ uri: member.image }} style={styles.profileImage} />
              <View>
                <Text style={styles.name}>{member.name}</Text>
                <Text style={styles.role}>{member.role}</Text>
              </View>
            </View>
          ))}
          */}
        </View>

        <View style={styles.card}>
          <Text style={styles.featureTitle}>Contact Us</Text>
          <View style={styles.featureRow}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#6366F1"
              style={styles.icon}
            />
            <Text>support@legazpin.com</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons
              name="globe-outline"
              size={20}
              color="#6366F1"
              style={styles.icon}
            />
            <Text>www.legazpin.com</Text>
          </View>
        </View>

        <Text style={styles.footer}>© 2025 LegaPin. All rights reserved.</Text>
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
  scrollContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "white",
    padding: 15,
    margin: 10,
    borderRadius: 10,
    elevation: 3,
  },
  legazpin: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "blue",
  },
  version: {
    fontSize: 14,
    textAlign: "center",
    color: "gray",
  },
  description: {
    marginTop: 10,
    textAlign: "center",
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  teamMember: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  role: {
    fontSize: 14,
    color: "gray",
  },
  howItWorksText: {
    textAlign: "center",
    marginBottom: 10,
  },
  footer: {
    textAlign: "center",
    padding: 10,
    fontSize: 12,
    color: "gray",
  },
});

export default AboutScreen;
