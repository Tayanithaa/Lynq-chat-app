// app/layout.tsx
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initSocket, disconnectSocket } from "./socket"; // relative to app/

export default function RootLayout() {
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Initialize socket with default URL or pass your server IP here
          await initSocket(); // or initSocket("http://192.168.1.100:3000")
          console.log("Socket initialized");
        } catch (err) {
          console.error("Failed to init socket:", err);
        }
      } else {
        // user signed out -> disconnect
        disconnectSocket();
        console.log("Socket disconnected");
      }
    });

    return () => unsubscribe();
  }, []);

  // keep your existing navigation stack
  return <Stack screenOptions={{ headerShown: false }} />;
}
