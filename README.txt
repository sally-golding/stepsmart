stepsmart

StepSmart is a wearable smart insole designed to improve the safety and performance of runners. 
The system is built with an Arduino Nano 33 BLE Rev 2 and a React Native Expo mobile application. 
It captures active plantar pressure data and transmits data streams via Bluetooth Low Energy (BLE), coupled with GPS data, for visualization on mobile devices.

Hardware 
- Arduino Nano 33 BLE Rev2 Microcontroller
- Three Resistive-Based Force Pressure Sensors
- Rechargeable 4.8 V NiMH battery
- Custom PCB
- Status Indicator LED
- 3D-Printed Enclosure (Houses PCB, Microcontroller, Battery, LED)

Software 
- Arduino IDE
- React Native with Expo
- Expo Go
- Expo Release Build
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

Release Candidate Outlined Work:
- Defined weight limits and calibrated heat map
- Added TCU wrapping to waterproof the system
- Conducted additional testing with different weights and longer run times
- Implemented pause functionality
- Refactored code and expanded documentation
- Made app standalone

Production Release Outlined Work:
- Re-designed 3D-Printed Enclosure (More Compact, Rounded-Edges for Safety)
- Refitted the insole with Liquid Electrical Tape for Waterproofing
- Reworked File System Storage to be hierarchy based per user
- Finalized Code Refactoring and Improved BLE Connection Stability
- Fixed Bugs Introduced by Making App Standalone
- Performed Additional Stress Testing

Current Bugs and Limitations:
- Pressure data is limited to three sensor points
- Pressure averages are calculated after disconnecting from device, preventing the user from viewing real-time pressure updates
- Mobile application is supported on Android devices only
- Users who exceed 210 lbs. in weight may experienced reduced accuracy in the calculated metrics (Physical Weight Limitation of the Sensors)
- GPS data becomes inaccurate and volatile indoors (Inherent limitation of GPS technology) and with poor internet connection

Suggested Future Improvements:
- Implement a dedicated GPS module (This will eliminate the need for a good internet connection, but the indoor inaccuracy will still be present)
- Implement additional sensors (with absolute positioning) to fallback on for distance calculations during indoor conditions
- Replace foam insole design with a more malleable surface
- Refine provided feedback and metrics to be more actionable and personally applicable to each user by studying the patterns in their data (AI-learning could be beneficial)
