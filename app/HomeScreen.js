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
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useIsFocused } from "@react-navigation/native";

export default function IndexScreen({ navigation, route, toggleDrawer }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const scrollViewRef = useRef(null);
  const API_URL = "http://127.0.0.1:5001/predict";
  const isFocused = useIsFocused();

  // Reset chat when coming from the drawer or when triggered manually
  useEffect(() => {
    if (route.params?.resetChat) {
      setMessages([]);
      navigation.setParams({ resetChat: false }); // Prevent re-clearing every render
    }
  }, [route.params?.resetChat, isFocused]);

  // Function to manually clear chat
  const clearChat = () => {
    setMessages([]);
  };

  const sendMessage = async () => {
    if (message.trim().length === 0) return;

    const userMessage = { sender: "user", text: message };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");

    try {
      console.log("Sending message:", message);
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          text: data.response,
          sender: "bot",
          intent: data.intent, // Optional: Use this for UI styling
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, I couldn't connect to the server. Please try again later.",
          sender: "bot",
          isError: true,
        },
      ]);
      console.error("Fetch error:", error);
    }
  };

  const numLines = message.split("\n").length;
  const dynamicHeight = Math.min(30 + numLines * 20, 150);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0} // Adjust for header height
    >
      {/* Header Row with Drawer Button */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.drawerButton}>
          <Ionicons name="menu" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Chat Area */}
      <ScrollView
        style={styles.chatArea}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "flex-end", // Pin messages to the bottom
          paddingBottom: 10, // Add padding to avoid overlap with input
        }}
        ref={scrollViewRef}
        onContentSizeChange={() => {
          // Auto-scroll to the bottom when content size changes
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
      </ScrollView>

      {/* Input Area */}
      <View style={[styles.inputContainer, { height: dynamicHeight }]}>
        <TextInput
          style={[styles.textInput, { height: dynamicHeight }]}
          placeholder="Type your message..."
          placeholderTextColor="rgba(0, 0, 0, 0.5)"
          multiline
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
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
  headerRow: {
    flexDirection: "row",
    width: "100%", // Span the entire width of the screen
    height: 100, // Fixed height for the header
    alignItems: "center", // Center items vertically
    paddingLeft: 10, // Add padding to avoid overlapping the button
    paddingTop: 30,
  },
  drawerButton: {
    padding: 10, // Increase padding for better touch area
    borderRadius: 5, // Rounded corners for a button-like appearance
  },
  chatArea: {
    flex: 1, // Take up remaining space
  },
  chatBubble: {
    padding: 10,
    borderRadius: 15,
    marginBottom: 10,
    maxWidth: "75%", // Ensure bubbles don't take up the full width
  },
  userBubble: {
    backgroundColor: "#007AFF",
    alignSelf: "flex-end",
  },
  botBubble: {
    backgroundColor: "rgb(255, 139, 139)",
    alignSelf: "flex-start",
  },
  chatText: {
    color: "black",
    fontSize: 16,
    fontFamily: "Fredoka",
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
    height: "auto", // Allow dynamic height but prevent shrinking
  },
  textInput: {
    paddingTop: 15,
    paddingLeft: 10,
    flex: 1,
    fontFamily: "Fredoka",
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
