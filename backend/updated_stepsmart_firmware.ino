#include <ArduinoBLE.h>
#include "Arduino_BMI270_BMM150.h"

BLEService statisticsService("1385f9ca-f88f-4ebe-982f-0828bffb54ee");
BLEStringCharacteristic accelChar("1385f9cb-f88f-4ebe-982f-0828bffb54ee", BLERead | BLENotify, 30);
BLEStringCharacteristic pressureChar("1385f9cc-f88f-4ebe-982f-0828bffb54ee", BLERead | BLENotify, 30);
BLEStringCharacteristic gyroChar("1385f9cd-f88f-4ebe-982f-0828bffb54ee", BLERead | BLENotify, 30);

#define FORCE_SENSOR_PIN_1 A0
#define FORCE_SENSOR_PIN_2 A1
#define FORCE_SENSOR_PIN_3 A2
#define RED_PIN 5
#define GREEN_PIN 6
#define BLUE_PIN 9

void setup() {

  Serial.begin(9600);

  pinMode(RED_PIN,  OUTPUT);              
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);

  
  if (!IMU.begin()) {
    Serial.println("Failed to initialize IMU!");
    setRGB(255, 0, 0);
    while (1);
  }
  Serial.println("IMU initialized.");

  
  if (!BLE.begin()) {
    Serial.println("Bluetooth Low Energy Initialization Failed!");
    setRGB(255, 0, 0);
    while (1);
  }

  BLE.setLocalName("StepSmart_Nano");
  BLE.setAdvertisedService(statisticsService);

  statisticsService.addCharacteristic(accelChar);
  statisticsService.addCharacteristic(pressureChar);
  statisticsService.addCharacteristic(gyroChar);
  BLE.addService(statisticsService);

  accelChar.writeValue("Waiting for data...");
  pressureChar.writeValue("Waiting for pressure data...");
  gyroChar.writeValue("Waiting for gyroscope data...");

  BLE.advertise();
  Serial.println("BLE device active, waiting for connections...");
  setRGB(0, 255, 0);
}

void loop() {
  BLEDevice central = BLE.central();

  if (central) {
    Serial.print("Connected to central device: ");
    Serial.println(central.address());

    while (central.connected()) {
      float accelX, accelY, accelZ, gyroX, gyroY, gyroZ;

      
      if (IMU.accelerationAvailable()) {
        IMU.readAcceleration(accelX, accelY, accelZ);

        
        String accelData = String(accelX, 3) + "," + String(accelY, 3) + "," + String(accelZ, 3);

        accelChar.writeValue(accelData);
        
      }

      int firstSensor = analogRead(FORCE_SENSOR_PIN_1);
      int secondSensor = analogRead(FORCE_SENSOR_PIN_2);
      int thirdSensor = analogRead(FORCE_SENSOR_PIN_3);

      String forceData = String(firstSensor) + "," + String(secondSensor) + "," + String(thirdSensor);

      pressureChar.writeValue(forceData);

      if (IMU.gyroscopeAvailable()) {

        IMU.readGyroscope(gyroX, gyroY, gyroZ);

        String gyroData = String(gyroX, 3) + "," + String(gyroY, 3) + "," + String(gyroZ, 3);

        gyroChar.writeValue(gyroData);

      }

      delay(100);
    }

    Serial.println("Disconnected from central.");
  }
}

void setRGB(int redValue, int greenValue, int blueValue) {

  analogWrite(RED_PIN, redValue);
  analogWrite(GREEN_PIN, greenValue);
  analogWrite(BLUE_PIN, blueValue);

}