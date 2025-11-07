#include <ArduinoBLE.h>
#include "Arduino_BMI270_BMM150.h"

BLEService statisticsService("1385f9ca-f88f-4ebe-982f-0828bffb54ee");
BLEStringCharacteristic accelChar("1385f9cb-f88f-4ebe-982f-0828bffb54ee", BLERead | BLENotify, 30);
BLEStringCharacteristic pressureChar("1385f9cc-f88f-4ebe-982f-0828bffb54ee", BLERead | BLENotify, 30);

#define FORCE_SENSOR_PIN A0

void setup() {

  Serial.begin(9600);

  
  if (!IMU.begin()) {
    Serial.println("Failed to initialize IMU!");
    while (1);
  }
  Serial.println("IMU initialized.");

  
  if (!BLE.begin()) {
    Serial.println("Bluetooth Low Energy Initialization Failed!");
    while (1);
  }

  BLE.setLocalName("StepSmart_Nano");
  BLE.setAdvertisedService(statisticsService);

  statisticsService.addCharacteristic(accelChar);
  statisticsService.addCharacteristic(pressureChar);
  BLE.addService(statisticsService);

  accelChar.writeValue("Waiting for data...");
  pressureChar.writeValue("Waiting for pressure data...");

  BLE.advertise();
  Serial.println("BLE device active, waiting for connections...");
}

void loop() {
  BLEDevice central = BLE.central();

  if (central) {
    Serial.print("Connected to central device: ");
    Serial.println(central.address());

    while (central.connected()) {
      float x, y, z;

      
      if (IMU.accelerationAvailable()) {
        IMU.readAcceleration(x, y, z);

        
        String data = "X: " + String(x, 3) + ", Y: " + String(y, 3) + ", Z: " + String(z, 3);

        accelChar.writeValue(data);
        
      }

      int analogReading = analogRead(FORCE_SENSOR_PIN);

      String dataString = "";

      if (analogReading < 20)       
        dataString = "No Pressure";
      else if (analogReading < 400) 
        dataString = "Light Pressure";
      else if (analogReading < 600) 
        dataString = "Medium Pressure";
      else if (analogReading < 800) 
        dataString = "A Lot of Pressure";

      pressureChar.writeValue(dataString);

      delay(100);
    }

    Serial.println("Disconnected from central.");
  }
}