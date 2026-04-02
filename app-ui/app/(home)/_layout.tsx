import { DrawerContentScrollView, DrawerItem, DrawerItemList } from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import * as SecureStore from "expo-secure-store";
import { Platform, StyleSheet, Text, View } from "react-native";

export default function Layout() {
  const router = useRouter();

  const handleSignOut = async () => {
    await SecureStore.deleteItemAsync("userProfile");
    await SecureStore.deleteItemAsync("currentUser");
    await SecureStore.deleteItemAsync("userId");

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

      <Drawer.Screen
        name="analysis"
        options={{ drawerItemStyle: {display: "none"}}}
      />

      <Drawer.Screen
        name="ble/ble"
        options={{ drawerItemStyle: {display: "none"}}}
      />

      <Drawer.Screen
        name="ble/types"
        options={{ drawerItemStyle: {display: "none"}}}
      />

      <Drawer.Screen
        name="ble/storage"
        options={{ drawerItemStyle: {display: "none"}}}
      />

      <Drawer.Screen
        name="ble/permissions"
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