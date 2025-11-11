#include <CRC.h>
#include "Arduino_BMI270_BMM150.h"

#define sensor_pin A0

void setup(){
  Serial.begin(9600);
  while (!Serial);
}

void loop(){
  // read sensor voltage
  int sensor = analogRead(sensor_pin); 
  Serial.print("sensor volatge: ");
  Serial.print(sensor);

  uint8_t data[sizeof(sensor)];
  memcpy(data,&sensor,sizeof(sensor));
  
  // 16-bit crc implementation
  uint16_t checksum = crc16(data,sizeof(data));
  Serial.print(" CRC16: 0x");
  char hex_data[5];
  sprintf(hex_data,"%04X",checksum);
  Serial.println(hex_data);


  delay(100);
}
