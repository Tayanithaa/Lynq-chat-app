// app/layout.tsx
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { disconnectSocket, initSocket } from "./socket"; // relative to app/

function NavigationStack() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      try {
        // Initialize socket with default URL or pass your server IP here
        initSocket(); // or initSocket("http://192.168.1.100:3000")
        console.log("Socket initialized");
      } catch (err) {
        console.error("Failed to init socket:", err);
      }
    } else {
      // user signed out -> disconnect
      disconnectSocket();
      console.log("Socket disconnected");
    }
  }, [user]);

  // keep your existing navigation stack
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NavigationStack />
    </AuthProvider>
  );
}
