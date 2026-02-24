import { Drawer } from "expo-router/drawer";
import { Text, Platform, View, StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { useRouter, Stack } from "expo-router";
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from "@react-navigation/drawer";

export default function Layout() {
  const router = useRouter();

  const handleSignOut = async () => {
    await SecureStore.deleteItemAsync("userProfile");
    await SecureStore.deleteItemAsync("currentUser");

    router.replace("/");
  };


  return (
    <Drawer
    drawerContent={(props) => (
      <View style={{ flex: 1, backgroundColor: "#1c1c1e" }}>
          <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1, paddingTop: 50 }}>
            <DrawerItemList {...props} />
          </DrawerContentScrollView>

          <View style={styles.footer}>
            <DrawerItem
              label="Sign Out"
              labelStyle={{ color: "#ccc", fontWeight: "bold" }}
              onPress={handleSignOut}
            />
          </View>
        </View>
    )}
      screenOptions={{
        headerStyle: { backgroundColor: "#1c1c1e" },
        headerTintColor: "#fff",
        headerTitleAlign: "center",
        headerStatusBarHeight: Platform.OS === 'android' ? 35 : undefined,
        drawerStyle: {
          backgroundColor: "#3a3a3c",
          width: 250,
        },
        drawerActiveTintColor: "#fff",
        drawerInactiveTintColor: "#ccc",
      }}
    >
      <Drawer.Screen
        name="home" 
        options={{ drawerLabel: "Home",
          headerTitle: () => (
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>StepSmart</Text>
          ),
        }}
      />

      <Drawer.Screen 
        name="profile" 
        options={{ drawerLabel: "View Profile",
          headerTitle: () => (
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Profile</Text>
          ),
         }}
      />

      <Drawer.Screen 
        name="activities" 
        options={{ drawerLabel: "View Past Activities",
          headerTitle: () => (
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Past Activities</Text>
          ),
         }}
      />



      {/* <Drawer.Screen 
        name="signout" 
        options={{ title: "Sign Out", drawerLabel: "Sign Out" }} 
        listeners={{
          drawerItemPress: (e) => {
            e.preventDefault();
            handleSignOut();
          },
        }}
      /> */}

      <Drawer.Screen
        name="ble"
        options={{ drawerItemStyle: {display: "none"}}}
      />

      <Drawer.Screen
        name="heatmap"
        options={{ drawerItemStyle: {display: "none"}}}
      />

      <Drawer.Screen
        name="sessions"
        options={{ drawerItemStyle: {display: "none"}}}
      />

    </Drawer>
  );
}

const styles = StyleSheet.create({
  footer: {
    borderTopColor: "#333",
    borderTopWidth: 1,
    marginTop: 'auto',
    paddingBottom: Platform.OS === 'android' ? 40 : 30, 
    marginBottom: Platform.OS === 'android' ? 20 : 0,
    paddingTop: 10,
  },
});