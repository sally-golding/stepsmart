import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useState } from "react";
import { Button, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import SessionView from "./sessions";

export default function Activities() {
  const [history, setHistory] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

// load
const loadHistory = async () => {
  // uncomment to clear all past activities
  //await FileSystem.writeAsStringAsync((FileSystem as any).documentDirectory + "sessions_history.json", JSON.stringify([]));
    try {
      const userId = await SecureStore.getItemAsync("userId"); // get current user id to find correct file
      if (!userId) {
        console.log("No userId found");
        setHistory([]);
        return;
      }

      // path to check if history file exists
      const path = (FileSystem as any).documentDirectory + `sessions_history_${userId}.json`;
      const fileInfo = await FileSystem.getInfoAsync(path);

      if (fileInfo.exists) {
        // read content, parse json, and reverse it so the newwest runs appear at the top
        const content = await FileSystem.readAsStringAsync(path);
        const parsed = JSON.parse(content);
        setHistory(parsed.reverse()); // newest first
      } else {
        setHistory([]); // reset if no file found
      }
  } catch (e) {
    console.log("Error loading history:", e);
    }
};

// runs every time user navigations back to this tab
// ensures the list updates immediately after a user finishes a new run
useFocusEffect(
    useCallback(() => {
      setSelectedSession(null); // reset to list view
      loadHistory(); // refresh data
    }, [])
);

  // if selected show component (session)
  if (selectedSession) {
    return (
      <View style={{ flex: 1, backgroundColor: "#1c1c1e", alignItems: "stretch" }}>
        <View style={{ alignItems: 'center', width: '100%', marginTop: 40, marginBottom: 10 }}>
          <View style={{ width: 200, height: 50 }}>
            <Button 
              title="Back to Activities" 
              onPress={() => setSelectedSession(null)} // clear selection to return to list
              color="#007AFF" 
            />
          </View>
        </View>      
        {/* full details component for the selected session */}
        <SessionView data={selectedSession} /> 
      </View>
    );
  }

  // list all past sessions
  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        style={{ width: "100%" }}
        contentContainerStyle={{ alignItems: "center" }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelectedSession(item)}>
            <View>
              <Text style={styles.cardDate}>{item.date}</Text>
              <Text style={styles.cardSub}>
                {item.timestamp} {item.distance?.toFixed(2)} miles
              </Text>
            </View>
            <Text style={styles.chevron}>〉</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.placeholderText}>No activities saved yet</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#1c1c1e",
  },
  welcomeText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 10,
    marginBottom: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  welcomeBox: {
    width: "90%",
    height: 60,
    marginBottom: 20,
  },
  card: {
    width: "90%",
    backgroundColor: "#3a3a3c",
    padding: 20,
    borderRadius: 15,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardDate: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cardSub: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 4,
  },
  chevron: {
    color: "#555",
    fontSize: 18,
  },
  backButton: {
    padding: 20,
    paddingTop: 50, 
    width: '100%', 
    height: '100%', 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  backButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonContainer: {
    width: 200,
    height: 50
  },
  buttonBox: {
    backgroundColor: "#1c1c1e",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
    color: "#007AFF",
  },
  placeholderText: {
    color: "#8e8e93",
    marginTop: 50,
    fontSize: 16
  },
});