import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { Bus, MapPin, School } from "lucide-react-native";

export default function LiveMap() {
  // Dummy coordinates roughly tracing a small route
  const schoolCoords = { latitude: 37.78825, longitude: -122.4324 };
  const busCoords = { latitude: 37.78125, longitude: -122.4224 };
  const stop1Coords = { latitude: 37.78525, longitude: -122.4284 };
  
  const routeCoords = [
    busCoords,
    { latitude: 37.78225, longitude: -122.4244 },
    { latitude: 37.78425, longitude: -122.4264 },
    stop1Coords,
    { latitude: 37.78625, longitude: -122.4304 },
    schoolCoords,
  ];

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 37.78425,
          longitude: -122.4274,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        {/* Route Directions (Snaps to roads via Google Maps API) */}
        <MapViewDirections
          origin={busCoords}
          destination={schoolCoords}
          waypoints={[stop1Coords]}
          apikey={"YOUR_GOOGLE_MAPS_APIKEY_HERE"} // IMPORTANT: Replace this with your Google Maps API Key
          strokeWidth={4}
          strokeColor="#3B82F6" // Tailwind Blue 500
        />

        {/* Bus Stop Marker */}
        <Marker coordinate={stop1Coords} title="Stop #4">
          <View style={styles.stopMarker}>
             <MapPin size={16} color="#FFFFFF" />
          </View>
        </Marker>

        {/* School Marker */}
        <Marker coordinate={schoolCoords} title="School">
          <View style={styles.schoolMarker}>
             <School size={20} color="#FFFFFF" />
          </View>
        </Marker>

        {/* Bus Marker */}
        <Marker coordinate={busCoords} title="School Bus">
          <View style={styles.busMarker}>
             <Bus size={20} color="#FFFFFF" />
          </View>
        </Marker>
        
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  busMarker: {
    backgroundColor: "#F59E0B", // amber 500
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  schoolMarker: {
    backgroundColor: "#10B981", // emerald 500
    padding: 10,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stopMarker: {
    backgroundColor: "#3B82F6", // blue 500
    padding: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  }
});
