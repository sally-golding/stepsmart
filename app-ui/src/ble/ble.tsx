import * as FileSystem from "expo-file-system/legacy";
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from "react";
import { Button, Text, View } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";
import { StepDetector } from "../analysis";
import { requestBlePermissions, requestLocationPermission } from "./permissions";
import { appendFile, metrics_file, pressure_file, resetFile, saveSessionToHistory } from "./storage";
import { BLEButtonProps, DEVICE_NAME, PRESSURE_UUID, SERVICE_UUID } from "./types";

// initialize ble manager (scanning, connecting, monitoring characteristics)
const manager = new BleManager();

export default function BLEButton({ setPressureAverages, setStepCount, setCadence, setStrideLength, 
    setSpeed, setPace, setDistance, setTimer, onConnect, }: BLEButtonProps) {

    // state management
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null); // stores current ble device object
    const [isScanning, setIsScanning] = useState(false); // ui state for scanning
    const [isConnecting, setIsConnecting] = useState(false); // us state for connection progress
    const [error, setError] = useState<string>(""); // stores error messages to display to user
    const [disconnectSub, setDisconnectSub] = useState<(() => void) | null>(null); // stores cleanup function for ble listener
    const isManualDisconnect = useRef(false);
    const [isPaused, setIsPaused] = useState(false); // tracks session pause state
    const isPausedRef = useRef<boolean>(false);
    const monitoringSubscription = useRef<any>(null); // monitor subscription
    const isDisconnecting = useRef(false); // gaurd flag
    const isMounted = useRef(true); // mounted flag

    // timer and session start
    const [startTime, setStartTime] = useState<number | null>(null); // time when session started
    const [pauseStart, setPauseStart] = useState<number | null>(null); // time when pause started
    const [totalPausedTime, setTotalPausedTime] = useState(0); // time spent paused
    const currentTimerRef = useRef("00:00:00");

    // refs for gps and step detector
    const locationRef = useRef<Location.LocationSubscription | null>(null);
    const stepDetectorRef = useRef<StepDetector | null>(null);
    if (!stepDetectorRef.current) {
        stepDetectorRef.current = new StepDetector();
    }
    const stepDetector = stepDetectorRef.current;
    const isNewSession = useRef(true); // flag to ensure csv files are cleared at the start of a new run

    // mount
    useEffect(() => {
        return () => {
            console.log("BLEButton UNMOUNTED at", Date.now());
            isMounted.current = false;
        };
    }, []);

    // testing 
    const safeSetConnectedDevice = (val: any) => {
        console.log("setConnectedDevice called at", Date.now(), "mounted:", isMounted.current);
        if (!isMounted.current) {
            console.log("setConnectedDevice AFTER UNMOUNT");
        }
        setConnectedDevice(val);
    };

    // buffers for file writes
    const pressureBuffer = useRef<string[]>([]);
    const metricsBuffer = useRef<string[]>([]);
    const BUFFER_SIZE = 20;

    // timer effect
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        // run timer if device is connected, session started, and not paused
        if (connectedDevice && startTime && !isPaused) {
            interval = setInterval(() => {
                const elapsed = Date.now() - startTime - totalPausedTime; // subtract time paused
                const totalSeconds = Math.floor(elapsed / 1000);

                const hrs = Math.floor(totalSeconds / 3600);
                const mins = Math.floor((totalSeconds % 3600) / 60);
                const secs = totalSeconds % 60;

                const formatted = [hrs, mins, secs].map(v => v < 10 ? "0" + v : v).join(":");
                
                currentTimerRef.current = formatted; 
                
                setTimer(formatted);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [connectedDevice, startTime, totalPausedTime, isPaused]);

    // handle pause and resume
    const handlePause = () => {
        if (!isPaused) {
            setPauseStart(Date.now()); // mark when paused
            setIsPaused(true);
            isPausedRef.current = true;
            stepDetector.pause(); // stop calculations
            console.log("Paused");
        } else {
            const now = Date.now();
            if (pauseStart) {
                setTotalPausedTime(prev => prev + (now - pauseStart)); // add pause duration to total
            }
            setPauseStart(null);
            setIsPaused(false);
            isPausedRef.current = false;
            stepDetector.resume(Date.now()); // resume calculations

            // ensure immediate ui update on resume
            if (startTime) {
                const elapsed = now - startTime - (totalPausedTime + (pauseStart ? (now - pauseStart) : 0));
                const totalSeconds = Math.floor(elapsed / 1000);

                const hrs = Math.floor(totalSeconds / 3600);
                const mins = Math.floor((totalSeconds % 3600) / 60);
                const secs = totalSeconds % 60;

                const formatted = [hrs, mins, secs]
                    .map(v => v < 10 ? "0" + v : v)
                    .join(":");

                currentTimerRef.current = formatted;
                setTimer(formatted);
            }
        }
    }

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
        
        // ensure ble hardware (arduino) in on
        if (state !== "PoweredOn") {
            console.log("Bluetooth is OFF");
            setError("Bluetooth is OFF");
            return;
        }
        
        manager.stopDeviceScan(); // stop any existing scan
        setIsScanning(true);

        // timeout if device is not found
        const timeout = setTimeout(() => {
            console.log("TIMEOUT - Device not found");
            manager.stopDeviceScan();
            setIsScanning(false);
            setError("Device not found");
        }, 10000);

        // start scan for device (StepSmart_Nano)
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
                connectToDevice(device); // proceed to connection
            }
        });
    };
    
    // stop scan for ble device (not currently used)
    const stopScanning = () => {
        console.log("Stopping scan");
        manager.stopDeviceScan();
        setIsScanning(false);
    };

    // disconnect from ble device
    const disconnect = async () => {
        if (!connectedDevice) return;

        isDisconnecting.current = true;
        isManualDisconnect.current = true; // prevents unexpected disconnect error from showing
        console.log("Disconnecting from device");

        try {
            // console.log("Cancelling native transaction...");
            await manager.cancelTransaction("monitoring_transaction");
            
            if (monitoringSubscription.current) {
                console.log("Removing BLE listener...");
                monitoringSubscription.current = null;
                if (monitoringSubscription.current) {
                    try {
                        monitoringSubscription.current.remove();
                        console.log("BLE listener removed")
                    } catch (e) {
                        console.log("BLE listener remove failed (ignored):", e);
                    }
                }
                //monitoringSubscription.current.remove();
                //monitoringSubscription.current = null;
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            // stop gps
            if (locationRef.current) {
                try {
                    locationRef.current.remove();
                    console.log("location watcher removed");
                } catch (e) {
                    console.log("GPS remove failed (ignored):", e);
                }
                locationRef.current = null;
                // locationRef.current.remove();
                // locationRef.current = null;
                // console.log("location watcher removed");
            }

            if (disconnectSub) { // stop disconnect listener
                console.log("removing disconnect listener");
                try {
                    disconnectSub();
                } catch (e) {
                    console.log("disconnectSub remove failed (ignored):", e);
                }
                // disconnectSub(); 
                setDisconnectSub(null);
                console.log("disconnect listener removed");
            }
            // disconnectSub?.(); // stop disconnect listener
            // setDisconnectSub(null);

            // finalize first
            isPausedRef.current = true;
            let finalTotalPausedTime = totalPausedTime;
            if (isPaused && pauseStart && startTime) {
                console.log("Resuming paused session before disconnect...!");
                const now = Date.now();
                finalTotalPausedTime += (now - pauseStart);
                console.log("final total puased time calculated");
                const elapsed = now - startTime - finalTotalPausedTime;
                const totalSeconds = Math.floor(elapsed / 1000);
                const hrs = Math.floor(totalSeconds / 3600);
                const mins = Math.floor((totalSeconds % 3600) / 60);
                const secs = totalSeconds % 60;
                currentTimerRef.current = [hrs, mins, secs].map(v => v < 10 ? "0" + v : v).join(":");
                console.log("adjusting timer finished!!");
            }

            // try {
            //     console.log("Cancelling BLE connection (fire-and-forget)");

            //     await connectedDevice?.cancelConnection?.().catch(e => {
            //         console.log("BLE cancelConnection error (ignored):", e);
            //     });
            // } catch (e) {
            //     console.log("BLE cancelConnection crashed (ignored):", e);
            // }

            await connectedDevice?.cancelConnection?.()

            await new Promise(resolve => setTimeout(resolve, 500));

            await handleEndSessionProcessing(); // compute pressure and metrics post session
            console.log("end session processing finished");
          
            // reset states
            safeSetConnectedDevice(null);
            setError("");

            isNewSession.current = true;
            stepDetector.reset(); // clear step count and cadence for next connection              
                
            setIsPaused(false);
            setPauseStart(null);
            setStartTime(null);
            setTotalPausedTime(0);

            console.log("state reset complete safely");

            console.log("Disconnected");
        } catch (e: any) {
            console.error("Disconnect error:", e.message);
        } finally {
            isManualDisconnect.current = false;
            isDisconnecting.current = false;
            console.log("disconnect() EXIT");
        }
    };

    // post session processing
    const handleEndSessionProcessing = async () => {
        console.log("handleEndSessionProcessing() ENTER", Date.now());

        // clear leftover data to files
        if (pressureBuffer.current.length > 0) {
            await appendFile(pressure_file, pressureBuffer.current.join("\n") + "\n");
            pressureBuffer.current = [];
        }
        if (metricsBuffer.current.length > 0) {
            await appendFile(metrics_file, metricsBuffer.current.join("\n") + "\n");
            metricsBuffer.current = [];
        }
        try {
            // calculation averages from file
            //const pressureAvgs = await computePressureAverages();
            const pressureAvgs = await computePressureAverages().catch(e => [0,0,0]);
            console.log("Pressure step done");
            //const metricAvgs = await computeSessionAverages();
            const metricAvgs = await computeSessionAverages().catch(e => null);
            console.log("Metrics step done");

            // final summary object
            const sessionSummary = {
                id: Date.now().toString(),
                date: new Date().toLocaleString(),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                duration: currentTimerRef.current || "00:00:00",
                steps: metricAvgs?.steps || 0,
                distance: metricAvgs?.distance || 0,
                cadence: metricAvgs?.cadence || 0,
                pace: metricAvgs?.pace || 0,
                speed: metricAvgs?.speed || 0,
                strideLength: metricAvgs?.stride || 0,
                pressure: pressureAvgs || [1023, 1023, 1023]
            };
            console.log("FINAL METRICS:", metricAvgs);
            await saveSessionToHistory(sessionSummary); // save to async storage/database
            if (connectedDevice) {

            }
            console.log("handleEndSessionProcessing() EXIT", Date.now());
        } catch (error) {
            console.error("handleEndSessionProcessing() Error:", error);
        }
    }

    // button behavior (pause if active, ignore if busy, start if disconnected)
    const handleButtonPress = () => {
        if (connectedDevice) {
            handlePause();
        } else if (isScanning || isConnecting || isDisconnecting.current) {
            return;
        } else {
            scanDevices();
        }
    };

    // helper to convert ble base65 packets to ascii
    const decode = (base64: string) => atob(base64);

    // connect
    const connectToDevice = async (device: Device) => {
        console.log("Connecting to:", device.name, device.id);
        try {
            // connect, discover services (required before subscribing)
            const connected = await device.connect(); // establish link

            console.log("Connected! Discovering services...");
            await connected.discoverAllServicesAndCharacteristics(); // map device capabilities
            console.log("Services discovered!");

            setTotalPausedTime(0);
            setPauseStart(null);
            setIsPaused(false);
            isPausedRef.current = false;

            setConnectedDevice(connected);

            setStartTime(Date.now());

            // handle hardware-side disconnect (out of range or battery died)
            const sub = manager.onDeviceDisconnected(connected.id, (error, device) => {
                if (isManualDisconnect.current) {
                    return;
                }
                console.log("Device disconnected unexpectedly");
                handleEndSessionProcessing(); // compute pressure and metrics
                setConnectedDevice(null);
                setIsScanning(false);
                setIsConnecting(false);
                isPausedRef.current = true;
                setError("Device disconnected");
            });

            setDisconnectSub(() => sub.remove());

            setIsConnecting(false);
            console.log("Connected!");

            // clear files
            if (isNewSession.current) {
                await resetFile(pressure_file);
                await resetFile(metrics_file);
                isNewSession.current = false;
            }
            
            // new session
            if (onConnect) {
                onConnect();
            }

            // gps filtering logic
            const SPEED_DEADBAND = 0.4; // filter out jitter wile standing still
            const MAX_ACCURACY = 10; // ignore gps data with >10m error margin
            const ALPHA = 0.2; // low-pass filter constant

            let filteredSpeed = 0;

            function smoothSpeed(raw: number) {
                filteredSpeed = ALPHA * raw + (1 - ALPHA) * filteredSpeed;
                return filteredSpeed;
            }

            // start background location watcher
            locationRef.current = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 2000,
                distanceInterval: 1.5,
            },
            (location) => {
                if (isPausedRef.current || isDisconnecting.current) return;
                const { speed, accuracy } = location.coords;

                if (accuracy != null && accuracy > MAX_ACCURACY || speed == null) return;

                let v = speed;
                if (v < SPEED_DEADBAND) v = 0;

                v = smoothSpeed(v);
                stepDetector.setSpeed(v);
            }
            );

            // ble characterisitc monitoring (pressure)
            monitoringSubscription.current = connected.monitorCharacteristicForService(
                SERVICE_UUID,
                PRESSURE_UUID,
                (error, characteristic) => {
                    if (isPausedRef.current || isDisconnecting.current || !isMounted.current) return;

                    if (error) {
                        console.error("Pressure monitor error:", error);
                        return;
                    }
                    if (characteristic?.value) {
                        if (isPausedRef.current || isDisconnecting.current) return;
                        // multiple pressure values per packet => split
                        const raw = decode(characteristic.value);
                        const parts = raw.split(",").map(p => p.trim());
                        //console.log("Pressure sensors:", raw); // *for debugging*

                        // expecting comma-separated values from sensor as defined by arduino code
                        if (parts.length >= 3) { // ensure there are three pressure values
                            const formatted = `${parts[0]},${parts[1]},${parts[2]}`;
                            pressureBuffer.current.push(formatted);
                            //appendFile(pressure_file, formatted + "\n"); // store raw to file

                            // run analysis
                            const result = stepDetector.update(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]), Date.now());
                            
                            // log metrics
                            const metricLine = `${result.cadence},${result.strideLength},${result.speed},${result.pace},${result.stepCount},${result.distance}`;
                            //appendFile(metrics_file, metricLine);
                            metricsBuffer.current.push(metricLine);

                            if (pressureBuffer.current.length >= BUFFER_SIZE) {
                                const dataToWrite = pressureBuffer.current.join("\n") + "\n";
                                pressureBuffer.current = [];
                                appendFile(pressure_file, dataToWrite); 
                            }

                            if (metricsBuffer.current.length >= BUFFER_SIZE) {
                                const dataToWrite = metricsBuffer.current.join("\n") + "\n";
                                metricsBuffer.current = [];
                                appendFile(metrics_file, dataToWrite);
                            }
                            
                            // live ui updates
                            setStepCount(result.stepCount);
                            setCadence(result.cadence);
                            setStrideLength(result.strideLength);
                            // safeSetStepCount(result.stepCount);
                            // safeSetCadence(result.cadence);
                            // safeSetStrideLength(result.strideLength);
                            setSpeed(result.speed);
                            setPace(result.pace);
                            setDistance(result.distance);
                        }
                    }
                },
                "monitoring_transaction"
            );

        } catch (e: any) {
            console.error("Connection failed:", e.message);
            setError("Connection failed: " + e.message);
            setIsConnecting(false);
        }
    };

    // compute pressure averages post session
    const computePressureAverages = async () => {
        try {
            console.log("reading pressure file...")
            // read file, sum each sensor, compute mean
            const fileInfo = await FileSystem.getInfoAsync(pressure_file);
            if (!fileInfo.exists) return;
            console.log("file exists");

            const content = await FileSystem.readAsStringAsync(pressure_file);
            const lines = content.trim().split("\n");
            if (lines.length === 0) return;

            let sums = [0, 0, 0];
            let counts = [0, 0, 0];

            lines.forEach(line => {
                // split and handle
                const vals = line.split(",").map(v => parseFloat(v.trim()));
                if (vals.length >= 3 && !vals.some(isNaN)) {
                    vals.forEach((v, i) => {
                        if (v < 1023) { // do not account the 1023 values (no pressure)
                            sums[i] += v;
                            counts[i]++;
                        } 
                    });
                }
            });

            // calculate mean for each sensor
            const avg = sums.map((s, i) => (counts[i] > 0 ? Math.round(s / counts[i]) : 1023));

            console.log("Calculated Pressure Averages:", avg);
            if (setPressureAverages) setPressureAverages(avg);
            return avg;

        } catch (e) {
            console.log("Error computing averages:", e);
            return null;
        }
    };

    // compute metrics post session
    const computeSessionAverages = async () => {
        try {
            console.log("Reading metrics file...");

            const fileInfo = await FileSystem.getInfoAsync(metrics_file);
            if (!fileInfo.exists) {
                console.log("Metrics file not found - returning defaults");
                return { cadence: 0, stride: 0, speed: 0, pace: 0, steps: 0, distance: 0 };
            }
            console.log("file exists");
            //if (!fileInfo.exists) return { cadence: 0, stride: 0, speed: 0, pace: 0, steps: 0, distance: 0 };
            //console.log("reached 2");

            const content = await FileSystem.readAsStringAsync(metrics_file);
            console.log("completed read");

            if (!content || content.trim() === "") {
                return { cadence: 0, stride: 0, speed: 0, pace: 0, steps: 0, distance: 0 };
            }
            console.log("reached 2")

            const lines = content.trim().split("\n");
            const dataLines = lines.slice(1);
            //if (lines.length === 0) return { cadence: 0, stride: 0, speed: 0, pace: 0, steps: 0, distance: 0 };
            console.log("reached 3");

            let sums = { cadence: 0, stride: 0, speed: 0, pace: 0 };
            let count = 0;
            let totalSteps = 0;
            let totalDistance = 0;

            for (const line of dataLines) {
                const parts = line.split(",").map(Number);
                
                // only average data points where the user was actually moving
                // this prevents the average speed/cadence from dropping while standing still
                if (parts.length >= 4 && !parts.slice(0, 4).some(isNaN)) {
                    sums.cadence += parts[0];
                    sums.stride += parts[1];
                    sums.speed += parts[2];
                    sums.pace += parts[3];
                    count++;
                }

                if (parts.length >= 6) {
                    if (!isNaN(parts[4])) totalSteps = parts[4];
                    if (!isNaN(parts[5])) totalDistance = parts[5];
                }
            };

            if (count === 0) {
                return { cadence: 0, stride: 0, speed: 0, pace: 0, steps: totalSteps, distance: totalDistance };
            }

            const lastLine = lines[lines.length - 1].split(",").map(Number);
            
            // const totalSteps = lastLine[4] || 0;    // index 4 is stepCount
            // const totalDistance = lastLine[5] || 0; // index 5 is distance

            const results = {
                cadence: Math.round(sums.cadence / count),
                stride: Number((sums.stride / count).toFixed(2)),
                speed: Number((sums.speed / count).toFixed(2)),
                pace: Number((sums.pace / count).toFixed(2)),
                steps: totalSteps,
                distance: totalDistance
            }
            // final session averages
            // setCadence(results.cadence);
            // setStrideLength(results.stride);
            // setSpeed(results.stride);
            // setPace(results.speed);
            console.log("reached results");
            return results;
            
        } catch (e) {
            console.log("Error computing session averages:", e);
            return null;
        }
    };

    // ui helpers
    // update button text based on state
    const getButtonTitle = () => {
        if (!connectedDevice) return "START RUN";
        return isPaused ? "RESUME" : "PAUSE";
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
           <View style={{ height: 35, width: 200 }}>
                <Button
                    title={getButtonTitle()} 
                    onPress={handleButtonPress}
                    color={"#007AFF"}
                />
            </View>
            <View style={{ height: 30, width: 260, alignItems: 'center', marginTop: 10 }}>
                {error ? (
                    <Text style={{color: 'red', marginTop: 5, fontSize: 12, fontWeight: "bold"}}>{error}</Text>
                ) : (
                    <Text style={{color: 'white', fontSize: 12, textAlign: "center"}}>{getSubText()}</Text>
                )}
            </View>
            <View style={{ height: 35, width: 200, marginTop: 12 }}>
                {connectedDevice && isPaused &&  (
                    <Button
                        title="STOP RUN"
                        onPress={async () => {
                            console.log("STOP RUN PRESSED")
                            try {
                                await disconnect();
                                console.log("disconnect() FINISHED");
                            } catch (e) {
                                console.error("Fatal disconnect crash: ", e);
                            }
                            console.log("STOP RUN HANDLER DONE")
                        }}
                        color="#FF9500"
                    />
                )}
            </View>
        </View>
    );
}
