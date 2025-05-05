import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  Animated,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as Location from "expo-location";

export default function HomeScreen({
  navigation,
  toggleDrawer,
  messages,
  setMessages,
  route,
}) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef(null);
  const API_URL = "http://10.60.79.133:5005/webhooks/rest/webhook";
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  // Albay region boundaries (consistent with MapScreen.js)
  const ALBAY_BOUNDS = {
    minLat: 12.9,
    maxLat: 13.4,
    minLng: 123.4,
    maxLng: 124.0,
  };

  // Animate dots when loading
  useEffect(() => {
    if (isLoading) {
      const animateDot = (dot, delay) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, {
              toValue: -5,
              duration: 300,
              delay,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: -2.5,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };
      animateDot(dot1Anim, 0);
      animateDot(dot2Anim, 100);
      animateDot(dot3Anim, 200);
    } else {
      dot1Anim.stopAnimation();
      dot2Anim.stopAnimation();
      dot3Anim.stopAnimation();
      dot1Anim.setValue(0);
      dot2Anim.setValue(0);
      dot3Anim.setValue(0);
    }
  }, [isLoading]);

  // Handle instruction from MapScreen
  useEffect(() => {
    const instruction = route.params?.instruction;
    if (instruction) {
      Keyboard.dismiss();
      setMessage(instruction);
      sendMessage(instruction);
      setMessage("");
      navigation.setParams({ instruction: null });
    }
  }, [route.params?.instruction]);

  const clearChat = () => {
    Alert.alert(
      "Start New Chat",
      "Are you sure you want to clear the chat?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            setMessages([]);
            console.log("Chat cleared");
          },
        },
      ],
      { cancelable: true }
    );
  };

  const sendMessage = async (overrideMessage) => {
    const textToSend = overrideMessage || message.trim();
    if (textToSend.length === 0) return;

    const userMessage = { sender: "user", text: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    if (!overrideMessage) setMessage("");
    setIsLoading(true);

    let latitude = null;
    let longitude = null;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Location permission not granted");
      } else {
        // Attempt to fetch location with timeout
        const locationPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Location fetch timed out")), 5000)
        );
        const location = await Promise.race([locationPromise, timeoutPromise]);

        // Constrain coordinates to Albay region
        latitude = Math.max(
          ALBAY_BOUNDS.minLat,
          Math.min(ALBAY_BOUNDS.maxLat, location.coords.latitude)
        );
        longitude = Math.max(
          ALBAY_BOUNDS.minLng,
          Math.min(ALBAY_BOUNDS.maxLng, location.coords.longitude)
        );
      }
    } catch (error) {
      console.error("Location Fetch Error:", error.message);
      // Fallback to default location
      latitude = 13.139;
      longitude = 123.743;
      console.log("Using fallback location: Legazpi City, Albay");
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          metadata: {
            latitude: latitude ?? 0,
            longitude: longitude ?? 0,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          text: data[0].text,
          sender: "bot",
          intent: data.intent,
          entities: data.entities,
          isError: !data.response || data.response.includes("Sorry"),
        },
      ]);
    } catch (error) {
      console.error("Fetch error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Oops, something went wrong. Please try again!",
          sender: "bot",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const numLines = message.split("\n").length;
  const dynamicHeight = Math.min(30 + numLines * 20, 150);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.drawerButton}>
          <Ionicons name="menu" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Home</Text>
        <TouchableOpacity onPress={clearChat} style={styles.newChatButton}>
          <Ionicons name="create-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.chatArea}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "flex-end",
          paddingBottom: 10,
        }}
        ref={scrollViewRef}
        onContentSizeChange={() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }}
      >
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.chatBubble,
              msg.sender === "bot" ? styles.botBubble : styles.userBubble,
            ]}
          >
            <Text style={styles.chatText}>{msg.text}</Text>
          </View>
        ))}
        {isLoading && (
          <View
            style={[styles.chatBubble, styles.botBubble, styles.loadingBubble]}
          >
            <Text style={styles.chatText}>Typing</Text>
            <Animated.Text
              style={[
                styles.dotText,
                { transform: [{ translateY: dot1Anim }] },
              ]}
            >
              .
            </Animated.Text>
            <Animated.Text
              style={[
                styles.dotText,
                { transform: [{ translateY: dot2Anim }] },
              ]}
            >
              .
            </Animated.Text>
            <Animated.Text
              style={[
                styles.dotText,
                { transform: [{ translateY: dot3Anim }] },
              ]}
            >
              .
            </Animated.Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputContainer, { height: dynamicHeight }]}>
        <TextInput
          style={[styles.textInput, { height: dynamicHeight }]}
          placeholder="Type your message..."
          placeholderTextColor="rgba(0, 0, 0, 0.5)"
          multiline
          value={message}
          onChangeText={setMessage}
          autoFocus={false}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => sendMessage()}
        >
          <Ionicons name="send" size={20} color="black" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F4F8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    flex: 1,
    textAlign: "center",
    fontFamily: "Fredoka-Regular",
  },
  newChatButton: {
    padding: 10,
  },
  chatArea: {
    flex: 1,
  },
  chatBubble: {
    padding: 10,
    borderRadius: 15,
    marginBottom: 10,
    maxWidth: "75%",
  },
  userBubble: {
    marginRight: 10,
    backgroundColor: "#007AFF",
    alignSelf: "flex-end",
  },
  botBubble: {
    marginLeft: 10,
    backgroundColor: "rgb(225, 225, 225)",
    alignSelf: "flex-start",
  },
  loadingBubble: {
    flexDirection: "row",
    alignItems: "center",
  },
  chatText: {
    color: "black",
    fontSize: 16,
    fontFamily: "Fredoka-Regular",
  },
  dotText: {
    color: "black",
    fontSize: 25,
    fontFamily: "Fredoka-Regular",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    margin: 10,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  textInput: {
    paddingTop: 15,
    paddingLeft: 10,
    flex: 1,
    fontFamily: "Fredoka-Regular",
    fontSize: 16,
    paddingVertical: 8,
    borderRadius: 10,
    maxHeight: 120,
    backgroundColor: "transparent",
    borderWidth: 0,
    outlineStyle: "none",
  },
  sendButton: {
    padding: 8,
  },
});
