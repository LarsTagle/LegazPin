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
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useEffect, useState, useRef } from "react";
import * as Font from "expo-font";

import HomeScreen from "./app/HomeScreen";
import ChatScreen from "./app/ChatScreen";
import MapScreen from "./app/MapScreen";
import AboutScreen from "./app/AboutScreen";
import FeedbackScreen from "./app/FeedbackScreen";
import HelpCenterScreen from "./app/HelpCenterScreen";

const Stack = createStackNavigator();

// DrawerMenu component remains unchanged
const DrawerMenu = ({ toggleDrawer, slideAnim }) => {
  const navigation = useNavigation();

  useEffect(() => {
    console.log("DrawerMenu rendered, slideAnim:", slideAnim._value);
  }, [slideAnim]);

  return (
    <Animated.View
      style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}
    >
      <Image
        source={require("./assets/LegazPin Logo White.png")}
        style={{ resizeMode: "contain", marginTop: 25, marginBottom: 20 }}
        onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
      />
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => {
          navigation.navigate("Home");
          toggleDrawer();
        }}
      >
        <Ionicons name="home-outline" size={24} color="#000" />
        <Text style={styles.drawerItem}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => {
          navigation.navigate("Chat");
          toggleDrawer();
        }}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={24} color="#000" />
        <Text style={styles.drawerItem}>Chat</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => {
          navigation.navigate("Map");
          toggleDrawer();
        }}
      >
        <Ionicons name="map-outline" size={24} color="#000" />
        <Text style={styles.drawerItem}>Map</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => {
          navigation.navigate("About");
          toggleDrawer();
        }}
      >
        <Ionicons name="information-circle-outline" size={24} color="#000" />
        <Text style={styles.drawerItem}>About</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => {
          navigation.navigate("Feedback");
          toggleDrawer();
        }}
      >
        <Ionicons name="clipboard-outline" size={24} color="#000" />
        <Text style={styles.drawerItem}>Feedback</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => {
          navigation.navigate("HelpCenter");
          toggleDrawer();
        }}
      >
        <Ionicons name="help-outline" size={24} color="#000" />
        <Text style={styles.drawerItem}>Help Center</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [fontLoaded, setFontLoaded] = useState(false);
  const slideAnim = useRef(new Animated.Value(-250)).current;

  // Load custom font
  useEffect(() => {
    async function loadFont() {
      try {
        await Font.loadAsync({
          "Fredoka-Regular": require("./assets/fonts/Fredoka-Regular.ttf"),
        });
        setFontLoaded(true);
      } catch (error) {
        console.error("Error loading font:", error);
      }
    }
    loadFont();
  }, []);

  const toggleDrawer = () => {
    const toValue = isDrawerOpen ? -250 : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsDrawerOpen(!isDrawerOpen);
    });
  };

  const closeDrawer = () => {
    if (isDrawerOpen) {
      Animated.timing(slideAnim, {
        toValue: -250,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsDrawerOpen(false));
    }
  };

  // Render nothing until font is loaded
  if (!fontLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <NavigationContainer>
      <View style={styles.container}>
        {isDrawerOpen && (
          <TouchableWithoutFeedback onPress={closeDrawer}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>
        )}

        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen
            name="Home"
            children={(props) => (
              <HomeScreen {...props} toggleDrawer={toggleDrawer} />
            )}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Chat"
            children={(props) => (
              <ChatScreen
                {...props}
                toggleDrawer={toggleDrawer}
                messages={messages}
                setMessages={setMessages}
              />
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
          <Stack.Screen
            name="Map"
            children={(props) => (
              <MapScreen {...props} toggleDrawer={toggleDrawer} />
            )}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>

        <DrawerMenu toggleDrawer={toggleDrawer} slideAnim={slideAnim} />

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
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 1,
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
    zIndex: 2,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  drawerItem: {
    fontSize: 17,
    color: "#2D3748",
    marginVertical: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontFamily: "Fredoka-Regular",
  },
});
