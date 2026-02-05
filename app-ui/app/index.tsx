import { StyleSheet, Text, View } from "react-native";
import BLEButton from "./ble";
import React, { useState, useEffect } from "react";
import Heatmap from "./heatmap";

export default function Index() {
  const [averages, setAverages] = useState<number[] | null>(null); // pressure sensor averages
  const [accelAverages, setAccelAverages] = useState<{ x: number; y: number; z: number } | null>(null); // accel data
  const [gyroAverages, setGyroAverages] = useState<{ x: number; y: number; z: number } | null>(null); // gyro data
  // step metrics
  const [stepCount, setStepCount] = useState<number | null>(null);
  const [cadence, setCadence] = useState<number | null>(null);
  const [strideLength, setStrideLength] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);

  const handleNewSession = () => {
    setAverages(null); // only render heatmap post session, do not maintain previous heatmap during a new session
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
          onConnect={handleNewSession}
        />
      </View>

      <View style={{ height: 10 }} />

      <View style={styles.strideGaitBox}>
        {stepCount !== null && cadence !== null && speed !== null ? ( // stride and gait => step count, cadence (if no data show placeholder text)
          <>
            <Text style={styles.analysisText}>
              Step Count: {stepCount}
            </Text>
            <Text style={styles.analysisText}>
              Cadence: {Math.round(cadence)} steps/min
            </Text>
            <Text style={styles.analysisText}>
              Stride Length: {strideLength} m
            </Text>
            <Text style={styles.analysisText}>
              Speed: {(speed).toFixed(2)} mph
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
            if (maxPressure === arch) mostPressureRegion = "arch";
            if (maxPressure === heel) mostPressureRegion = "heel";
            //if (toe === arch && toe === heel && arch === heel) mostPressureRegion = "NA"

            // strike type
            let strikeType = "unknown";
            if (heel < toe) strikeType = "heel strike";
            else if (toe < heel) strikeType = "toe strike";
            else if (arch < heel && arch < toe) strikeType = "flat/midfoot strike";
            else strikeType = "even"

            // insights
            const insights = `Most pressure is detected on the ${mostPressureRegion}\n` +
                       `Estimated strike type: ${strikeType}`;
            
            return (
              <View>
                <Text style={styles.analysisText}>
                  Most pressure is detected on the {mostPressureRegion}
                </Text>
                <Text style={styles.analysisText}>
                  Estimated strike type: {strikeType}
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
