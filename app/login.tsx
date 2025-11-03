import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "./contexts/AuthContext";

export default function LoginScreen() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();

  // Redirect to chat screen after successful login
  useEffect(() => {
    console.log('🔍 Login useEffect - user:', user);
    if (user) {
      console.log('✅ User detected, navigating to /front...');
      setTimeout(() => {
        router.push("/front" as any);
      }, 100);
    }
  }, [user]);

  const handleLogin = async () => {
    const { username, password } = form;

    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter username and password");
      return;
    }

    if (username.trim().length < 3) {
      Alert.alert("Invalid Username", "Username must be at least 3 characters.");
      return;
    }

    if (password.length < 4) {
      Alert.alert("Weak Password", "Password must be at least 4 characters.");
      return;
    }

    try {
      setLoading(true);
      console.log('🔐 Attempting login for:', username.trim());
      await signIn(username.trim(), password);
      console.log('✅ signIn completed successfully');
      // Navigation will happen automatically via useEffect watching user state
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert("Login Failed", error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#34e89e", "#0f3443"]} style={styles.bg}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Welcome Back!</Text>

        <View style={styles.inputContainer}>
          <Ionicons
            name="person-outline"
            size={20}
            color="#555"
            style={styles.icon}
          />
          <TextInput
            placeholder="Username"
            autoCapitalize="none"
            style={styles.input}
            value={form.username}
            onChangeText={(text) => setForm({ ...form, username: text })}
            editable={!loading}
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
            editable={!loading}
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

        <TouchableOpacity 
          style={[styles.btn, loading && styles.btnDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.btnText}>Login</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footer}>
          New to LYNQ?{" "}
          <Text style={styles.link} onPress={() => router.push('/register' as any)}>
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
  btnDisabled: { opacity: 0.6 },
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
