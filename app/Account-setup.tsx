import * as Crypto from "expo-crypto";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState, } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View,BackHandler } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { auth, db } from "./config/firebaseconfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    // ✅ Validate inputs
    if (!name.trim() || !mobile.trim() || !email.trim() || !password) {
      Alert.alert("Missing Details", "Please fill all required fields.");
      return;
    }

    if (mobile.replace(/\D/g, "").length !== 10) {
      Alert.alert("Invalid Mobile", "Mobile number should be 10 digits.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    // ✅ Hash password for Firestore storage
    const hashedPassword = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password
    );

    try {
      // 1️⃣ Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const uid = userCredential.user.uid;

      // 2️⃣ Save user data in Firestore (if fails, log it but continue)
      try {
        await setDoc(doc(db, "users", uid), {
          name: name.trim(),
          mobile: mobile.trim(),
          email: email.trim(),
          password: hashedPassword,
          createdAt: new Date().toISOString(),
        });
      } catch (firestoreError: any) {
        console.warn("Firestore write failed:", firestoreError);
        // Optional: log the error but don’t block navigation
      }

      // ✅ Navigate to login page
      Alert.alert("Success", "Account created successfully!");
      router.push("/login"); // <-- Change this to your login page route
    } catch (authError: any) {
      console.error("Signup Error:", authError);
      if (authError.code === "auth/email-already-in-use") {
        Alert.alert(
          "Email Exists",
          "This email is already registered. Please log in."
        );
      } else {
        Alert.alert("Error", authError.message || "Failed to create account.");
      }
    }
  };
  useEffect(() => {
    const handleBackPress = () => {
      router.push("/");
      return true; // Prevent default behavior
    };
    BackHandler.addEventListener('hardwareBackPress',handleBackPress)
  }, []);

  return (
    <LinearGradient colors={["#34e89e", "#0f3443"]} style={styles.container}>
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>

        {/* Username */}
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={22} color="#555" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Mobile */}
        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={22} color="#555" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Mobile Number"
            keyboardType="phone-pad"
            value={mobile}
            onChangeText={setMobile}
          />
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={22} color="#555" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={22} color="#555" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#555"
            />
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <TouchableOpacity style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Already have an account?{" "}
          <Text style={styles.link} onPress={() => router.push("/login")}>
            Sign in
          </Text>
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 30, color: "white" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
    width: "100%",
  },
  icon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 12 },
  button: {
    width: 250,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 15,
    borderRadius: 28,
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  footer: { marginTop: 20, fontSize: 14, color: "white", fontWeight: "600" },
  link: { color: "yellow", fontWeight: "bold", fontSize: 16 },
});
