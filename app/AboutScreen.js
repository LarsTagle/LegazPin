import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const teamMembers = [
  {
    firstName: "Luar Matthew",
    lastName: "Basilla",
    role: "Software Developer",
    image: require("../assets/Luar Pic.png"),
  },
  {
    firstName: "Daniel",
    lastName: "Cedeño",
    role: "Software Developer",
    image: require("../assets/Dhani Pic.png"),
  },
  {
    firstName: "Lars John",
    lastName: "Tagle",
    role: "Software Developer",
    image: require("../assets/Lars Pic.png"),
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
          <View style={styles.featureRow}>
            <Ionicons
              name="build-outline"
              size={20}
              color="#6366F1"
              style={styles.contactIcon}
            />
            <Text style={{ fontFamily: "Fredoka-Regular" }}>
              Enter your location and destination.
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons
              name="build-outline"
              size={20}
              color="#6366F1"
              style={styles.contactIcon}
            />
            <Text style={{ fontFamily: "Fredoka-Regular" }}>
              LegazPIN suggests the best routes and fares.
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons
              name="build-outline"
              size={20}
              color="#6366F1"
              style={styles.contactIcon}
            />
            <Text style={{ fontFamily: "Fredoka-Regular" }}>
              Get real-time navigation and updates!
            </Text>
          </View>
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
            <Text style={{ fontFamily: "Fredoka-Regular" }}>
              Fast Response Generation
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons
              name="chatbubbles-outline"
              size={20}
              color="#6366F1"
              style={styles.icon}
            />
            <Text style={{ fontFamily: "Fredoka-Regular" }}>
              Natural Conversations
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons
              name="map-outline"
              size={20}
              color="#6366F1"
              style={styles.icon}
            />
            <Text style={{ fontFamily: "Fredoka-Regular" }}>
              Google Maps Integration
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.featureTitle}>Meet the Team</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.teamScrollContent}
          >
            {teamMembers.map((member, index) => (
              <View key={index} style={styles.teamMember}>
                <Image
                  source={member.image} // Updated to use require directly
                  style={styles.profileImage}
                />
                <View style={styles.teamMemberText}>
                  <Text style={styles.firstName}>{member.firstName}</Text>
                  <Text style={styles.lastName}>{member.lastName}</Text>
                  <Text style={styles.role}>{member.role}</Text>
                  <View style={styles.contactIcons}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color="#6366F1"
                      style={styles.contactIcon}
                    />
                    <Ionicons
                      name="call-outline"
                      size={20}
                      color="#6366F1"
                      style={styles.contactIcon}
                    />
                    <Ionicons
                      name="logo-twitter"
                      size={20}
                      color="#6366F1"
                      style={styles.contactIcon}
                    />
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
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
            <Text
              style={{ textAlign: "center", fontFamily: "Fredoka-Regular" }}
            >
              support@legazpin.com
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons
              name="globe-outline"
              size={20}
              color="#6366F1"
              style={styles.icon}
            />
            <Text
              style={{ textAlign: "center", fontFamily: "Fredoka-Regular" }}
            >
              www.legazpin.com
            </Text>
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
    fontFamily: "Fredoka-Regular",
  },
  version: {
    fontSize: 14,
    textAlign: "center",
    color: "gray",
    fontFamily: "Fredoka-Regular",
  },
  description: {
    marginTop: 10,
    textAlign: "center",
    fontFamily: "Fredoka-Regular",
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
    fontFamily: "Fredoka-Regular",
  },
  featureRow: {
    flexDirection: "row",
    alignSelf: "center",
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  teamScrollContent: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  teamMember: {
    alignItems: "center",
    marginRight: 15,
    width: 200,
  },
  profileImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
    marginBottom: 5,
  },
  teamMemberText: {
    alignItems: "center",
  },
  firstName: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Fredoka-Regular",
  },
  lastName: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Fredoka-Regular",
  },
  role: {
    fontSize: 12,
    color: "gray",
    textAlign: "center",
    marginBottom: 5,
    fontFamily: "Fredoka-Regular",
  },
  contactIcons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 120,
  },
  contactIcon: {
    marginHorizontal: 5,
  },
  footer: {
    textAlign: "center",
    padding: 10,
    fontSize: 12,
    color: "gray",
    fontFamily: "Fredoka-Regular",
  },
});

export default AboutScreen;
