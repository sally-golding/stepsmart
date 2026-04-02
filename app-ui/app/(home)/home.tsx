import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import BLEButton from "./ble/ble";
import Heatmap from "./heatmap";

export default function Index() {
  // user profile state
  const [userName, setUserName] = useState<string | null>(null);
  const [userWeight, setUserWeight]  = useState<number | null>(null);

  // on mount, load user profile
  useEffect(() => {
    const loadProfile = async () => {
      const profile = await SecureStore.getItemAsync("currentUser");
      if (profile) {
        const parsed = JSON.parse(profile);
        setUserName(parsed.name);
        setUserWeight(parsed.weightLb); // needed for heatmap
      }
    };
    loadProfile();
  }, []);

  // session and metric state
  const [averages, setAverages] = useState<number[] | null>(null); // pressure sensor averages
  const [stepCount, setStepCount] = useState<number>(0);
  const [cadence, setCadence] = useState<number>(0);
  const [strideLength, setStrideLength] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  const [pace, setPace] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [timer, setTimer] = useState<string>("00:00:00");

  // resets ui state when a new ble connection is established
  const handleNewSession = () => {
    setAverages(null); // only render heatmap post session, do not maintain previous heatmap during a new session
    setStepCount(0);
    setCadence(0);
    setStrideLength(0);
    setSpeed(0);
    setPace(0);
    setDistance(0);
    setTimer("00:00:00");
  };

  // converts decimale pace to standard running format
  const formatPace = (decimalPace: number | null) => {
    if (!decimalPace || decimalPace === 0) return "0:00";
    const mins = Math.floor(decimalPace);
    const secs = Math.round((decimalPace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>

      <View style={styles.welcomeBox}>
        {userName && (
          <Text style={styles.welcomeText}>
            Welcome, {userName}
          </Text>
        )}
      </View>

      <View style={styles.buttonBox}>
        <BLEButton // ble button, pass setter functions
          setPressureAverages={setAverages}    
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

      <View style={{ height: 55 }} />

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

      </View>

      <View style={{ height: 8 }} />

      <View style={styles.heatmapBox}>
        {averages && averages.length === 3 && userWeight !== null ? ( // render and display heatmap when data is valid
          <Heatmap averages={averages} userWeight={userWeight} />
        ) : (
          <Text style={styles.placeholderText}>Pressure Visualization</Text>
        )}
      </View>

      <View style={{ height: 8 }} />

      <View style={styles.insightsBox}>
        {averages && averages.length === 3 ? (
          (() => {
            const [toe, heel, arch] = averages;
            // most pressure (inverted)
            let mostPressureRegion = "unknown";
            const maxPressure = Math.min(toe, arch, heel);
            if (maxPressure === toe) mostPressureRegion = "toe";
            if (maxPressure === arch) mostPressureRegion = "little toe";
            if (maxPressure === heel) mostPressureRegion = "big toe";
            //if (toe === arch && toe === heel && arch === heel) mostPressureRegion = "NA"

            // strike type
            let strikeType = "Unknown";
            if (heel < toe && heel < arch) strikeType = "Heel Strike";
            else if (toe < heel && toe < arch) strikeType = "Left Forefoot Strike";
            else if (arch < heel && arch < toe) strikeType = "Right Forefoot Strike";
            else strikeType = "Even"

            // insights
            let insights = "";
            if (strikeType === "Heel Strike") insights = "Try increasing your cadence and avoid overstriding so your foot lands closer beneath your hips."
            if (strikeType === "Left Forefoot Strike" || strikeType === "Right Forefoot Strike") insights = "Focus on landing your foot beneath your hips to reduce understriding."
            
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
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#1c1c1e"
  },
  welcomeText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 5,
    marginBottom: 10,
    fontWeight: "600",
    textAlign: "center"
  },
  welcomeBox: {
    width: "90%",
    height: 60,
    marginBottom: 15,
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
    fontSize: 13,
    marginVertical: 2,
    textAlign: "center", 
  },
  strideGaitBox: {
    width: "90%",
    height: 160,
    backgroundColor: "#3a3a3c",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
  },
  heatmapBox: {
    width: "90%",
    height: 235,
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
    height: 75,
    // backgroundColor: "#e6e6e6",
    backgroundColor: "#3a3a3c",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
    padding: 10
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
