// frontend/app/screens/StudentScreen.js

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { fetchEvents, BACKEND_URL } from "../api";
import { Stack, useRouter } from "expo-router";

export default function StudentScreen() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadEvents = async () => {
    try {
      const allEvents = await fetchEvents();
      setEvents(allEvents);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load events");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [])
  );

  const openFile = async (fileUrl) => {
    if (!fileUrl) return Alert.alert("No file attached");

    const url = fileUrl.startsWith("http")
      ? fileUrl
      : `${BACKEND_URL.replace(/\/$/, "")}/${fileUrl.replace(/^\/?/, "")}`;

    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
    else Alert.alert("Cannot open URL", "This link cannot be opened on your device");
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: () => router.replace("/") },
      ],
      { cancelable: true }
    );
  };

  const filteredEvents = events.filter((e) => {
    const today = new Date();
    const start = new Date(e.startDate);
    const end = new Date(e.endDate);

    if (filter === "ongoing" && !(start <= today && end >= today)) return false;
    if (filter === "upcoming" && !(start > today)) return false;
    if (filter === "past" && !(end < today)) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.name?.toLowerCase().includes(q) ||
      e.venue?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q) ||
      e.time?.toLowerCase().includes(q)
    );
  });

  const isOngoing = (e) => {
    const today = new Date();
    const start = new Date(e.startDate);
    const end = new Date(e.endDate);
    return start <= today && end >= today;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Explore Events",
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity onPress={handleLogout}>
                <Text style={{ color: "#FF4500", fontWeight: "bold", fontSize: 16, marginRight: 10 }}>
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <View style={styles.root}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Search */}
          <TextInput
            placeholder="Search events..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.input}
            placeholderTextColor="#888"
          />

          {/* Filter */}
          <Text style={styles.sectionHeader}>Filter Events:</Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={filter}
              onValueChange={(val) => setFilter(val)}
              style={styles.picker}
              itemStyle={{ color: "#000" }}
            >
              <Picker.Item label="All" value="all" />
              <Picker.Item label="Ongoing" value="ongoing" />
              <Picker.Item label="Upcoming" value="upcoming" />
              <Picker.Item label="Past" value="past" />
            </Picker>
          </View>

          {/* Events */}
          <Text style={styles.sectionHeader}>Events:</Text>

          {filteredEvents.length === 0 ? (
            <Text style={styles.cardText}>No events available.</Text>
          ) : (
            filteredEvents.map((e) => (
              <View
                key={e._id}
                style={[
                  styles.card,
                  isOngoing(e) && {
                    borderColor: "#1E90FF",
                    borderWidth: 2,
                    backgroundColor: "#E0F0FF",
                  },
                ]}
              >
                <Text style={styles.cardTitle}>
                  {e.name} {e.category ? `(${e.category})` : null}
                </Text>

                <Text style={styles.cardText}>
                  {new Date(e.startDate).toLocaleDateString()} to{" "}
                  {new Date(e.endDate).toLocaleDateString()}
                </Text>

                <Text style={styles.cardText}>{e.time}</Text>
                <Text style={styles.cardText}>{e.venue}</Text>
                <Text style={styles.cardText}>{e.description}</Text>

                {e.fileUrl && (
                  <TouchableOpacity
                    onPress={() => openFile(e.fileUrl)}
                    style={styles.smallBtn}
                  >
                    <Text style={styles.smallBtnText}>Open Drive Link</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, padding: 20 },

  input: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    borderColor: "#ccc",
    color: "#5687d2ff",
    backgroundColor: "#fff",
  },

  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    backgroundColor: "#fff",
    marginVertical: 10,
    overflow: "hidden",
  },

  picker: {
    width: "100%",
    height: 50,
  },

  card: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginVertical: 6,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },

  cardTitle: { fontWeight: "bold", fontSize: 16, color: "#000", marginBottom: 5 },
  cardText: { color: "#333", marginBottom: 3 },

  smallBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#1E90FF",
    alignItems: "center",
    marginTop: 6,
  },

  smallBtnText: { color: "#fff", fontWeight: "600" },

  sectionHeader: { marginTop: 20, fontSize: 18, color: "#1E90FF" },
});
