import React, { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";
import { BleError, BleManager, Characteristic, Device } from "react-native-ble-plx";

const manager = new BleManager();

export default function BLEScreen() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [pressure, setPressure] = useState<number | null>(null);

    const SERVICE_UUID = "1385f9ca-f88f-4ebe-982f-0828bffb54ee";       // Replace with your Arduino's service UUID
    const CHARACTERISTIC_UUID = "1385f9cc-f88f-4ebe-982f-0828bffb54ee"; // Replace with your Arduino's characteristic UUID

    useEffect(() => {
        const subscription = manager.onStateChange((state) => {
            if (state === "PoweredOn") {
                scanDevices();
            }
        }, true);
        return () => subscription.remove();
    }, []);

    const scanDevices = () => {
        manager.startDeviceScan(null, null, (error: BleError | null, device: Device | null) => {
            if (error) {
                console.error(error);
                return;
            }

            if (device?.name?.includes("Arduino")) {
                console.log("Found Arduino:", device.name);
                manager.stopDeviceScan();
                connectToDevice(device);
            }
        });
    };

    const connectToDevice = async (device: any) => {
        console.log("Connecting to device:", device.name);
        try {
            const connected = await device.connect();
            await connected.discoverAllServicesAndCharacteristics();
            setConnectedDevice(connected);

            connected.monitorCharacteristicForService(
                SERVICE_UUID,
                CHARACTERISTIC_UUID,
                (error: BleError | null, characteristic: Characteristic | null) => {
                    if (error) {
                        console.error("Monitor error:", error);
                        return;
                    }

                    if (characteristic?.value) {
                        const raw = Buffer.from(characteristic.value, "base64").toString("utf-8");
                        const value = parseFloat(raw);
                        console.log("Received pressure:", value);
                        setPressure(value);
                     }
                 }
            );
        } catch (e) {
            console.error("Connection failed:", e);
        }
    };

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text>BLE Pressure Sensor</Text>
            <Button title="Scan for Arduino" onPress={scanDevices} />
            {connectedDevice && <Text>Connected to {connectedDevice.name}</Text>}
            {pressure !== null && <Text>Pressure: {pressure}</Text>}
        </View>
    );
}
