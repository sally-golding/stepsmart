import { StyleSheet, Text, View } from "react-native";
import BLEButton from "./ble";
import React, { useState, useEffect } from "react";
import Heatmap from "./heatmap";

export default function Index() {
  const [averages, setAverages] = useState<number[] | null>(null); // pressure sensor averages
  const [accelAverages, setAccelAverages] = useState<{ x: number; y: number; z: number } | null>(null); // accel data
  const [gyroAverages, setGyroAverages] = useState<{ x: number; y: number; z: number } | null>(null); // gyro data
  // step metrics
  const [stepCount, setStepCount] = useState<number>(0);
  const [cadence, setCadence] = useState<number>(0);
  const [strideLength, setStrideLength] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  const [pace, setPace] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [timer, setTimer] = useState<string>("00:00:00");

  const handleNewSession = () => {
    setAverages(null); // only render heatmap post session, do not maintain previous heatmap during a new session
    setStepCount(0);
    setCadence(0);
    setStrideLength(0);
    setSpeed(0);
    setPace(0);
    setTimer("00:00:00");
  };

  const formatPace = (decimalPace: number | null) => {
    if (!decimalPace || decimalPace === 0) return "0:00";
    const mins = Math.floor(decimalPace);
    const secs = Math.round((decimalPace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>

      <View style={styles.buttonBox}>
        <BLEButton // ble button, pass setter functions
          setPressureAverages={setAverages}
          setAccelAverages={setAccelAverages} 
          setGyroAverages={setGyroAverages}    
          setStepCount={setStepCount}
          setCadence={setCadence} 
          setStrideLength={setStrideLength}
          setSpeed={setSpeed}
          setPace={setPace}
          setDistance={setDistance}
          setTimer={setTimer}
          onConnect={handleNewSession}
        />
      </View>

      <View style={{ height: 10 }} />

      <View style={styles.strideGaitBox}>
        {stepCount !== null && cadence !== null && speed !== null && pace != null && distance != null ? ( // stride and gait => step count, cadence (if no data show placeholder text)
          <>
            <Text style={styles.analysisText}>
              <Text style={{ fontWeight: "bold" }}>Time:</Text> {timer}
            </Text>
            <Text style={styles.analysisText}>
              <Text style={{ fontWeight: "bold" }}>Distance:</Text> {distance?.toFixed(2)} miles
            </Text>
            <Text style={styles.analysisText}>
              <Text style={{ fontWeight: "bold" }}>Step Count:</Text> {stepCount}
            </Text>

            {/* <Text style={[styles.analysisText, {fontWeight: "bold"}]}>
              {averages ? "Average Stats " : "Live Stats: "}
            </Text> */}

            <Text style={styles.analysisText}>
              <Text style={{ fontWeight: "bold" }}>Speed:</Text> {(speed).toFixed(2)} mph
            </Text>
            <Text style={styles.analysisText}>
              <Text style={{ fontWeight: "bold" }}>Pace:</Text> {formatPace(pace)}/mile
            </Text>
            
            <Text style={styles.analysisText}>
              <Text style={{ fontWeight: "bold" }}>Cadence:</Text> {Math.round(cadence)} steps/min
            </Text>
            <Text style={styles.analysisText}>
              <Text style={{ fontWeight: "bold" }}>Stride Length:</Text> {strideLength} m
            </Text>
          </>
        ) : (
           <Text style={styles.placeholderText}>Stride & Gait Analysis</Text>
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
          <Text style={styles.placeholderText}>Accel & Gyro Data</Text>
        )} */}

      </View>

      <View style={{ height: 10 }} />

      <View style={styles.heatmapBox}>
        {averages && averages.length === 3 ? ( // render and display heatmap when data is valid
          <Heatmap averages={averages} />
        ) : (
          <Text style={styles.placeholderText}>Heatmap</Text>
        )}
      </View>

      <View style={{ height: 10 }} />

      <View style={styles.insightsBox}>
        {averages && averages.length === 3 ? (
          (() => {
            const [toe, arch, heel] = averages;
            // most pressure (inverted)
            let mostPressureRegion = "unknown";
            const maxPressure = Math.min(toe, arch, heel);
            if (maxPressure === toe) mostPressureRegion = "toe";
            if (maxPressure === arch) mostPressureRegion = "little toe";
            if (maxPressure === heel) mostPressureRegion = "big toe";
            //if (toe === arch && toe === heel && arch === heel) mostPressureRegion = "NA"

            // strike type
            let strikeType = "Unknown";
            if (heel < toe) strikeType = "Heel Strike";
            else if (toe < heel) strikeType = "Left Forefoot Strike";
            else if (arch < heel && arch < toe) strikeType = "Right Forefoot Strike";
            else strikeType = "Even"

            // insights
            let insights = "";
            if (strikeType === "Heel Strike") insights = "Try increasing your cadence and avoid overstriding so your foot lands closer beneath your hips."
            if (strikeType === "Left Forefoot Strike" || strikeType === "Right Forefoot Strike") 
              insights = "Focus on landing your foot beneath your hips to reduce understriding."
            
            return (
              <View>
                {/* <Text style={styles.analysisText}>
                  Most pressure is detected on the {mostPressureRegion}
                </Text> */}
                <Text style={styles.analysisText}>
                  <Text style={{ fontWeight: "bold" }}>Estimated Strike Type:</Text> {strikeType}
                </Text>
                <Text style={styles.analysisText}>
                  {insights}
                </Text>
              </View>
            );
          })()
      ) : (
        <Text style={styles.placeholderText}>Insights</Text>
      )}
      </View>
    </View>
  );
}

// stylesheet (css)
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
    height: 205,
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
    height: 90,
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
