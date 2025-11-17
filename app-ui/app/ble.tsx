import React, { useState } from "react";
import { Button, PermissionsAndroid, Platform, Text, View } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";

const manager = new BleManager();

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

export default function BLEButton() {
    const DEVICE_NAME = "StepSmart_Nano";
    const SERVICE_UUID = "1385f9ca-f88f-4ebe-982f-0828bffb54ee";
    const CHARACTERISTIC_UUID = "1385f9cc-f88f-4ebe-982f-0828bffb54ee";

    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [pressure, setPressure] = useState<number | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string>("");

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
                console.log("Disconnected");
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

    const connectToDevice = async (device: Device) => {
        console.log("Connecting to:", device.name, device.id);
        try {
            const connected = await device.connect();
            await connected.discoverAllServicesAndCharacteristics();
            setConnectedDevice(connected);
            setIsConnecting(false);
            console.log("Connected!");

            connected.monitorCharacteristicForService(
                SERVICE_UUID,
                CHARACTERISTIC_UUID,
                (error, characteristic) => {
                    if (error) {
                        console.error("Monitor error:", error);
                        return;
                    }
                    
                    if (characteristic?.value) {
                        const raw = atob(characteristic.value);
                        const value = parseFloat(raw);
                        console.log("Pressure:", value);
                        setPressure(value);
                    }
                }
            );
        } catch (e: any) {
            console.error("Connection failed:", e.message);
            setError("Connection failed: " + e.message);
            setIsConnecting(false);
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
            {error && <Text style={{color: 'red', marginTop: 5, fontSize: 10}}>{error}</Text>}
            {connectedDevice && (
                <Text style={{color: 'white', fontSize: 10}}>
                    Connected to {connectedDevice.name}
                </Text>
            )}
            {pressure !== null && (
                <Text style={{color: 'white', fontSize: 10, marginBottom: 5}}>
                    Pressure: {pressure}
                </Text>
            )}
            </View>
        </View>
    );
}
