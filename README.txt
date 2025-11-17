stepsmart

StepSmart is a wearable smart insole designed to improve the safety and performance of runners. 
The system is built with an Arduino Nano 33 BLE Sense and a React Native Expo mobile application. 
It captures active acceleration, gyroscope, and plantar pressure data and transmits data streams via Bluetooth Low Energy (BLE) for visualization on mobile devices.

Hardware 
- Arduino Nano 33 BLE Rev2
- Force sensors
- Rechargeable Lithium 4.5V battery
- Connectors

Software 
- Arduino IDE
- React Native with Expo
- Expo Go
- Expo Development Build
- C/C++
- JavaScript/TypeScript

Usage Guide
- insert StepSmart insole into running shoe
- ensure Arduino Nano 33 BLE Sense and battery components are securely connected
- open StepSmart mobile application
- begin walking or running to steam data metrics

Design Prototype Outlined Work:
- Established Arduino Nano 33 BLE Rev 2 as BLE Peripheral, sending appropriate data through the service
- Implemented Home Page of App UI
- Connected to the Arduino BLE Peripheral through the App and read transported data

Design Prototype Resolved Bugs:
- Accelerometer axes data was incorrectly changing, issue was related to calibration
- BLE Device Scan Button disappeared from App UI, fixed through debugging and proper routing in TypeScript

Pre-Alpha build outlined work:
- aquired Arduino Nano 33 BLE Rev 2, prototype shoe insoles, one pressure sensor to test, connectors, rechargable lithium 5V battery
- tested compatability of battery voltage with Arduino
- downloaded board type to Arduino IDE
- ensured compatable connectors
- loaded simple accelerometer and gyro code to the arduino, tested for functionality
- researched Arduino bluetooth
- began app UI

Bugs:
- funky numbers from gyroscope values, will need to add a calibration detail to the code
