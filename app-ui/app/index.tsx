import { StyleSheet, Text, View } from "react-native";
import BLEButton from "./ble";
import React, { useState, useEffect } from "react";
import Heatmap from "./heatmap";

export default function Index() {
  const [averages, setAverages] = useState<number[] | null>(null); // pressure
  const [accelAverages, setAccelAverages] = useState<{ x: number; y: number; z: number } | null>(null);
  const [gyroAverages, setGyroAverages] = useState<{ x: number; y: number; z: number } | null>(null);
  const [stepCount, setStepCount] = useState<number | null>(null);
  const [cadence, setCadence] = useState<number | null>(null);

  // const getColor = (value: number) => {
  //   // Normalize 0-1
  //   let intensity = Math.min(Math.max(value / 1023, 0), 1);

  //   // Dramatic nonlinear mapping (log-like)
  //   intensity = Math.pow(intensity, 3); // exponent >1: low values stay dark/red, high values jump to yellow

  //   // Map intensity to hue: red (0°) → yellow (60°)
  //   const hue = intensity * 60;

  //   // Optional: tweak lightness for more dramatic effect
  //   const lightness = 30 + intensity * 40; // 30% → 70%

  //   return `hsl(${hue}, 100%, ${lightness}%)`;
  // };

  return (
    <View style={styles.container}>

      <View style={styles.buttonBox}>
        <BLEButton 
          setPressureAverages={setAverages}
          setAccelAverages={setAccelAverages} 
          setGyroAverages={setGyroAverages}    
          setStepCount={setStepCount}
          setCadence={setCadence}
        />
      </View>

      <View style={{ height: 10 }} />

      <View style={styles.strideGaitBox}>
        {stepCount !== null && cadence !== null ? (
          <>
            <Text style={styles.analysisText}>
              Step Count: {stepCount}
            </Text>
            <Text style={styles.analysisText}>
              Cadence: {Math.round(cadence)} steps/min
            </Text>
          </>
        ) : (
           <Text style={styles.placeholderText}>Stride / Gait Analysis (Waiting for data)</Text>
        )}

        {/* {accelAverages && gyroAverages ? (
          <>
            <Text style={styles.analysisText}>
              Accelerometer: x = {accelAverages.x.toFixed(2)}, y = {accelAverages.y.toFixed(2)}, z = {accelAverages.z.toFixed(2)}
            </Text>
            <Text style={styles.analysisText}>
              Gyroscope: x = {gyroAverages.x.toFixed(2)}, y = {gyroAverages.y.toFixed(2)}, z = {gyroAverages.z.toFixed(2)}
            </Text>
          </>
        ) : (
          <Text style={styles.placeholderText}>Stride / Gait Analysis (Waiting for accel/gyro data)</Text>
        )} */}

      </View>

      <View style={{ height: 10 }} />

      <View style={styles.heatmapBox}>
        {averages && averages.length === 3 ? (
          <Heatmap averages={averages} />
        ) : (
          <Text style={styles.placeholderText}>Heatmap</Text>
        )}
      </View>

      <View style={{ height: 10 }} />
      <View style={styles.insightsBox}>
        <Text style={styles.placeholderText}>Insights (Coming Soon!)</Text>
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
  analysisText: {
    color: "#fff",
    fontSize: 14,
    marginVertical: 2,
    textAlign: "center", 
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
    overflow: "hidden",
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
  },
  placeholderText: {
    color: "#ffffffc4",
    fontSize: 14,
  },
});
