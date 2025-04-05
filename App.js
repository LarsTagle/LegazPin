import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import Ionicons from "react-native-vector-icons/Ionicons";
import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";

// Import all your screens
import HomeScreen from "./app/HomeScreen";
import AboutScreen from "./app/AboutScreen";
import FeedbackScreen from "./app/FeedbackScreen";
import HelpCenterScreen from "./app/HelpCenterScreen";

const Stack = createStackNavigator();

export default function App() {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const slideAnim = React.useRef(new Animated.Value(-250)).current; // Start off-screen (left)

  // Toggle drawer open/close
  const toggleDrawer = () => {
    const toValue = isDrawerOpen ? -250 : 0; // Slide in or out
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setIsDrawerOpen(!isDrawerOpen);
  };

  // Close drawer when clicking outside
  const closeDrawer = () => {
    if (isDrawerOpen) {
      Animated.timing(slideAnim, {
        toValue: -250,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setIsDrawerOpen(false);
    }
  };

  return (
    <NavigationContainer>
      <View style={styles.container}>
        {/* Overlay to detect outside clicks */}
        {isDrawerOpen && (
          <TouchableWithoutFeedback onPress={closeDrawer}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>
        )}

        {/* Stack Navigator */}
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen
            name="Home"
            children={(props) => (
              <HomeScreen {...props} toggleDrawer={toggleDrawer} />
            )}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Feedback"
            children={(props) => (
              <FeedbackScreen {...props} toggleDrawer={toggleDrawer} />
            )}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="HelpCenter"
            children={(props) => (
              <HelpCenterScreen {...props} toggleDrawer={toggleDrawer} />
            )}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="About"
            children={(props) => (
              <AboutScreen {...props} toggleDrawer={toggleDrawer} />
            )}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>

        {/* Custom Drawer */}
        <Animated.View
          style={[
            styles.drawer,
            { transform: [{ translateX: slideAnim }] }, // Animate sliding
          ]}
        >
          <Image
            source={require("./assets/LegazPin Logo White.png")}
            style={{ resizeMode: "contain", marginTop: 25, marginBottom: 20 }}
          />
          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => navigation.navigate("HomeScreen")}
          >
            <Ionicons name="home-outline" size={24} color="#000" />
            <Text style={styles.drawerItem}>Home</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity onPress={() => navigation.navigate("Map")}> */}

          <TouchableOpacity style={styles.itemContainer}>
            <Ionicons name="map-outline" size={24} color="#000" />
            <Text style={styles.drawerItem}>Map</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => navigation.navigate("AboutScreen")}
          >
            <Ionicons
              name="information-circle-outline"
              size={24}
              color="#000"
            />
            <Text style={styles.drawerItem}>About</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => navigation.navigate("FeedbackScreen")}
          >
            <Ionicons name="clipboard-outline" size={24} color="#000" />
            <Text style={styles.drawerItem}>Feedback</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => navigation.navigate("HelpCenterScreen")}
          >
            <Ionicons name="help-outline" size={24} color="#000" />
            <Text style={styles.drawerItem}>Help Center</Text>
          </TouchableOpacity>
        </Animated.View>

        <StatusBar style="auto" />
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)", // Semi-transparent overlay
    zIndex: 1, // Below drawer but above content
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 250,
    backgroundColor: "#f0f0f0",
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    zIndex: 2, // Above overlay
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  drawerItem: {
    fontSize: 17,
    color: "#2D3748", // Dark gray
    marginVertical: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
});
