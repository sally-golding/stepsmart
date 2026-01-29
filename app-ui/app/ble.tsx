import React, { useState } from "react";
import { Button, PermissionsAndroid, Platform, Text, View } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";
import * as FileSystem from "expo-file-system/legacy";
import { StepDetector } from "./analysis"

interface BLEButtonProps {
  setPressureAverages?: React.Dispatch<React.SetStateAction<number[] | null>>;
  setAccelAverages: (values: { x: number; y: number; z: number }) => void;
  setGyroAverages: (values: { x: number; y: number; z: number }) => void;
  setStepCount: (steps: number) => void;
  setCadence: (cadence: number) => void;
}

const accelValues: { x: number[]; y: number[]; z: number[] } = { x: [], y: [], z: [] };
const gyroValues: { x: number[]; y: number[]; z: number[] } = { x: [], y: [], z: [] };

const manager = new BleManager();

const pressure_file: string = (FileSystem as any).documentDirectory + "pressure_data.txt";
const accel_file: string = (FileSystem as any).documentDirectory + "accel_data.txt";
const gyro_file: string = (FileSystem as any).documentDirectory + "gyro_data.txt";

async function resetFile(path: string) {
    try {
        await FileSystem.writeAsStringAsync(path, "", { encoding: "utf8" });
    } catch (e) {
        console.log("File Reset Error:", e);
    }
}

async function appendFile(path: string, text: string) {
    try {
        const fileInfo = await FileSystem.getInfoAsync(path);
        let current = "";
        if (fileInfo.exists) {
        current = await FileSystem.readAsStringAsync(path);
    }

    await FileSystem.writeAsStringAsync(path, current + text, { encoding: "utf8" });

    } catch (e) {
        console.log("File Write Error:", e);
    }
}

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

    return scan === "granted" && connect === "granted";
  }

  return true;
}

export default function BLEButton({ setPressureAverages, setAccelAverages, setGyroAverages, setStepCount, setCadence }: BLEButtonProps) {
    const DEVICE_NAME = "StepSmart_Nano";
    const SERVICE_UUID = "1385f9ca-f88f-4ebe-982f-0828bffb54ee";

    const ACCEL_UUID = "1385f9cb-f88f-4ebe-982f-0828bffb54ee";
    const PRESSURE_UUID = "1385f9cc-f88f-4ebe-982f-0828bffb54ee";
    const GYRO_UUID = "1385f9cd-f88f-4ebe-982f-0828bffb54ee";

    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [pressure, setPressure] = useState<number | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string>("");
    
    // step metrics (accel)
    // const [stepCount, setStepCount] = useState(0);
    // const [cadence, setCadence] = useState(0);
    const stepDetector = StepDetector();
    //const [averages, setAverages] = useState<number[] | null>(null);

    const stopScanning = () => {
        console.log("Stopping scan");
        manager.stopDeviceScan();
        setIsScanning(false);
    };

    const disconnect = async () => {
        if (connectedDevice) {
            console.log("Disconnecting from device");
            try {
                await connectedDevice.cancelConnection();
                setConnectedDevice(null);
                setPressure(null);
                stepDetector.reset();
                console.log("Disconnected");
                computePressureAverages();
            } catch (e: any) {
                console.error("Disconnect error:", e.message);
            }
        }
    };

    const handleButtonPress = () => {
        if (connectedDevice) {
            disconnect();
        } else if (isScanning) {
            stopScanning();
        } else {
            scanDevices();
        }
    };

    const scanDevices = async () => {
        console.log("=== SCAN START ===");

        setError("");
        console.log("Requesting permissions");
        const granted = await requestBlePermissions();
        
        if (!granted) {
            console.log("Permissions denied");
            setError("Permissions denied");
            return;
        }
        
        console.log("Permissions granted: true");
        console.log("Checking BLE state");
        const state = await manager.state();
        console.log("BLE state:", state);
        
        if (state !== "PoweredOn") {
            setError("Bluetooth is OFF");
            return;
        }
        
        manager.stopDeviceScan();
        setIsScanning(true);

        const timeout = setTimeout(() => {
            console.log("TIMEOUT - Device not found");
            manager.stopDeviceScan();
            setIsScanning(false);
            setError("Device not found");
        }, 15000);

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

            if (device && device.name === DEVICE_NAME) {
                console.log("FOUND StepSmart_Nano:", device.id);
                clearTimeout(timeout);
                manager.stopDeviceScan();
                setIsScanning(false);
                setIsConnecting(true);
                setError("");
                connectToDevice(device);
            }
        });
    };

    const decode = (base64: string) => atob(base64);

    const connectToDevice = async (device: Device) => {
        console.log("Connecting to:", device.name, device.id);
        try {
            const connected = await device.connect();
            console.log("Connected! Discovering services...");
            await connected.discoverAllServicesAndCharacteristics();
            // await connected.readCharacteristicForService(SERVICE_UUID, PRESSURE_UUID);
            console.log("Services discovered!");
            setConnectedDevice(connected);
            setIsConnecting(false);
            console.log("Connected!");

            // console.log("Pressure file path:", pressure_file);
            // console.log("Accel file path:", accel_file);
            // console.log("Gyro file path:", gyro_file);

            resetFile(accel_file)
            resetFile(pressure_file);
            resetFile(gyro_file);

            // accelerometer
            connected.monitorCharacteristicForService(
                SERVICE_UUID,
                ACCEL_UUID,
                (error, characteristic) => {
                    if (error) {
                        console.error("Accelerometer monitor error:", error);
                        return;
                    }

                    if (characteristic?.value) {
                        // const raw = decode(characteristic.value);
                        // console.log("Accel:", raw);
                        const raw = atob(characteristic.value);
                        const [x, y, z] = raw.split(",").map(Number);

                        accelValues.x.push(x);
                        accelValues.y.push(y);
                        accelValues.z.push(z);
                        //console.log("Accel: ", z);

                        // STEP DETECTION //
                        const result = stepDetector.update(z, Date.now());
                        setStepCount(result.stepCount);
                        setCadence(result.cadence);

                        // //

                        const avgX = accelValues.x.reduce((a, b) => a + b, 0) / accelValues.x.length;
                        const avgY = accelValues.y.reduce((a, b) => a + b, 0) / accelValues.y.length;
                        const avgZ = accelValues.z.reduce((a, b) => a + b, 0) / accelValues.z.length;

                        setAccelAverages({ x: avgX, y: avgY, z: avgZ });

                        appendFile(accel_file, raw + "\n");
                    }
                    
                    // old pressure sensor code
                    // if (characteristic?.value) {
                    //     const raw = atob(characteristic.value);
                    //     const value = parseFloat(raw);
                    //     console.log("Pressure:", value);
                    //     setPressure(value);
                    // }
                }
            );

            // pressure sensors
            connected.monitorCharacteristicForService(
                SERVICE_UUID,
                PRESSURE_UUID,
                (error, characteristic) => {
                    if (error) {
                        console.error("Pressure monitor error:", error);
                        return;
                    }
                    if (characteristic?.value) {
                        const raw = decode(characteristic.value);
                        const parts = raw.split(",").map(p => p.trim());
                        console.log("Pressure sensors:", raw);

                        //const parts = raw.split(",");
                        const first = parseFloat(parts[0]);
                        const formatted = `${parts[0]}, ${parts[1]}, ${parts[2]}`;

                        if (parts.length >= 3) {
                            const formatted = `${parts[0]},${parts[1]},${parts[2]}`;
                
                            setPressure(parseFloat(parts[0])); 
                            appendFile(pressure_file, formatted + "\n");
                        }

                        // only show first sensor on UI
                        // setPressure(first);
                        // appendFile(pressure_file, formatted + "\n");
                    }
                }
            );

            // gyroscope
            connected.monitorCharacteristicForService(
                SERVICE_UUID,
                GYRO_UUID,
                (error, characteristic) => {
                    if (error) {
                        console.error("Gyro monitor error:", error);
                        return;
                    }
                    if (characteristic?.value) {
                        // const raw = decode(characteristic.value);
                        // console.log("Gyro:", raw);

                        const raw = atob(characteristic.value);
                        const [x, y, z] = raw.split(",").map(Number);

                        gyroValues.x.push(x);
                        gyroValues.y.push(y);
                        gyroValues.z.push(z);

                        const avgX = gyroValues.x.reduce((a, b) => a + b, 0) / gyroValues.x.length;
                        const avgY = gyroValues.y.reduce((a, b) => a + b, 0) / gyroValues.y.length;
                        const avgZ = gyroValues.z.reduce((a, b) => a + b, 0) / gyroValues.z.length;

                        setGyroAverages({ x: avgX, y: avgY, z: avgZ });

                        appendFile(gyro_file, raw + "\n");
                    }
                }
            );

        } catch (e: any) {
            console.error("Connection failed:", e.message);
            setError("Connection failed: " + e.message);
            setIsConnecting(false);
        }
    };

    const computePressureAverages = async () => {
        try {
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
                const avg = sums.map(s => s / count);
                console.log("Calculated Averages:", avg);
                if (setPressureAverages) setPressureAverages(avg);
            }
        } catch (e) {
            console.log("Error computing averages:", e);
        }
    };

    const getButtonTitle = () => {
        if (connectedDevice) return "Disconnect";
        if (isConnecting) return "Connecting";
        if (isScanning) return "Stop Scanning";
        return "Scan for StepSmart";
    };

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center"}}>
           <View style={{ width: 200, height: 50 }}>
                <Button
                    title={getButtonTitle()} 
                    onPress={handleButtonPress}
                    color={connectedDevice ? "#FF3B30" : "#007AFF"}
                />
            </View>
            <View style={{ height: 65, width: 200, alignItems: 'center' }}>
            {error && <Text style={{color: 'red', marginTop: 5, fontSize: 12}}>{error}</Text>}
            {connectedDevice && (
                <Text style={{color: 'white', fontSize: 12}}>
                    Connected to {connectedDevice.name}
                </Text>
            )}
            {pressure !== null && (
                <Text style={{color: 'white', fontSize: 12, marginBottom: 5}}>
                    Pressure: {pressure}
                </Text>
            )}
            </View>
        </View>
    );
}
