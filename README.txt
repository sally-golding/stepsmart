stepsmart

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
