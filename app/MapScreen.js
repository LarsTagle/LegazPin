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

const GMaps_Key = "AIzaSyAy2J-28fvMFNZ7JOUYVAAENpXWcv-lHLQ";

const MapScreen = ({ navigation, toggleDrawer }) => {
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [route, setRoute] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [focusedInput, setFocusedInput] = useState(null);
  const mapRef = useRef(null);

  // Define Legazpi, Albay region bounds (approximate)
  const ALBAY_REGION = {
    latitude: 13.139, // Center of Legazpi City
    longitude: 123.743,
    latitudeDelta: 0.2, // Roughly covers Albay province
    longitudeDelta: 0.2,
  };

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
      // Check if coordinates are within Albay bounds
      const withinAlbay =
        coords.latitude >= 12.9 &&
        coords.latitude <= 13.4 &&
        coords.longitude >= 123.4 &&
        coords.longitude <= 124.0;

      if (!withinAlbay) {
        return "Location outside Legazpi, Albay";
      }

      let address = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      return address[0]
        ? `${address[0].name}, ${address[0].city}` // Omit country
        : "Unknown Location in Legazpi";
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
      setStartCoords(coords);
    } else if (focusedInput === "end") {
      setEndLocation(address);
      setEndCoords(coords);
    }
  };

  const fetchRoute = async () => {
    if (!startLocation || !endLocation) {
      Alert.alert(
        "Missing Location",
        "Please enter both Start Location and End Location."
      );
      return;
    }

    try {
      const startCoordinates = await geocode(startLocation);
      const endCoordinates = await geocode(endLocation);

      if (!startCoordinates || !endCoordinates) {
        Alert.alert("Error", "Invalid location entered.");
        return;
      }

      setStartCoords({
        latitude: startCoordinates.latitude,
        longitude: startCoordinates.longitude,
      });
      setEndCoords({
        latitude: endCoordinates.latitude,
        longitude: endCoordinates.longitude,
      });

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${startCoordinates.latitude},${startCoordinates.longitude}&destination=${endCoordinates.latitude},${endCoordinates.longitude}&key=${GMaps_Key}`
      );
      const data = await response.json();
      if (data.routes.length) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRoute(points);
      }

      const navigationInstruction = `navigate me from ${startLocation} to ${endLocation}`;
      navigation.navigate("Home", { instruction: navigationInstruction });
    } catch (error) {
      console.error("Directions Error:", error);
      Alert.alert("Error", "Could not fetch route.");
    }
  };

  const geocode = async (query) => {
    // Append "Legazpi, Albay" to restrict geocoding to this area
    const fullQuery = `${query}, Legazpi, Albay`;
    const geocoded = await Location.geocodeAsync(fullQuery);
    return geocoded[0];
  };

  const clearInput = (type) => {
    if (type === "start") {
      setStartLocation("");
      setStartCoords(null);
    } else {
      setEndLocation("");
      setEndCoords(null);
    }
  };

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
              multiline
              numberOfLines={2}
              textAlignVertical="center"
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
              multiline
              numberOfLines={2}
              textAlignVertical="center"
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
        initialRegion={ALBAY_REGION} // Center on Legazpi, Albay
        region={
          userLocation ? { ...ALBAY_REGION, ...userLocation } : ALBAY_REGION
        }
        showsUserLocation={false}
        minZoomLevel={10} // Restrict zooming out too far
        maxZoomLevel={18} // Allow detailed zoom
      >
        {route.length > 0 && (
          <Polyline coordinates={route} strokeColor="#007AFF" strokeWidth={4} />
        )}
        {startCoords && (
          <Marker
            coordinate={startCoords}
            title="Start Location"
            pinColor="green"
          />
        )}
        {endCoords && (
          <Marker coordinate={endCoords} title="End Location" pinColor="red" />
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
