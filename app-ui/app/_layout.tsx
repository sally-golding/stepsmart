import { Stack } from "expo-router";
import { useEffect } from "react";

export default function Layout() {
  useEffect(() => {
    console.log("ROOT LAYOUT MOUNTED", Date.now());

    return () => {
      console.log("ROOT LAYOUT UNMOUNTED", Date.now());
    };
  }, []);
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(home)" />
    </Stack>
  );
}
