stepsmart

StepSmart is a wearable smart insole designed to improve the safety and performance of runners. 
The system is built with an Arduino Nano 33 BLE Rev 2 and a React Native Expo mobile application. 
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
- Insert StepSmart insole into running shoe
- Ensure Arduino Nano 33 BLE Rev 2 and battery components are securely connected
- Open StepSmart mobile application
- Begin walking or running to steam data metrics

Design Prototype Outlined Work:
- Established Arduino Nano 33 BLE Rev 2 as BLE Peripheral, sending appropriate data through the service
- Implemented Home Page of App UI
- Connected to the Arduino BLE Peripheral through the App and read transported data

Design Prototype Resolved Bugs:
- Accelerometer axes data was incorrectly changing, issue was related to calibration
- BLE Device Scan Button disappeared from App UI, fixed through debugging and proper routing in TypeScript

Pre-Alpha build Outlined Work:
- Aquired Arduino Nano 33 BLE Rev 2, prototype shoe insoles, one pressure sensor to test, connectors, rechargable lithium 5V battery
- Tested compatability of battery voltage with Arduino
- Downloaded board type to Arduino IDE
- Ensured compatable connectors
- Loaded simple accelerometer and gyro code to the arduino, tested for functionality
- Researched Arduino bluetooth
- Began app UI

Alpha Build Outlined Work:
- Implemented heatmap and stride analysis features including step count, cadence, stride length, and speed
- Designed PCB schematic and footprint
- Researched which stride and gait features to implement and how
- Designed new Arduino code to account for feedback LED functionality

Beta Build Outlined Work:
- Implemented GPS
- Integrated PCB and new battery
- Added an LED for detection of device connection for usability
- App: added side menu, account creation and login, view past runs, view user profile
- New 3-D enclosure

Current Bugs:
- Funky numbers from gyroscope values, will need to add a calibration detail to the code
- Lack of proper packet validation in current build; application assumes valid BLE data
- Automatic BLE reconnection is not supported
- Analog input pins A1 and A2 are not functional
- Heatmap and analysis features are not fully complete and require additional testing and calibration
