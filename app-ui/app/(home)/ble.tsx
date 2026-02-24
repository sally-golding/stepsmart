import React, { useState, useEffect, useRef } from "react";
import { Button, PermissionsAndroid, Platform, Text, View } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";
import * as FileSystem from "expo-file-system/legacy";
import * as Location from 'expo-location';
import { StepDetector } from "./analysis"

interface BLEButtonProps {
  setPressureAverages?: React.Dispatch<React.SetStateAction<number[] | null>>; // array  for iteration (heatmap)
  setAccelAverages: (values: { x: number; y: number; z: number }) => void;
  setGyroAverages: (values: { x: number; y: number; z: number }) => void;
  setStepCount: (steps: number) => void;
  setCadence: (cadence: number) => void;
  setStrideLength: (stride : number) => void;
  setSpeed: (speed: number) => void;
  setPace: (pace: number) => void;
  setDistance: (pace: number) => void;
  setTimer: (time: string) => void;
  onConnect?: () => void; // only render heatmap post session, do not maintain previous heatmap during a new session
}

const accelValues: { x: number[]; y: number[]; z: number[] } = { x: [], y: [], z: [] };
const gyroValues: { x: number[]; y: number[]; z: number[] } = { x: [], y: [], z: [] };

// ble controller (scanning, connecting, monitoring characteristics)
const manager = new BleManager();

// file paths to store data
const pressure_file: string = (FileSystem as any).documentDirectory + "pressure_data.txt";
const accel_file: string = (FileSystem as any).documentDirectory + "accel_data.txt";
const gyro_file: string = (FileSystem as any).documentDirectory + "gyro_data.txt";
const metrics_file: string = (FileSystem as any).documentDirectory + "metrics_data.txt"; // cadence, stride length, speed, and pace
const history_file: string = (FileSystem as any).documentDirectory + "sessions_history.json"; // store post session

// clear file with a new connection
async function resetFile(path: string) {
    try {
        await FileSystem.writeAsStringAsync(path, "", { encoding: "utf8" });
    } catch (e) {
        console.log("File Reset Error:", e);
    }
}

// add new sensor data
async function appendFile(path: string, text: string) {
    try {
        const fileInfo = await FileSystem.getInfoAsync(path);
        let current = "";
        if (fileInfo.exists) {
        current = await FileSystem.readAsStringAsync(path);
    }

    await FileSystem.writeAsStringAsync(path, current + text, { encoding: "utf8" }); // old + new data

    } catch (e) {
        console.log("File Write Error:", e);
    }
}

// save session
async function saveSessionToHistory(sessionSummary: any) {
    try {
        const fileInfo = await FileSystem.getInfoAsync(history_file);
        let history = [];
        if (fileInfo.exists) {
            const content = await FileSystem.readAsStringAsync(history_file);
            history = JSON.parse(content);
        }
        history.push(sessionSummary);
        await FileSystem.writeAsStringAsync(history_file, JSON.stringify(history), { encoding: "utf8" });
        console.log("Session saved to history.");
    } catch (e) {
        console.error("Error saving history:", e);
    }
}

// ble location permissions
export async function requestLocationPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    console.log('Permission to access location was denied');
    return false;
  }
  return true;
}

// ble permissions: scan, connect, location (android)
export async function requestBlePermissions() {
  if (Platform.OS === "android") {
    const scan = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "BLE Scan Permission",
        message: "This app requires Bluetooth scan access to detect devices.",
        buttonPositive: "Allow",
      }
    );

    const connect = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "BLE Connect Permission",
        message: "This app needs Bluetooth connect access.",
        buttonPositive: "Allow",
      }
    );

    const location = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    return scan === "granted" && connect === "granted"; // approved
  }

  return true;
}

export default function BLEButton({ setPressureAverages, setAccelAverages, setGyroAverages, setStepCount, setCadence, setStrideLength, 
    setSpeed, setPace, setDistance, setTimer, onConnect, }: BLEButtonProps) {
    
        // device and uuids
    const DEVICE_NAME = "StepSmart_Nano";
    const SERVICE_UUID = "1385f9ca-f88f-4ebe-982f-0828bffb54ee";

    const ACCEL_UUID = "1385f9cb-f88f-4ebe-982f-0828bffb54ee";
    const PRESSURE_UUID = "1385f9cc-f88f-4ebe-982f-0828bffb54ee";
    const GYRO_UUID = "1385f9cd-f88f-4ebe-982f-0828bffb54ee";

    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    //const [pressure, setPressure] = useState<number | null>(null); // used to display pressure *for testing only*
    const [isScanning, setIsScanning] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string>("");
    const [disconnectSub, setDisconnectSub] = useState<(() => void) | null>(null);
    const isManualDisconnect = useRef(false);

    // timer
    const [startTime, setStartTime] = useState<number | null>(null);
    const currentTimerRef = useRef("00:00:00");

    // const sessionData = useRef({
    //     cadenceSum: 0,
    //     strideSum: 0,
    //     speedSum: 0,
    //     paceSum: 0,
    //     count: 0
    // });

    // const resetSessionAccumulators = () => {
    //     sessionData.current = { cadenceSum: 0, strideSum: 0, speedSum: 0, paceSum: 0, count: 0 };
    // };
    
    // step detector instance *resets if component re-renders* (not to happen if device disconnected unexpectedly)
    // *hard-coded height for testing*
    // const heightFeet = 5;
    // const heightInches = 6;
    const locationRef = useRef<Location.LocationSubscription | null>(null);
    const stepDetectorRef = useRef<StepDetector | null>(null);
    if (!stepDetectorRef.current) {
        stepDetectorRef.current = new StepDetector();
    }
    const stepDetector = stepDetectorRef.current;
    const isNewSession = useRef(true);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (connectedDevice && startTime) {
            interval = setInterval(() => {
                const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
                const hrs = Math.floor(totalSeconds / 3600);
                const mins = Math.floor((totalSeconds % 3600) / 60);
                const secs = totalSeconds % 60;
                const formatted = [hrs, mins, secs].map(v => v < 10 ? "0" + v : v).join(":");
                
                // CRITICAL FIX: Update the Ref so handleEndSessionProcessing can see it
                currentTimerRef.current = formatted; 
                
                // Update the UI
                setTimer(formatted);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [connectedDevice, startTime]);

    // scan and connect logic (handles button press => scan, stop scanning, disconnect)

    // scan for ble device
    const scanDevices = async () => {
        console.log("=== SCAN START ===");

        // request permissions and check power state
        setError("");
        console.log("Requesting location permissions");
        const location_granted = await requestLocationPermission();

        if (!location_granted) {
            console.log("Location Permissions denied");
            setError("Location Permissions denied");
            return;
        }

        console.log("Requesting BLE permissions");
        const granted = await requestBlePermissions();
        
        if (!granted) {
            console.log("BLE permissions denied");
            setError("BLE permissions denied");
            return;
        }
        
        console.log("Permissions granted: true");

        console.log("Checking BLE state");
        const state = await manager.state();
        console.log("BLE state:", state);
        
        if (state !== "PoweredOn") {
            console.log("Bluetooth is OFF");
            setError("Bluetooth is OFF");
            return;
        }
        
        manager.stopDeviceScan();
        setIsScanning(true);

        // timeout after 15 seconds if device is not found
        const timeout = setTimeout(() => {
            console.log("TIMEOUT - Device not found");
            manager.stopDeviceScan();
            setIsScanning(false);
            setError("Device not found");
        }, 20000);

        // start scan
        console.log("Starting scan for", DEVICE_NAME);
        manager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                console.error("Scan error:", error.message);
                clearTimeout(timeout);
                manager.stopDeviceScan();
                setIsScanning(false);
                setError(error.message);
                return;
            }

            // connect to StepSmart device
            if (device && device.name === DEVICE_NAME) {
                console.log("FOUND StepSmart Nano:", device.id);
                clearTimeout(timeout);
                manager.stopDeviceScan();
                setIsScanning(false);
                setIsConnecting(true);
                setError("");
                connectToDevice(device);
            }
        });
    };
    
    // stop scan for ble device
    const stopScanning = () => {
        console.log("Stopping scan");
        manager.stopDeviceScan();
        setIsScanning(false);
    };

    // disconnect from ble device
    const disconnect = async () => {
        if (!connectedDevice) return;

        if (connectedDevice) {
            console.log("Disconnecting from device");
            try {
                isManualDisconnect.current = true;
                disconnectSub?.();
                setDisconnectSub(null);

                await handleEndSessionProcessing();
                await connectedDevice.cancelConnection();
                setConnectedDevice(null);
                setError("");

                isNewSession.current = true;
                stepDetector.reset(); // clear step count and cadence for next connection

                // setStartTime(null);
                // setTimer("00:00:00");

                if (locationRef.current) {
                    locationRef.current.remove();
                    locationRef.current = null;
                }

                console.log("Manually Disconnected");
                //await computePressureAverages(); // compute pressure averages after data collection/ (not real-time)
                //await computeSessionAverages();
            } catch (e: any) {
                console.error("Disconnect error:", e.message);
            } finally {
                isManualDisconnect.current = false;
            }
        }
    };

    const handleEndSessionProcessing = async () => {
        const pressureAvgs = await computePressureAverages();
        const metricAvgs = await computeSessionAverages();

        const sessionSummary = {
            id: Date.now().toString(),
            date: new Date().toLocaleString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration: currentTimerRef.current,
            steps: metricAvgs?.steps,
            distance: metricAvgs?.distance,
            cadence: metricAvgs?.cadence,
            pace: metricAvgs?.pace || 0,
            speed: metricAvgs?.speed || 0,
            strideLength: metricAvgs?.stride || 0,
            pressure: pressureAvgs || [0, 0, 0]
        };
        console.log("FINAL METRICS CHECK:", metricAvgs);
        await saveSessionToHistory(sessionSummary);
    }

    // button behavior (disconnect if connected, stop scan if scanning, start scan otherwise)
    const handleButtonPress = () => {
        // if (connectedDevice) {
        //     disconnect();
        // } else if (isScanning) {
        //     stopScanning();
        // } else {
        //     scanDevices();
        // }
        if (connectedDevice) {
            disconnect();
        } else if (isScanning || isConnecting) {
            return;
        } else {
            scanDevices();
        }
    };

    const decode = (base64: string) => atob(base64);

    // connect
    const connectToDevice = async (device: Device) => {
        console.log("Connecting to:", device.name, device.id);
        try {
            // connect, discover services (required before subscribing)
            const connected = await device.connect();

            console.log("Connected! Discovering services...");
            await connected.discoverAllServicesAndCharacteristics();
            console.log("Services discovered!");

            setConnectedDevice(connected);

            setStartTime(Date.now());

            const sub = manager.onDeviceDisconnected(connected.id, (error, device) => {
                if (isManualDisconnect.current) {
                    return;
                }
                console.log("Device disconnected unexpectedly");
                //computePressureAverages();
                //computeSessionAverages();
                handleEndSessionProcessing();
                setConnectedDevice(null);
                setIsScanning(false);
                setIsConnecting(false);
                setError("Device disconnected");
            });

            setDisconnectSub(() => sub.remove);

            setIsConnecting(false);
            console.log("Connected!");

            // clear files
            if (isNewSession.current) {
                await resetFile(accel_file)
                await resetFile(pressure_file);
                await resetFile(gyro_file);
                await resetFile(metrics_file);
                isNewSession.current = false;
            }
            
            // new session
            if (onConnect) {
                onConnect();
            }

            const SPEED_DEADBAND = 0.4;
            const MAX_ACCURACY = 10;
            const ALPHA = 0.2;

            let filteredSpeed = 0;

            function smoothSpeed(raw: number) {
                filteredSpeed = ALPHA * raw + (1 - ALPHA) * filteredSpeed;
                return filteredSpeed;
            }

            locationRef.current = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 2000,
                distanceInterval: 1.5,
            },
            (location) => {
                const { speed, accuracy } = location.coords;

                if (accuracy != null && accuracy > MAX_ACCURACY || speed == null) return;

                let v = speed;
                if (v < SPEED_DEADBAND) v = 0;

                v = smoothSpeed(v);
                stepDetector.setSpeed(v);
            }
            );


            // accelerometer monitoring
            connected.monitorCharacteristicForService(
                SERVICE_UUID,
                ACCEL_UUID,
                (error, characteristic) => {
                    if (error) {
                        console.error("Accelerometer monitor error:", error);
                        return;
                    }

                    if (characteristic?.value) {
                        // decode ble data into numeric values
                        const raw = atob(characteristic.value);
                        const [x, y, z] = raw.split(",").map(Number);

                        // store raw data
                        accelValues.x.push(x);
                        accelValues.y.push(y);
                        accelValues.z.push(z);

                        // compute and set averages *double check*
                        const avgX = accelValues.x.reduce((a, b) => a + b, 0) / accelValues.x.length;
                        const avgY = accelValues.y.reduce((a, b) => a + b, 0) / accelValues.y.length;
                        const avgZ = accelValues.z.reduce((a, b) => a + b, 0) / accelValues.z.length;
                        setAccelAverages({ x: avgX, y: avgY, z: avgZ });
                        //setAccelAverages({ x: x, y: y, z: z });

                        appendFile(accel_file, raw + "\n"); // store to file
                    }
                }
            );

            // pressure monitoring
            connected.monitorCharacteristicForService(
                SERVICE_UUID,
                PRESSURE_UUID,
                (error, characteristic) => {
                    if (error) {
                        console.error("Pressure monitor error:", error);
                        return;
                    }
                    if (characteristic?.value) {
                        // multiple pressure values per packet => split
                        const raw = decode(characteristic.value);
                        const parts = raw.split(",").map(p => p.trim());
                        console.log("Pressure sensors:", raw); // *for debugging*

                        //const first = parseFloat(parts[0]);
                        //const formatted = `${parts[0]}, ${parts[1]}, ${parts[2]}`;

                        if (parts.length >= 3) { // ensure there are three pressure values
                            const formatted = `${parts[0]},${parts[1]},${parts[2]}`;
                            // setPressure(parseFloat(parts[0])); // display first pressure sensor only *for testing*
                            appendFile(pressure_file, formatted + "\n"); // store to file

                            const result = stepDetector.update(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]), Date.now());
                            
                            const metricLine = `${result.cadence},${result.strideLength},${result.speed},${result.pace},${result.stepCount},${result.distance}\n`;
                            appendFile(metrics_file, metricLine);
                            
                            // live ui updates
                            setStepCount(result.stepCount);
                            setCadence(result.cadence);
                            setStrideLength(result.strideLength);
                            setSpeed(result.speed);
                            setPace(result.pace);
                            setDistance(result.distance);
                        }
                    }
                }
            );

            // gyroscope monitoring
            connected.monitorCharacteristicForService(
                SERVICE_UUID,
                GYRO_UUID,
                (error, characteristic) => {
                    if (error) {
                        console.error("Gyro monitor error:", error);
                        return;
                    }
                    if (characteristic?.value) {
                        // decode ble data into numeric values
                        const raw = atob(characteristic.value);
                        const [x, y, z] = raw.split(",").map(Number);

                        // store raw data
                        gyroValues.x.push(x);
                        gyroValues.y.push(y);
                        gyroValues.z.push(z);

                        // compute and set averages *double check*
                        const avgX = gyroValues.x.reduce((a, b) => a + b, 0) / gyroValues.x.length;
                        const avgY = gyroValues.y.reduce((a, b) => a + b, 0) / gyroValues.y.length;
                        const avgZ = gyroValues.z.reduce((a, b) => a + b, 0) / gyroValues.z.length;
                        setGyroAverages({ x: avgX, y: avgY, z: avgZ });

                        appendFile(gyro_file, raw + "\n"); // store to file
                    }
                }
            );

        } catch (e: any) {
            console.error("Connection failed:", e.message);
            setError("Connection failed: " + e.message);
            setIsConnecting(false);
        }
    };

    // compute pressure averages after disconnect
    const computePressureAverages = async () => {
        try {
            // read file, sum each sensor, compute mean
            const fileInfo = await FileSystem.getInfoAsync(pressure_file);
            if (!fileInfo.exists) return;

            const content = await FileSystem.readAsStringAsync(pressure_file);
            const lines = content.trim().split("\n");
            if (lines.length === 0) return;

            let sums = [0, 0, 0];
            let count = 0;

            lines.forEach(line => {
                // split and handle
                const vals = line.split(",").map(v => parseFloat(v.trim()));
                if (vals.length >= 3 && !vals.some(isNaN)) {
                    sums[0] += vals[0];
                    sums[1] += vals[1];
                    sums[2] += vals[2];
                    count++;
                }
            });

            if (count > 0) {
                const avg = sums.map(s => Math.round(s / count));
                console.log("Calculated Pressure Averages:", avg);
                if (setPressureAverages) setPressureAverages(avg);
                return avg;
            }
        } catch (e) {
            console.log("Error computing averages:", e);
            return null;
        }
    };

    const computeSessionAverages = async () => {
        try {
            const fileInfo = await FileSystem.getInfoAsync(metrics_file);
            if (!fileInfo.exists) return { cadence: 0, stride: 0, speed: 0, pace: 0, steps: 0, distance: 0 };

            const content = await FileSystem.readAsStringAsync(metrics_file);
            const lines = content.trim().split("\n");
            if (lines.length === 0) return { cadence: 0, stride: 0, speed: 0, pace: 0, steps: 0, distance: 0 };

            let sums = { cadence: 0, stride: 0, speed: 0, pace: 0 };
            let count = 0;

            lines.forEach(line => {
                const parts = line.split(",").map(Number);
                
                // only average data points where the user was actually moving
                // this prevents the average speed/cadence from dropping while standing still
                if (parts.length >= 4 && parts[0] >= 0) {
                    sums.cadence += parts[0];
                    sums.stride += parts[1];
                    sums.speed += parts[2];
                    sums.pace += parts[3];
                    count++;
                }
            });

            const lastLine = lines[lines.length - 1].split(",").map(Number);

            if (count > 0) {
                const totalSteps = lastLine[4] || 0;    // Index 4 is stepCount
                const totalDistance = lastLine[5] || 0; // Index 5 is distance

                const results = {
                    cadence: Math.round(sums.cadence / count),
                    stride: Number((sums.stride / count).toFixed(2)),
                    speed: Number((sums.speed / count).toFixed(2)),
                    pace: Number((sums.pace / count).toFixed(2)),
                    steps: totalSteps,
                    distance: totalDistance
                }
                // final session averages
                setCadence(Math.round(sums.cadence / count));
                setStrideLength(Number((sums.stride / count).toFixed(2)));
                setSpeed(Number((sums.speed / count).toFixed(2)));
                setPace(Number((sums.pace / count).toFixed(2)));

                return results;
            }
        } catch (e) {
            console.log("Error computing session averages:", e);
            return null;
        }
    };

    // update button text based on state
    const getButtonTitle = () => {
        if (connectedDevice) return "STOP RUN";
        //if (isConnecting) return "Connecting";
        //if (isScanning) return "Stop Scanning";
        //if (error == "Device disconnected") return "Reconnect";
        return "START RUN";
    };

    const getSubText = () => {
        if (isConnecting || isScanning) return "Connecting...";
        
        if (connectedDevice) {
            return `Connected to ${connectedDevice.name}\nPress to end session and view average stats`;
        }
        
        return "Not connected\nPress to begin new session and view live stats";
    };

    // ui render (button, messages, live pressure reading)
    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center"}}>
           <View style={{ width: 200, height: 50 }}>
                <Button
                    title={getButtonTitle()} 
                    onPress={handleButtonPress}
                    color={connectedDevice ? "#FF3B30" : "#007AFF"}
                />
            </View>
            <View style={{ height: 80, width: 260, alignItems: 'center' }}>
                {error ? (
                    <Text style={{color: 'red', marginTop: 5, fontSize: 12, fontWeight: "bold"}}>{error}</Text>
                ) : (
                    <Text style={{color: 'white', fontSize: 12, textAlign: "center"}}>{getSubText()}</Text>
                )}
            {/* {error && <Text style={{color: 'red', marginTop: 5, fontSize: 12, fontWeight: "bold"}}>{error}</Text>}
            
            {!error && (
                <Text style={{color: 'white', fontSize: 12, textAlign: "center"}}>
                {connectedDevice ? (
                    <> Connected to StepSmart {"\n"} Press to end session and view average stats {"\n"} </>
                ) : (
                    <> Not connected {"\n"} Press to begin new session and view live stats </>
                )}
            </Text>
            )} */}
            
            {/* {pressure !== null && (
                <Text style={{color: 'white', fontSize: 12, marginBottom: 5}}>
                    Pressure: {pressure}
                </Text>
            )} */}
            </View>
        </View>
    );
}
