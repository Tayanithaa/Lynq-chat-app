import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "./contexts/AuthContext";
import { useOnlineUsers } from "./hooks/useOnlineUsers";

export default function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { user } = useAuth();
  const onlineUsers = useOnlineUsers(user?.username);

  // Get users list - combine online users with any recent chats
  const [recentChats] = useState<string[]>([]);

  useEffect(() => {
    // TODO: Load recent chat history from backend/storage
    // For now, just show online users
  }, []);

  // Combine online users with recent chats, removing duplicates
  const allUsers = Array.from(new Set([...onlineUsers, ...recentChats]))
    .filter(username => username !== user?.username); // Exclude self

  // Filter users by search query
  const filteredUsers = allUsers.filter((username) =>
    username.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  // Define the type for a user item
  type UserItem = { id: string; name: string; isOnline: boolean };

  const userItems: UserItem[] = filteredUsers.map(username => ({
    id: username,
    name: username,
    isOnline: onlineUsers.includes(username)
  }));

  // Render each user item
  const renderItem = ({ item }: { item: UserItem }) => (
    <TouchableOpacity
      style={styles.item}
      activeOpacity={0.7}
      onPress={() => router.push(`./chat/${item.id}`)}
    >
      <View style={styles.itemContent}>
        <Text style={styles.itemText}>{item.name}</Text>
        {item.isOnline && (
          <View style={styles.onlineIndicator}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chats</Text>

      {/* Search input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search users..."
        value={searchQuery}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => {
          if (searchQuery.trim() === "") setShowSuggestions(false);
        }}
        onChangeText={setSearchQuery}
      />

      {/* Show filtered list if searching, otherwise show all users */}
      <FlatList
        data={showSuggestions ? userItems : userItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {onlineUsers.length === 0 
                ? "No users online. Start a chat when someone joins!"
                : "No users found"}
            </Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 18,
    opacity: 0.8,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E676',
  },
  onlineText: {
    fontSize: 12,
    color: '#00E676',
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "gray",
  },
});
