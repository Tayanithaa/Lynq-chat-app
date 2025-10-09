// app/_layout.tsx
import { Stack } from "expo-router";
import React from "react";
import { AuthProvider } from "./contexts/AuthContext";

// Simplified layout without nested auth consumption
export default function RootLayout() {
  console.log('🔧 RootLayout rendering...');
  
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
