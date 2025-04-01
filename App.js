// App.js (updated)
import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";

// Import all your screens
import HomeScreen from "./app/HomeScreen";
import FeedbackScreen from "./app/FeedbackScreen";
import HelpCenterScreen from "./app/HelpCenterScreen";
import AboutScreen from "./app/AboutScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <View style={styles.container}>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: "Home" }}
          />
          <Stack.Screen
            name="Feedback"
            component={FeedbackScreen}
            options={{ title: "Feedback" }}
          />
          <Stack.Screen
            name="HelpCenter"
            component={HelpCenterScreen}
            options={{ title: "Help Center" }}
          />
          <Stack.Screen
            name="About"
            component={AboutScreen}
            options={{ title: "About" }}
          />
        </Stack.Navigator>
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
});
