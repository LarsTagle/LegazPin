import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MapView, { Marker } from "react-native-maps"; // Still works with Expo
import { Ionicons } from "@expo/vector-icons";

const MapScreen = ({ navigation, toggleDrawer }) => {
  const initialRegion = {
    latitude: 13.139,
    longitude: 123.743,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const markers = [
    {
      id: 1,
      title: "Legazpi City Hall",
      coordinates: { latitude: 13.1372, longitude: 123.7345 },
    },
    {
      id: 2,
      title: "Embarcadero de Legazpi",
      coordinates: { latitude: 13.1498, longitude: 123.7502 },
    },
    {
      id: 3,
      title: "Legazpi Airport",
      coordinates: { latitude: 13.1571, longitude: 123.7353 },
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.drawerButton}>
          <Ionicons name="menu" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Map</Text>
      </View>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinates}
            title={marker.title}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F4F8" },
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
  drawerButton: { padding: 10 },
  headerTitle: { fontSize: 20, fontWeight: "bold", marginLeft: 10 },
  map: { flex: 1 },
});

export default MapScreen;
