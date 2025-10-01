// app/chat/chat1.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Chat1() {
  return (
    <View>
      <Text style={styles.text}>Welcome to Chat 1</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  text:{
  flex: 1,
  
  textAlign: 'center',
  alignItems: 'center',
  }
});