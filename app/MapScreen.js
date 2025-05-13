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

  // Define Albay region boundaries
  const ALBAY_BOUNDS = {
    minLat: 12.9, // Southern boundary
    maxLat: 13.4, // Northern boundary
    minLng: 123.4, // Western boundary
    maxLng: 124.0, // Eastern boundary
  };

  const ALBAY_REGION = {
    latitude: 13.139, // Center of Legazpi City
    longitude: 123.743,
    latitudeDelta: 0.5, // Initial zoom covering Albay
    longitudeDelta: 0.6,
  };

  // Zoom constraints
  const MIN_ZOOM = 11; // Minimum zoom level (zoomed out)
  const MAX_ZOOM = 18; // Maximum zoom level (zoomed in)
  const MIN_DELTA = 0.01; // Tight zoom
  const MAX_DELTA = 0.5; // Wide zoom

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required.");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: Math.max(
          ALBAY_BOUNDS.minLat,
          Math.min(ALBAY_BOUNDS.maxLat, location.coords.latitude)
        ),
        longitude: Math.max(
          ALBAY_BOUNDS.minLng,
          Math.min(ALBAY_BOUNDS.maxLng, location.coords.longitude)
        ),
      });
    })();
  }, []);

  const reverseGeocode = async (coords) => {
    try {
      const withinAlbay =
        coords.latitude >= ALBAY_BOUNDS.minLat &&
        coords.latitude <= ALBAY_BOUNDS.maxLat &&
        coords.longitude >= ALBAY_BOUNDS.minLng &&
        coords.longitude <= ALBAY_BOUNDS.maxLng;

      if (!withinAlbay) {
        return "Location outside Albay region";
      }

      let address = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      return address[0]
        ? `${address[0].name}, ${address[0].city}`
        : "Unknown Location in Albay";
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

      const navigationInstruction = `Navigate me from ${startLocation} to ${endLocation}`;
      navigation.navigate("Chat", { instruction: navigationInstruction });
    } catch (error) {
      console.error("Directions Error:", error);
      Alert.alert("Error", "Could not fetch route.");
    }
  };

  const geocode = async (query) => {
    const fullQuery = `${query}, Legazpi, Albay`;
    const geocoded = await Location.geocodeAsync(fullQuery);
    if (geocoded[0]) {
      const { latitude, longitude } = geocoded[0];
      if (
        latitude >= ALBAY_BOUNDS.minLat &&
        latitude <= ALBAY_BOUNDS.maxLat &&
        longitude >= ALBAY_BOUNDS.minLng &&
        longitude <= ALBAY_BOUNDS.maxLng
      ) {
        return geocoded[0];
      }
    }
    return null;
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

  // Restrict region using deltas (Option 1)
  const restrictRegion = (region) => {
    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;

    const constrainedLatDelta = Math.max(
      MIN_DELTA,
      Math.min(MAX_DELTA, latitudeDelta)
    );
    const constrainedLngDelta = Math.max(
      MIN_DELTA,
      Math.min(MAX_DELTA, longitudeDelta)
    );

    const halfLatDelta = constrainedLatDelta / 2;
    const halfLngDelta = constrainedLngDelta / 2;
    let newLat = latitude;
    let newLng = longitude;

    if (latitude - halfLatDelta < ALBAY_BOUNDS.minLat) {
      newLat = ALBAY_BOUNDS.minLat + halfLatDelta;
    } else if (latitude + halfLatDelta > ALBAY_BOUNDS.maxLat) {
      newLat = ALBAY_BOUNDS.maxLat - halfLatDelta;
    }

    if (longitude - halfLngDelta < ALBAY_BOUNDS.minLng) {
      newLng = ALBAY_BOUNDS.minLng + halfLatDelta;
    } else if (longitude + halfLngDelta > ALBAY_BOUNDS.maxLng) {
      newLng = ALBAY_BOUNDS.maxLng - halfLngDelta;
    }

    return {
      latitude: newLat,
      longitude: newLng,
      latitudeDelta: constrainedLatDelta,
      longitudeDelta: constrainedLngDelta,
    };
  };

  // Handle region change with camera zoom (Option 2)
  const handleRegionChange = (region) => {
    const constrainedRegion = restrictRegion(region);
    mapRef.current?.getCamera().then((camera) => {
      const currentZoom = camera.zoom || 14; // Default to 14 if undefined
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentZoom));

      if (
        constrainedRegion.latitude !== region.latitude ||
        constrainedRegion.longitude !== region.longitude ||
        constrainedRegion.latitudeDelta !== region.latitudeDelta ||
        constrainedRegion.longitudeDelta !== region.longitudeDelta ||
        newZoom !== currentZoom
      ) {
        mapRef.current?.animateCamera(
          {
            center: {
              latitude: constrainedRegion.latitude,
              longitude: constrainedRegion.longitude,
            },
            zoom: newZoom,
          },
          { duration: 200 }
        );
      }
    });
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
        initialRegion={ALBAY_REGION}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation={true}
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
    zIndex: 10,
  },
  drawerButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
    fontFamily: "Fredoka-Regular",
  },
  inputWithButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 10,
    backgroundColor: "#fff",
    width: "100%",
    zIndex: 5,
  },
  inputStack: {
    flex: 1,
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
    width: "100%",
    minHeight: 50,
  },
  textInput: {
    flex: 1,
    padding: 10,
    fontSize: 14,
    fontFamily: "Fredoka-Regular",
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
    zIndex: 0,
  },
});

export default MapScreen;
