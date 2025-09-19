// app/index.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Your chat data (dynamic list, can be extended later)
  const chats = [
    { id: "chat1", name: "Walt" },
    { id: "chat2", name: "Bob" },
    { id: "alice", name: "Alice" },
    { id: "charlie", name: "Charlie" },
  ];

  // Filter chats by search query
  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  // Define the type for a chat item
  type ChatItem = { id: string; name: string };

  // Render each chat item
  const renderItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity
      style={styles.item}
      activeOpacity={0.7}
      onPress={() => router.push(`./chat/${item.id}`)} // Dynamic routing
    >
      <Text style={styles.itemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to the Chat App</Text>

      {/* Search input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search chats..."
        value={searchQuery}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => {
          if (searchQuery.trim() === "") setShowSuggestions(false);
        }}
        onChangeText={setSearchQuery}
      />

      {/* Show filtered list if searching, otherwise show all chats */}
      <FlatList
        data={showSuggestions ? filteredChats : chats}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No chats found</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  searchInput: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  item: {
    backgroundColor: "#f2f2f2",
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
  },
  itemText: {
    fontSize: 18,
    opacity: 0.8,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "gray",
  },
});
