import * as Location from 'expo-location';
import { PermissionsAndroid, Platform } from "react-native";

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