import { Text, View, StyleSheet } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <View style={styles.strideGaitBox}>
        <Text style={styles.placeholderText}>Stride / Gait Analysis</Text>
      </View>
      <View style={{ height: 20 }} />
      <View style={styles.heatmapBox}>
        <Text style={styles.placeholderText}>Heatmap</Text>
      </View>
      <View style={{ height: 20 }} />
      <View style={styles.insightsBox}>
        <Text style={styles.placeholderText}>Insights</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1c1c1e",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#fff",
  },
  text: {
    color: "#fff",
    fontSize: 16,
  },
  strideGaitBox: {
    width: "90%",
    height: 150,
    backgroundColor: "#3a3a3c",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
  },
  heatmapBox: {
    width: "90%",
    height: 275,
    backgroundColor: "#3a3a3c",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
  },
  insightsBox: {
    width: "90%",
    height: 120,
    // backgroundColor: "#e6e6e6",
    backgroundColor: "#3a3a3c",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
  },
  placeholderText: {
    color: "#ffffffc4",
    fontSize: 14,
  },
});
