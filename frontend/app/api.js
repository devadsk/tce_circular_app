// frontend/app/api.js
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BACKEND_URL = "https://circularappfinal.onrender.com"; // your backend base
const BASE_API = `${BACKEND_URL.replace(/\/$/, "")}/api/events`;
const ADMIN_API = `${BACKEND_URL.replace(/\/$/, "")}/api/admin`;

// ✅ Token helpers
export const setToken = async (token) => {
  try {
    await AsyncStorage.setItem("authToken", token);
  } catch (err) {
    console.error("Error storing token:", err);
  }
};

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem("authToken");
  } catch (err) {
    console.error("Error getting token:", err);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem("authToken");
  } catch (err) {
    console.error("Error removing token:", err);
  }
};

// Fetch all events (no auth needed)
export const fetchEvents = async () => {
  try {
    const res = await fetch(BASE_API);
    if (!res.ok) throw new Error("Network response was not ok");
    return await res.json(); // server returns array
  } catch (err) {
    console.error("Fetch events error:", err);
    return [];
  }
};

// Create a new event (admin only) ✅ include token
export const createEvent = async (payload) => {
  try {
    const token = await getToken();
    const res = await fetch(BASE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      const message =
        data.message || (data.errors ? JSON.stringify(data.errors) : "Failed to create event");
      throw new Error(message);
    }
    return data;
  } catch (err) {
    console.error("Create event error:", err);
    throw err;
  }
};

// ✅ Admin management: grant/revoke
// in frontend/app/api.js
export const manageAdmin = async ({ email, action }, token) => {
  try {
    const res = await fetch(`${ADMIN_API}/role`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email, action }),
    });

    const text = await res.text(); // read raw text first
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (parseErr) {
      // If server returned HTML or other text, throw meaningful error containing the response body
      throw new Error(`Invalid JSON response from server: ${text}`);
    }

    if (!res.ok) {
      throw new Error(data.message || `Request failed (${res.status})`);
    }
    return data;
  } catch (err) {
    console.error("Manage admin error:", err);
    throw err;
  }
};
