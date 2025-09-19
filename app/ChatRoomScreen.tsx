import React from "react";
import { View, Text } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";

type ChatRoomScreenRouteProp = RouteProp<{ params: { chatId: string } }, 'params'>;

export default function ChatRoomScreen() {
  const route = useRoute<ChatRoomScreenRouteProp>();
  const { chatId } = route.params;

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20 }}>
        Welcome to Chat Room: {chatId}
      </Text>

      {/* Future: Add input box + real-time messages here */}
    </View>
  );
}
