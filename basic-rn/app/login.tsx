import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./config/firebaseconfig"; // Import auth from config

export default function LoginScreen() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    const { email, password } = form;

    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      Alert.alert("Success", "Logged in successfully!");
      router.push("./otp");
    } catch (error) {
      Alert.alert("Login Failed", error instanceof Error ? error.message : String(error));
    }
  };

  const handleMobileLogin = () => {
    router.push("./loginpage");
  };

  const handleNewUser = () => {
    router.push("/Account-setup");
  };

  return (
    <LinearGradient colors={["#34e89e", "#0f3443"]} style={styles.bg}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Welcome Back!</Text>

        <View style={styles.inputContainer}>
          <Ionicons
            name="mail-outline"
            size={20}
            color="#555"
            style={styles.icon}
          />
          <TextInput
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#555"
            style={styles.icon}
          />
          <TextInput
            placeholder="Password"
            secureTextEntry={!showPassword}
            style={styles.input}
            value={form.password}
            onChangeText={(text) => setForm({ ...form, password: text })}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#555"
              style={styles.iconRight}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleLogin}>
          <Text style={styles.btnText}>Login</Text>
        </TouchableOpacity>

        <Text style={styles.or}>or</Text>

        <TouchableOpacity
          style={styles.mobileBtn}
          onPress={handleMobileLogin}
        >
          <Text style={styles.mobileBtnText}>
            Sign in with Mobile Number
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          New to LYNQ?{" "}
          <Text style={styles.link} onPress={handleNewUser}>
            Create Account
          </Text>
        </Text>
      </SafeAreaView>
    </LinearGradient>
  );
}


// Same styles as before
const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 30, color: "#000" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6e6e6",
    borderRadius: 10,
    paddingHorizontal: 10,
    width: "100%",
    marginBottom: 15,
  },
  icon: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
  input: { flex: 1, paddingVertical: 10 },
  btn: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 16,
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
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  or: { marginVertical: 10, fontSize: 14, color: "rgba(255,255,255,0.9)" },
  mobileBtn: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 16,
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
  mobileBtnText: { color: "#fff", fontWeight: "bold" },
  footer: { marginTop: 20, fontSize: 14, color: "white", fontWeight: "600" },
  link: { color: "yellow", fontWeight: "bold", fontSize: 16 },
});
