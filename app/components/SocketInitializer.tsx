// components/SocketInitializer.tsx
import React, { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { disconnectSocket, initSocket } from "../socket";

export default function SocketInitializer({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return; // Wait for auth to initialize

    if (user) {
      try {
        // Initialize socket with default URL or pass your server IP here
        initSocket(); // or initSocket("http://192.168.1.100:3000")
        console.log("Socket initialized for user:", user.uid);
      } catch (err) {
        console.error("Failed to init socket:", err);
      }
    } else {
      // user signed out -> disconnect
      disconnectSocket();
      console.log("Socket disconnected");
    }
  }, [user, isLoading]);

  return <>{children}</>;
}