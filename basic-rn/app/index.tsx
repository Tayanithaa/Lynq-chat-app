import { useRouter } from "expo-router";
import { Text, Image, View, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { testFirebaseConnection } from "./utils/firebaseTest";

export default function WelcomeScreen() {
  const router = useRouter();

  useEffect(() => {
    // Test Firebase connection on app startup
    testFirebaseConnection().then(result => {
      console.log('Firebase Test Result:', result);
    });
  }, []);

  return (
    <LinearGradient
      colors={["#34e89e","#0f3443"]}
      style={styles.container}
    >
      <Image
        style={styles.image}
        source={require("../assets/images/Lynq_image-removebg-preview.png")}
      />
      <Text style={styles.title}>Welcome to LYNQ!</Text>
      {/* privacy text */}
      <Text style={styles.align}>
        Read Our <Text style={styles.textcolour}>Privacy Policy</Text>. Tap
        "Agree" & Continue to accept the
        <Text style={styles.textcolour}> Terms and Conditions </Text>
      </Text>

      {/* Agree and continue */}
      <TouchableOpacity
        style={styles.for_agree_and_continue}
        onPress={() => {
          router.push("/login");
        }}
      >
        <Text style={styles.for_agree_and_continue_1}>Agree</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
  },
  image: {
    marginBottom: 40,
    width: 200,
    height: 150,
    resizeMode: "contain",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  textcolour: {
    color: "yellow",
    fontWeight: "bold",
  },
  align: {
    textAlign: "center",
    fontSize: 18,
    marginBottom: 20,
    color: "white",
  },
  for_agree_and_continue: {
    width:"100%",
  maxWidth:320,
  backgroundColor:'rgba(255,255,255,0.2)',
  paddingVertical:16,
  borderRadius:28,
  alignItems:"center",
  marginBottom:18,
  borderWidth:1,
  borderColor:"rgba(255,255,255,0.3)",
  shadowColor:"#000",
  shadowOffset:{width:0,height:4},
  shadowOpacity:0.2,
  shadowRadius:8,
  elevation:5
  },
  for_agree_and_continue_1: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },
});
