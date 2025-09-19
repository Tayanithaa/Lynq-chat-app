import {  View, Text, StyleSheet, Image, TextInput, Keyboard, TouchableOpacity, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { useRoute } from "@react-navigation/native";

const OTP_LENGTH = 6;
const Resend_Time = 30;

export default function VerifyOTP() {
  const router = useRouter();
  const route = useRoute();
  const { phone } =(route.params as { phone?: string }) || {};


  // Function to mask phone number like +91 98*****210
  const maskPhone = (number: string) => {
    if (!number) return "";
    if (number.length <= 6) return number; // fallback for very short numbers
    return number.slice(0, 6) + "*****" + number.slice(-3);
  };

  const [otp, setotp] = useState(Array(OTP_LENGTH).fill(""));
  const [focusedInput, setFocusedInput] = useState<number | null>(null);
  const [isResending, setIsResending] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);
  const [Timer, setTimer] = useState(Resend_Time);

  useEffect(() => {
    if (Timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [Timer]);

  const handleChange = (text: string, index: number) => {
    if (/^\d$/.test(text)) {
      const newotp = [...otp];
      newotp[index] = text;
      setotp(newotp);
      if (index < OTP_LENGTH - 1) {
        inputs.current[index + 1]?.focus();
      } else {
        Keyboard.dismiss();
      }
    } else if (text === "") {
      const newotp = [...otp];
      newotp[index] = "";
      setotp(newotp);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleButtonPress = () => {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      return Alert.alert("Please provide the complete OTP");
    }
    router.push("/front");
  };

  const handleResend = () => {
    if (Timer === 0) {
      setIsResending(true);
      setTimeout(() => {
        setIsResending(false);
        setTimer(Resend_Time);
        Alert.alert("OTP Resend", "A new OTP has been sent to your number.");
      }, 1000);
    }
  };

  return (
    <LinearGradient
      colors={["#34e89e", "#0f3443"]}
      style={styles.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.container}>
        <View style={styles.imagecontainer}>
          <Image
            source={require("../assets/images/for_otp_1.png")}
            style={styles.for_Image_1}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.for_text_1}>Verify your Identity</Text>
        <Text style={styles.for_text_2}>
          Check your SMS for the 6-digit code{" "}
          {phone ? `sent to ${maskPhone(phone)}` : ""}
        </Text>
        <View style={styles.optRow}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={ref => {
                inputs.current[idx] = ref;
              }}
              style={[
                styles.otpinput,
                focusedInput === idx && styles.otpInputFocus,
              ]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={text => handleChange(text, idx)}
              onKeyPress={e => handleKeyPress(e, idx)}
              autoFocus={idx === 0}
              onFocus={() => setFocusedInput(idx)}
              onBlur={() => setFocusedInput(null)}
            />
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={handleButtonPress}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
        <View style={styles.resendrow}>
          <Text style={styles.resendinfo}>Didn't get the code?</Text>
          <TouchableOpacity
            style={styles.resendcontainer}
            disabled={Timer > 0 || isResending}
            onPress={handleResend}
          >
            <Text style={styles.resendtext}>
              {isResending
                ? "Resending"
                : Timer > 0
                ? `Resend in ${Timer}s`
                : "Resend"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backgroundGradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 85,
    width: "100%",
  },
  imagecontainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  for_Image_1: {
    width: 170,
    height: 170,
    borderRadius: 80,
  },
  for_text_1: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  for_text_2: {
    fontSize: 16,
    color: "#f0f0f0",
    marginBottom: 32,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  optRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 36,
  },
  otpinput: {
    width: 48,
    height: 56,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.95)",
    marginHorizontal: 8,
    textAlign: "center",
    fontSize: 26,
    color: "333",
    fontWeight: "600",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  otpInputFocus: {
    borderColor: "#fff",
    backgroundColor: "#fff",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
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
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  resendrow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  resendinfo: {
    color: "#f0f0f0",
    fontSize: 15,
    marginRight: 6,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  resendcontainer: {
    marginTop: 0,
  },
  resendtext: {
    color: "#fff",
    fontSize: 16,
    marginRight: 6,
    textDecorationLine: "underline",
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
