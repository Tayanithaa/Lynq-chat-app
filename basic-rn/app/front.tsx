import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import ChatsScreen from "./chatscreen";
import UpdatesScreen from "./updatescreen";
import CallsScreen from "./callsscreen";
import { StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage"; 
const Tab = createMaterialTopTabNavigator();

export default function FrontScreen() {
  return (
    <Tab.Navigator
      style={styles.tabs}
      screenOptions={{
        tabBarLabelStyle: { fontSize: 14, fontWeight: "bold" },
        tabBarStyle: { backgroundColor: "#d32f2f" },
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#f5b5b5",
      }}
    >
      <Tab.Screen name="Chats" component={ChatsScreen} />
      <Tab.Screen name="Updates" component={UpdatesScreen} />
      <Tab.Screen name="Calls" component={CallsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabs: {
    top: 50,
  },
});
