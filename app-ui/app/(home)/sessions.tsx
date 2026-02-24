import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import Heatmap from "./heatmap";

interface SessionData {
  duration: string;
  distance: number;
  steps: number;
  speed: number;
  pace: number;
  cadence: number;
  strideLength: number;
  pressure: number[] | null;
}

export default function SessionView({ data }: { data: SessionData }) {
  const formatPace = (decimalPace: number | null) => {
    if (!decimalPace || decimalPace === 0) return "0:00";
    const mins = Math.floor(decimalPace);
    const secs = Math.round((decimalPace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateInsights = () => {
    if (!data.pressure || data.pressure.length !== 3) return null;
    const [toe, arch, heel] = data.pressure;
    let strikeType = "Even";
    if (heel < toe) strikeType = "Heel Strike";
    else if (toe < heel) strikeType = "Left Forefoot Strike";
    else if (arch < heel && arch < toe) strikeType = "Right Forefoot Strike";

    let insights = "Good form! Keep landing beneath your center of mass.";
    if (strikeType === "Heel Strike") insights = "Try increasing your cadence to avoid overstriding.";
    if (strikeType.includes("Forefoot")) insights = "Focus on landing your foot beneath your hips.";

    return { strikeType, insights };
  };

  const insights = calculateInsights();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.strideGaitBox}>
        <Text style={styles.analysisText}><Text style={{ fontWeight: "bold" }}>Time:</Text> {data.duration}</Text>
        <Text style={styles.analysisText}><Text style={{ fontWeight: "bold" }}>Distance:</Text> {data.distance.toFixed(2)} miles</Text>
        <Text style={styles.analysisText}><Text style={{ fontWeight: "bold" }}>Step Count:</Text> {data.steps}</Text>
        <Text style={styles.analysisText}><Text style={{ fontWeight: "bold" }}>Speed:</Text> {data.speed.toFixed(2)} mph</Text>
        <Text style={styles.analysisText}><Text style={{ fontWeight: "bold" }}>Pace:</Text> {formatPace(data.pace)}/mile</Text>
        <Text style={styles.analysisText}><Text style={{ fontWeight: "bold" }}>Cadence:</Text> {Math.round(data.cadence)} steps/min</Text>
        <Text style={styles.analysisText}><Text style={{ fontWeight: "bold" }}>Stride:</Text> {data.strideLength} m</Text>
      </View>

      <View style={{ height: 10 }} />

      <View style={styles.heatmapBox}>
        {data.pressure ? <Heatmap averages={data.pressure} /> : <Text style={styles.placeholderText}>No Pressue Visualization</Text>}
      </View>

      <View style={{ height: 10 }} />

      <View style={styles.insightsBox}>
        {insights ? (
          <View>
            <Text style={styles.analysisText}><Text style={{ fontWeight: "bold" }}>Strike:</Text> {insights.strikeType}</Text>
            <Text style={styles.analysisText}>{insights.insights}</Text>
          </View>
        ) : <Text style={styles.placeholderText}>Insights</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#1c1c1e"
  },
  welcomeText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 10,
    marginBottom: 10,
    fontWeight: "600",
    textAlign: "center"
  },
  welcomeBox: {
    width: "90%",
    height: 60,
    marginBottom: 20,
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
  analysisText: {
    color: "#fff",
    fontSize: 14,
    marginVertical: 2,
    textAlign: "center", 
  },
  strideGaitBox: {
    width: "90%",
    height: 180,
    backgroundColor: "#3a3a3c",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
  },
  heatmapBox: {
    width: "90%",
    height: 255,
    backgroundColor: "#3a3a3c",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
    overflow: "hidden",
  },
  insightsBox: {
    width: "90%",
    height: 80,
    // backgroundColor: "#e6e6e6",
    backgroundColor: "#3a3a3c",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
  },
  buttonBox: {
    width: "45%",
    height: 45,
    // backgroundColor: "#e6e6e6",
    backgroundColor: "#1c1c1e",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1c1c1e",
    marginTop: 10,
  },
  placeholderText: {
    color: "#ffffffc4",
    fontSize: 14,
  },
});
