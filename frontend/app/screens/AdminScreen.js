// frontend/app/screens/AdminScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
  TouchableOpacity,
  Animated,
  Easing,
  Button,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { fetchEvents, createEvent, getToken, manageAdmin } from "../api";
import { useNavigation } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";

export default function AdminScreen() {
  const navigation = useNavigation();
  const router = useRouter();

  // Event States
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Admin Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [action, setAction] = useState("grant");
  const slideAnim = useState(new Animated.Value(400))[0];

  // Logout Handler
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => router.replace("/"),
      },
    ]);
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Button title="Logout" onPress={handleLogout} color="#FF4500" />
        </View>
      ),
    });
  }, [navigation]);

  const openModal = () => {
    setModalVisible(true);
    slideAnim.setValue(400);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 350,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 250,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  const submitEvent = async () => {
    if (!name || !startDate || !endDate || !time || !venue)
      return Alert.alert("Validation", "Please fill all required fields.");
    if (fileUrl && !/^https?:\/\/.+$/.test(fileUrl))
      return Alert.alert("Invalid URL", "Enter a valid http(s) URL.");

    try {
      const token = await getToken();
      if (!token) return Alert.alert("Unauthorized", "Login again");
      await createEvent({
        name,
        startDate,
        endDate,
        time,
        venue,
        description,
        category,
        fileUrl,
      });
      Alert.alert("Success", "Event Created Successfully");
      clearForm();
      loadEvents();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to create event");
    }
  };

  const loadEvents = async () => {
    try {
      const allEvents = await fetchEvents();
      setEvents(allEvents);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const clearForm = () => {
    setName("");
    setStartDate("");
    setEndDate("");
    setTime("");
    setVenue("");
    setDescription("");
    setCategory("");
    setFileUrl("");
  };

  const openUrl = async (url) => {
    if (!url) return Alert.alert("No file attached");
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
    else Alert.alert("Cannot open URL");
  };

  const handlePermission = async () => {
    if (!email) return Alert.alert("Validation", "Please enter email");
    try {
      const token = await getToken();
      if (!token) return Alert.alert("Unauthorized", "Login again");
      const res = await manageAdmin({ email, action }, token);
      Alert.alert("Success", res.message || "Updated role");
      setEmail("");
      closeModal();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to update role");
    }
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

  if (loading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1E90FF" />
        <Text style={{ color: "#555", marginTop: 10 }}>Loading events...</Text>
      </View>
    );

  return (
    <>
      <Stack.Screen options={{ title: "Admin Dashboard" }} />

      <View style={styles.root}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 150 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Create New Event</Text>

          <TextInput
            placeholder="Event Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholderTextColor="#888"
          />
          <TextInput
            placeholder="Start Date (YYYY-MM-DD)"
            value={startDate}
            onChangeText={setStartDate}
            style={styles.input}
            placeholderTextColor="#888"
          />
          <TextInput
            placeholder="End Date (YYYY-MM-DD)"
            value={endDate}
            onChangeText={setEndDate}
            style={styles.input}
            placeholderTextColor="#888"
          />
          <TextInput
            placeholder="Time"
            value={time}
            onChangeText={setTime}
            style={styles.input}
            placeholderTextColor="#888"
          />
          <TextInput
            placeholder="Venue"
            value={venue}
            onChangeText={setVenue}
            style={styles.input}
            placeholderTextColor="#888"
          />
          <TextInput
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            placeholderTextColor="#888"
          />
          <TextInput
            placeholder="Category"
            value={category}
            onChangeText={setCategory}
            style={styles.input}
            placeholderTextColor="#888"
          />
          <TextInput
            placeholder="Google Drive URL (optional)"
            value={fileUrl}
            onChangeText={setFileUrl}
            style={styles.input}
            placeholderTextColor="#888"
            autoCapitalize="none"
          />

          <TouchableOpacity
            onPress={submitEvent}
            style={[styles.primaryBtn, { backgroundColor: "#1E90FF" }]}
          >
            <Text style={styles.btnText}>Submit Event</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Search & Filter</Text>
          <TextInput
            placeholder="Search events..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.input}
            placeholderTextColor="#888"
          />

          
            <View style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginVertical: 6, height: 48, overflow: "hidden", backgroundColor: "#fff" }}>
  <Picker
    selectedValue={filter}
    onValueChange={(val) => setFilter(val)}
    style={{ width: "100%", height: "100%" }}
    dropdownIconColor="#000"
  >
    <Picker.Item label="All" value="all" />
    <Picker.Item label="Ongoing" value="ongoing" />
    <Picker.Item label="Upcoming" value="upcoming" />
    <Picker.Item label="Past" value="past" />
  </Picker>
</View>


          <Text style={styles.sectionTitle}>All Events</Text>
          {filteredEvents.length === 0 ? (
            <Text style={{ color: "#555" }}>No events available.</Text>
          ) : (
            filteredEvents.map((e) => (
              <View
                key={e._id}
                style={[
                  styles.card,
                  isOngoing(e) && {
                    borderColor: "#1E90FF",
                    borderWidth: 2,
                    backgroundColor: "#E8F4FF",
                  },
                ]}
              >
                <Text style={styles.cardTitle}>
                  {e.name} {e.category ? `(${e.category})` : ""}
                </Text>
                <Text style={styles.cardText}>
                  {new Date(e.startDate).toLocaleDateString()} -{" "}
                  {new Date(e.endDate).toLocaleDateString()}
                </Text>
                <Text style={styles.cardText}>{e.time}</Text>
                <Text style={styles.cardText}>{e.venue}</Text>
                <Text style={styles.cardText}>{e.description}</Text>
                {e.fileUrl && (
                  <TouchableOpacity onPress={() => openUrl(e.fileUrl)}>
                    <Text style={styles.linkText}>Open Drive Link</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>

        {/* Admin Permission Modal */}
{modalVisible && (
  <View style={styles.modalBackdrop}>
    <Animated.View
      style={[styles.modalPanel, { transform: [{ translateY: slideAnim }] }]}
      pointerEvents={modalVisible ? "auto" : "none"}
    >
      <Text style={styles.modalTitle}>Grant / Revoke Admin</Text>

      <TextInput
        placeholder="Enter user email"
        value={email}
        onChangeText={setEmail}
        style={styles.modalInput}
        placeholderTextColor="#888"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <View style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, height: 48, marginVertical: 6, backgroundColor: "#fff", overflow: "hidden" }}>
  <Picker
    selectedValue={action}
    onValueChange={setAction}
    style={{ width: "100%", height: "100%" }}
    dropdownIconColor="#000"
  >
    
    <Picker.Item label="Grant Admin" value="grant" />
    <Picker.Item label="Revoke Admin" value="revoke" />
  </Picker>
</View>



      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <TouchableOpacity
          onPress={closeModal}
          style={[styles.smallBtn, { backgroundColor: "#666" }]}
        >
          <Text style={styles.btnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePermission}
          style={[
            styles.smallBtn,
            { backgroundColor: action === "grant" ? "#1E90FF" : "#FF6347" },
          ]}
        >
          <Text style={styles.btnText}>
            {action === "grant" ? "Grant Admin" : "Revoke Admin"}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  </View>
)}


        {/* Floating Admin Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={openModal}
          activeOpacity={0.8}
          pointerEvents={modalVisible ? "none" : "auto"}
        >
          <Text style={{ color: "#fff", fontSize: 20 }}>⚙️</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f9faff" },
  container: { flex: 1, padding: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E90FF",
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 6,
    borderRadius: 8,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    color: "#000",
  },
  picker: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginVertical: 6,
  },
  primaryBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    elevation: 2,
  },
  btnText: { color: "#fff", fontWeight: "bold" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#000" },
  cardText: { fontSize: 14, color: "#333", marginVertical: 2 },
  linkText: {
    color: "#1E90FF",
    textDecorationLine: "underline",
    marginTop: 5,
  },
modalPanel: {
  width: "85%",
  backgroundColor: "#F5F5F5",
  borderRadius: 20,
  padding: 20,
  elevation: 10,
  shadowColor: "#000",
  shadowOpacity: 0.3,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 5 },
},
modalBackdrop: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.4)", // dark overlay
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
},
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#000", marginBottom: 10 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    color: "#000",
    backgroundColor: "#fff",
    marginVertical: 6,
  },
  smallBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 25,
    backgroundColor: "#1E90FF",
    width: 55,
    height: 55,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
