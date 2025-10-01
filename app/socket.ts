// app/socket.ts
import { io, Socket } from "socket.io-client";
import { getAuth } from "firebase/auth";

let socket: Socket | null = null;

/**
 * Call initSocket() once after user logs in.
 * Replace SERVER_URL with your server IP/host.
 */
export async function initSocket(SERVER_URL = "http://10.0.2.2:3000") {
  if (socket && socket.connected) return socket;

  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("User not signed in");

  const token = await user.getIdToken(/* forceRefresh */ false);

  socket = io(SERVER_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnectionAttempts: 5
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
