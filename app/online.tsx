import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from './contexts/AuthContext';
import { useOnlineUsers } from './hooks/useOnlineUsers';

export default function OnlineUsersScreen() {
  const { user } = useAuth();
  const username = user?.username;
  const online = useOnlineUsers(username);

  const data = useMemo(() => {
    // Put current user first and label it
    const others = online.filter((u) => u !== username);
    const me = username ? [username] : [];
    return [...me, ...others];
  }, [online, username]);

  const openChat = (other: string) => {
    if (!username) return;
    if (other === username) return; // don't open chat to self
    router.push({ pathname: '/chat/[chatId]', params: { chatId: other } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Online users</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => {
          const isMe = item === username;
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => !isMe && openChat(item)}
              disabled={isMe}
            >
              <View style={[styles.dot, { backgroundColor: '#00E676' }]} />
              <Text style={styles.name}>{isMe ? `${item} (You)` : item}</Text>
              {!isMe && <Text style={styles.link}>Chat →</Text>}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}> 
            <Text style={styles.emptyText}>Nobody online yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', paddingTop: 12 },
  title: { fontSize: 18, fontWeight: '600', paddingHorizontal: 16, paddingBottom: 8 },
  sep: { height: 1, backgroundColor: '#E0E0E0', marginLeft: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  name: { flex: 1, fontSize: 16, color: '#212121' },
  link: { color: '#007bff', fontWeight: '600' },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#757575' },
});
