import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth } from "./config/firebaseconfig";

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const formatPhone = (num: string) => {
    const digits = num.replace(/\D/g, "");
    if (digits.length <= 5) return digits;
    return digits.slice(0, 5) + " " + digits.slice(5, 10);
  };

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, "");
    if (digits.length <= 10) {
      setPhone(formatPhone(digits));
    }
  };

  const isValidNumber = phone.replace(/\D/g, "").length === 10;

  const handleNext = async () => {
    const rawDigits = phone.replace(/\D/g, "");
    const formattedPhone = `+91${rawDigits}`;
    if (rawDigits.length !== 10) {
      Alert.alert("Invalid number", "Enter a valid phone number.");
      return;
    }

    try {
      setLoading(true);
      
      // Initialize reCAPTCHA verifier
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved');
          }
        });
      }

      const appVerifier = (window as any).recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      
      // Store confirmation result for OTP verification
      (window as any).confirmationResult = confirmationResult;
      
      setLoading(false);
      router.push({ pathname: "/otp", params: { phone: formattedPhone } });
    } catch (error: any) {
      setLoading(false);
      console.error('Error sending OTP:', error);
      Alert.alert("Error", error.message || "Failed to send OTP. Please try again.");
    }
  };

  return (
    <LinearGradient
      colors={["#34e89e","#0f3443"]}
      style={styles.main}
    >
      <div id="recaptcha-container"></div>
      <Text style={styles.for_text1}>Enter Your Mobile Number</Text>
      <Text style={styles.for_text2}>
        LYNQ will send an OTP to verify your Number
      </Text>
      <View style={styles.inputContainer}>
        <Text style={styles.countryCode}>+91</Text>
        <TextInput
          style={styles.for_text3}
          placeholder="98765 43210"
          keyboardType="number-pad"
          value={phone}
          onChangeText={handleChange}
          editable={!loading}
        />
      </View>
      <TouchableOpacity
        style={[
          styles.for_text4,
          { backgroundColor: isValidNumber && !loading ? "#06B6D4" : "#9CA3AF" },
        ]}
        disabled={!isValidNumber || loading}
        onPress={handleNext}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.for_text5}>Next</Text>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  main: {
    paddingHorizontal: 5,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  for_text1: {
    fontWeight: "bold",
    color: "black", 
    fontSize: 22,
    marginBottom: 22,
  },
  for_text2: {
    color: "#E5E7EB",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    width: "80%",
    paddingHorizontal: 13,
    backgroundColor: "white", 
  },
  countryCode: {
    fontSize: 16,
    color: "#111827",
    marginRight: 5,
  },
  for_text3: {
    flex: 1,
    padding: 10,
    fontSize: 14,
  },
  for_text4: {
    padding: 16,
    width: "40%",
    borderRadius: 50,
    marginTop:25,
    
  },
  for_text5: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },
});
