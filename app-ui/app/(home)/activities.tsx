import { View, Text, StyleSheet, FlatList, TouchableOpacity, Button } from "react-native";
import { useEffect, useState, useCallback } from "react";
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect } from "expo-router";
import SessionView from "./sessions"; 

export default function Activities() {
  const [history, setHistory] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

// load
const loadHistory = async () => {
  // uncomment to clear
  //await FileSystem.writeAsStringAsync((FileSystem as any).documentDirectory + "sessions_history.json", JSON.stringify([]));
    try {
    const path = (FileSystem as any).documentDirectory + "sessions_history.json";
    const fileInfo = await FileSystem.getInfoAsync(path);
    if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(path);
        const parsed = JSON.parse(content);
        setHistory(parsed.reverse()); // newest first
    }
  } catch (e) {
    console.log("Error loading history:", e);
    }
};

useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
);

  // if selected show component
  if (selectedSession) {
    return (
      <View style={{ flex: 1, backgroundColor: "#1c1c1e", alignItems: "stretch" }}>
        <View style={{ alignItems: 'center', width: '100%', marginTop: 40, marginBottom: 10 }}>
          <View style={{ width: 200, height: 50 }}>
            <Button 
              title="Back to Activities" 
              onPress={() => setSelectedSession(null)} 
              color="#007AFF" 
            />
          </View>
        </View>      
        
        <SessionView data={selectedSession} />
      </View>
    );
  }

  // show past sessions
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