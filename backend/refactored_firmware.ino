#include <ArduinoBLE.h>

BLEService statisticsService("1385f9ca-f88f-4ebe-982f-0828bffb54ee");
BLEStringCharacteristic pressureChar("1385f9cc-f88f-4ebe-982f-0828bffb54ee", BLERead | BLENotify, 30);

#define FORCE_SENSOR_PIN_1 A0
#define FORCE_SENSOR_PIN_2 A3
#define FORCE_SENSOR_PIN_3 A4
#define RED_PIN 2
#define GREEN_PIN 3
#define BLUE_PIN 4

const unsigned long sampleInterval = 10;
const int transmitDivider = 5; 

void setup() {

  Serial.begin(9600);

  pinMode(RED_PIN,  OUTPUT);              
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);

  
  if (!BLE.begin()) {
    Serial.println("Bluetooth Low Energy Initialization Failed!");
    setRGB(255, 0, 0);
    while (1);
  }

  BLE.setLocalName("StepSmart_Nano");
  BLE.setAdvertisedService(statisticsService);

  statisticsService.addCharacteristic(pressureChar);
  BLE.addService(statisticsService);

  pressureChar.writeValue("Waiting for pressure data...");

  BLE.advertise();
  Serial.println("BLE device active, waiting for connections...");
  setRGB(0, 0, 255);
}

void loop() {

  BLEDevice central = BLE.central();

  if (central) {
    Serial.print("Connected to: ");
    Serial.println(central.address());
    setRGB(0, 255, 0);

    unsigned long lastSampleTime = 0;
    int sampleCount = 0;

    while (central.connected()) {

      BLE.poll();

      unsigned long currentTime = millis();

      if (currentTime - lastSampleTime >= sampleInterval) {

        lastSampleTime = currentTime;

        int s1 = analogRead(FORCE_SENSOR_PIN_1);
        int s2 = analogRead(FORCE_SENSOR_PIN_2);
        int s3 = analogRead(FORCE_SENSOR_PIN_3);

        sampleCount++;

        if (sampleCount >= transmitDivider) {
          sampleCount = 0;

          char buffer[32];
          snprintf(buffer, sizeof(buffer), "%d,%d,%d", s1, s2, s3);

          pressureChar.writeValue(buffer);

        }
      }
    }

    Serial.println("Disconnected from central device.");
    setRGB(0, 0, 255);

  }
}

void setRGB(int redValue, int greenValue, int blueValue) {

  analogWrite(RED_PIN, redValue);
  analogWrite(GREEN_PIN, greenValue);
  analogWrite(BLUE_PIN, blueValue);

}
