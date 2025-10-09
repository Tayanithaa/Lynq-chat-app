// app/socket.ts
import { getAuth } from "firebase/auth";
import { io, Socket } from "socket.io-client";
import { getSocketConfig, getSocketUrl } from './utils/socketConfig';

let socket: Socket | null = null;

/**
 * Call initSocket() once after user logs in.
 * Automatically detects correct URL for web and mobile.
 */
export async function initSocket(SERVER_URL?: string) {
  if (socket && socket.connected) return socket;

  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("User not signed in");

  const token = await user.getIdToken(/* forceRefresh */ false);
  const socketUrl = SERVER_URL || getSocketUrl();
  const socketConfig = getSocketConfig();

  console.log(`🔌 Connecting to socket: ${socketUrl}`);

  // Configure socket for both mobile and web compatibility
  socket = io(socketUrl, {
    auth: { token },
    ...socketConfig
  });

  socket.on("connect_error", (err: any) => {
    console.warn("Socket connect_error:", err && err.message ? err.message : err);
  });

  return socket;
}

export function getSocket() {
  if (!socket) throw new Error("Socket not initialized. Call initSocket() first.");
  return socket;
}

/** optional: clean up */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
