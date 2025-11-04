import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import CallsScreen from "./callsscreen";
import ChatsScreen from "./chatscreen";
import OnlineUsersScreen from "./online";
import SocketInitializer from "./components/SocketInitializer";
import { useAuth } from "./contexts/AuthContext";
import UpdatesScreen from "./updatescreen";

const Tab = createMaterialTopTabNavigator();

export default function FrontScreen() {
  // Add auth context check
  const { user, isLoading } = useAuth();
  
  console.log('🔧 FrontScreen rendering with user:', user?.uid, 'loading:', isLoading);
  
  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <View style={[styles.tabs, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading...</Text>
      </View>
    );
  }
  
  return (
    <SocketInitializer>
      <Tab.Navigator
        style={styles.tabs}
        screenOptions={{
          tabBarLabelStyle: { fontSize: 14, fontWeight: "bold" },
          tabBarStyle: { backgroundColor: "#d32f2f" },
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "#f5b5b5",
        }}
      >
        <Tab.Screen name="Online" component={OnlineUsersScreen} />
        <Tab.Screen name="Chats" component={ChatsScreen} />
        <Tab.Screen name="Updates" component={UpdatesScreen} />
        <Tab.Screen name="Calls" component={CallsScreen} />
      </Tab.Navigator>
    </SocketInitializer>
  );
}

const styles = StyleSheet.create({
  tabs: {
    top: 50,
  },
});
