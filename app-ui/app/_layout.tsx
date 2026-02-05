import { Stack } from "expo-router";
import { Text, View } from "react-native";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "STEPSMART",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#1c1c1e", },
          headerTintColor: "#fff",
          headerTitle: () => (
            <Text style={{ color: "#fff", fontSize: 20 }}>
              <Text style={{ fontWeight: "bold" }}>Step</Text>
              <Text style={{ fontWeight: "bold" }}>Smart</Text>
            </Text>
          ),
        }}
      />
    </Stack>
  );
}



