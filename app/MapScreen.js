import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";

const GMaps_Key = "YOUR_API_KEY"; // Replace with your Google Maps API key

const MapScreen = ({ navigation, toggleDrawer }) => {
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [route, setRoute] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [focusedInput, setFocusedInput] = useState(null); // Track which input is focused
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required.");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  const reverseGeocode = async (coords) => {
    try {
      let address = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      return address[0]
        ? `${address[0].name}, ${address[0].city}, ${address[0].country}`
        : "Unknown Location";
    } catch (error) {
      console.error("Reverse Geocode Error:", error);
      return "Error fetching location";
    }
  };

  const handleMapPress = async (e) => {
    const coords = e.nativeEvent.coordinate;
    const address = await reverseGeocode(coords);

    if (focusedInput === "start") {
      setStartLocation(address);
    } else if (focusedInput === "end") {
      setEndLocation(address);
    }
  };

  const fetchRoute = async () => {
    if (!startLocation || !endLocation) return;

    try {
      const startCoords = await geocode(startLocation);
      const endCoords = await geocode(endLocation);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${startCoords.latitude},${startCoords.longitude}&destination=${endCoords.latitude},${endCoords.longitude}&key=${GMaps_Key}`
      );
      const data = await response.json();
      if (data.routes.length) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRoute(points);
      }
    } catch (error) {
      console.error("Directions Error:", error);
      Alert.alert("Error", "Could not fetch route.");
    }
  };

  const geocode = async (query) => {
    const geocoded = await Location.geocodeAsync(query);
    return geocoded[0];
  };

  const clearInput = (type) => {
    if (type === "start") setStartLocation("");
    else setEndLocation("");
  };

  // Decode polyline from Google Maps API
  const decodePolyline = (encoded) => {
    let points = [];
    let index = 0,
      len = encoded.length;
    let lat = 0,
      lng = 0;

    while (index < len) {
      let b,
        shift = 0,
        result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = (result & 1) != 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = (result & 1) != 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.drawerButton}>
          <Ionicons name="menu" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Map</Text>
      </View>

      <View style={styles.inputWithButton}>
        <View style={styles.inputStack}>
          <View style={styles.inputContainer}>
            <TextInput
              id="startInput"
              style={styles.textInput}
              placeholder="Start Location"
              value={startLocation}
              onChangeText={setStartLocation}
              onFocus={() => setFocusedInput("start")}
              onBlur={() => setFocusedInput(null)}
              multiline // Enable multiline
              numberOfLines={2} // Allow up to 2 lines
              textAlignVertical="center" // Center text vertically
            />
            {startLocation.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => clearInput("start")}
              >
                <Ionicons name="close" size={20} color="gray" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              id="endInput"
              style={styles.textInput}
              placeholder="End Location"
              value={endLocation}
              onChangeText={setEndLocation}
              onFocus={() => setFocusedInput("end")}
              onBlur={() => setFocusedInput(null)}
              multiline // Enable multiline
              numberOfLines={2} // Allow up to 2 lines
              textAlignVertical="center" // Center text vertically
            />
            {endLocation.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => clearInput("end")}
              >
                <Ionicons name="close" size={20} color="gray" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={fetchRoute}>
          <Ionicons name="search" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        onPress={handleMapPress}
        initialRegion={
          userLocation
            ? {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }
            : {
                latitude: 13.139,
                longitude: 123.743,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }
        }
        showsUserLocation={true}
      >
        {route.length > 0 && (
          <Polyline coordinates={route} strokeColor="#007AFF" strokeWidth={4} />
        )}
        {userLocation && (
          <Marker coordinate={userLocation} title="Your Location" />
        )}
      </MapView>
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
    zIndex: 10, // Ensure header stays on top
  },
  drawerButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
  },
  inputWithButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 10,
    backgroundColor: "#fff",
    width: "100%", // Ensure it takes the full width
    zIndex: 5, // Ensure it stays above the map
  },
  inputStack: {
    flex: 1, // Take remaining space after the search button
    flexDirection: "column",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: "#F1F4F8",
    width: "100%", // Ensure input container takes full width of its parent
    minHeight: 50, // Ensure enough height for multiline text
  },
  textInput: {
    flex: 1,
    padding: 10,
    fontSize: 14, // Slightly smaller font size for better readability
  },
  clearButton: {
    padding: 5,
  },
  searchButton: {
    backgroundColor: "#4F46E5",
    padding: 10,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  map: {
    flex: 1,
    zIndex: 0, // Ensure map stays at the bottom layer
  },
});

export default MapScreen;
