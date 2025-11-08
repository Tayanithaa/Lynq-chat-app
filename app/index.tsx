import './polyfills';

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "./contexts/AuthContext";
import MessageEncryption from './utils/encryption';

// Polyfill for secure random numbers used by crypto-js in React Native / Expo.
// Try to use `expo-random` at runtime — use require so the module absence
// doesn't crash the bundle in environments where it's not installed.
void (async () => {
  try {
    const Random = await import('expo-random');
    if (typeof (global as any).crypto === 'undefined') {
      (global as any).crypto = {
        getRandomValues: (arr: Uint8Array) => {
          const bytes = Random.getRandomBytes(arr.length);
          arr.set(bytes);
          return arr;
        },
      };
      console.log('✅ crypto.getRandomValues polyfilled using expo-random');
    }
  } catch {
    console.warn('⚠️ expo-random not available - install expo-random to enable secure random numbers for crypto-js');
  }
})();
export default function WelcomeScreen() {
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth();
  // Run a quick encryption/decryption self-test once on app load to help
  // confirm the runtime RNG/polyfill is working on the device.
  useEffect(() => {
    try {
      const ok = MessageEncryption.test();
      console.log('🔍 Encryption self-test result:', ok);
    } catch (e) {
      console.warn('🔍 Encryption self-test threw:', e);
    }
  }, []);
  useEffect(() => {
    // Intentionally do NOT auto-redirect here.
    // We want the welcome screen to let the user choose to continue
    // (prevents immediate navigation when a token exists in storage).
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34e89e" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

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
  Agree & Continue to accept the
        <Text style={styles.textcolour}> Terms and Conditions </Text>
      </Text>

      {/* If a user is already authenticated, show options instead of auto-redirect */}
      {user ? (
        <>
          <Text style={{ fontSize: 18, marginTop: 20, color: 'white', fontWeight: '600' }}>Signed in as {user.displayName || user.username}</Text>
          <TouchableOpacity
            style={[styles.for_agree_and_continue, { marginTop: 12 }]}
            onPress={() => router.replace('/front')}
          >
            <Text style={styles.for_agree_and_continue_1}>Continue as {user.displayName || user.username}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.for_agree_and_continue, { marginTop: 12, backgroundColor: 'rgba(255,255,255,0.08)' }]}
            onPress={async () => { await signOut(); router.push('/login'); }}
          >
            <Text style={[styles.for_agree_and_continue_1, { color: '#fff' }]}>Sign out</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          style={styles.for_agree_and_continue}
          onPress={() => {
            router.push('/login');
          }}
        >
          <Text style={styles.for_agree_and_continue_1}>Agree & Continue</Text>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f3443',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
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
