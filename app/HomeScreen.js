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
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function HomeScreen({
  navigation,
  toggleDrawer,
  messages,
  setMessages,
  route,
}) {
  const [message, setMessage] = useState("");
  const scrollViewRef = useRef(null);
  const API_URL = "http://127.0.0.1:5001/predict";

  // Handle instruction from MapScreen
  useEffect(() => {
    const instruction = route.params?.instruction;
    if (instruction) {
      Keyboard.dismiss();
      setMessage(instruction); // Set the message briefly to display it
      sendMessage(instruction);
      setMessage(""); // Reset the text box immediately after sending
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
    if (!overrideMessage) setMessage(""); // Clear only for manual input

    try {
      console.log("Sending message:", textToSend);
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
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
          intent: data.intent,
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
