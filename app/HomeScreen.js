// screens/HomeScreen.js
import { View, Text, Button } from "react-native";
import React from "react";

const HomeScreen = ({ navigation }) => {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>HomeScreen</Text>
      <Button
        title="Go to Feedback"
        onPress={() => navigation.navigate("Feedback")}
      />
      <Button
        title="Go to Help Center"
        onPress={() => navigation.navigate("HelpCenter")}
      />
      <Button
        title="Go to About"
        onPress={() => navigation.navigate("About")}
      />
    </View>
  );
};

export default HomeScreen;
