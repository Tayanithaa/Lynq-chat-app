import React, { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, Button, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { initSocket, getSocket, disconnectSocket } from "./socket";
import { getAuth } from "firebase/auth";

type RouteParams = {
  params: {
    chatId: string;
  };
};

type MessageItem = {
  fromUid: string;
  message: string;
  ts: number;
};

export default function ChatRoomScreen() {
  const route = useRoute<RouteProp<RouteParams, "params">>();
  const chatId = route.params.chatId;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Initialize socket (calls firebase currentUser.getIdToken())
        const s = await initSocket(/* optional: pass SERVER_URL here */);
        socketRef.current = s;

        // join the chat room
        s.emit("join-room", { roomId: chatId });

        // receive message
        const handler = (data: any) => {
          if (!mounted) return;
          setMessages(prev => [...prev, { fromUid: data.fromUid, message: data.message, ts: data.ts }]);
        };
        s.on("receive-message", handler);

        // clean up function
        return () => {
          mounted = false;
          s.off("receive-message", handler);
        };
      } catch (err) {
        console.error("Socket init error:", err);
      }
    })();

    // optional cleanup when leaving screen
    return () => {
      // don't disconnect socket globally unless you want to disconnect on screen leave
      // disconnectSocket();
    };
  }, [chatId]);

  const send = () => {
    if (!message.trim()) return;
    const s = socketRef.current;
    if (!s || !s.connected) {
      console.warn("Socket not connected");
      return;
    }

    s.emit("send-message", { roomId: chatId, message });

    // add local echo
    const uid = getAuth().currentUser?.uid ?? "me";
    setMessages(prev => [...prev, { fromUid: uid, message, ts: Date.now() }]);
    setMessage("");
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.container}>
        <Text style={styles.header}>Room: {chatId}</Text>

        <FlatList
          data={messages}
          keyExtractor={(item, idx) => `${item.ts}-${idx}`}
          renderItem={({ item }) => (
            <View style={styles.msgRow}>
              <Text style={styles.msgFrom}>{item.fromUid}</Text>
              <Text style={styles.msgText}>{item.message}</Text>
            </View>
          )}
          style={styles.list}
        />

        <View style={styles.inputRow}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            style={styles.input}
          />
          <Button title="Send" onPress={send} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  header: { fontSize: 18, marginBottom: 10 },
  list: { flex: 1 },
  msgRow: { marginVertical: 6 },
  msgFrom: { fontWeight: "600" },
  msgText: { marginTop: 2 },
  inputRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 8, marginRight: 8 }
});
