import React from "react";

export interface BLEButtonProps {
    setPressureAverages?: React.Dispatch<React.SetStateAction<number[] | null>>; // array  for iteration (heatmap)
    setStepCount: (steps: number) => void;
    setCadence: (cadence: number) => void;
    setStrideLength: (stride : number) => void;
    setSpeed: (speed: number) => void;
    setPace: (pace: number) => void;
    setDistance: (pace: number) => void;
    setTimer: (time: string) => void;
    onConnect?: () => void; // only render heatmap post session, do not maintain previous heatmap during a new session
}

 // device and uuids
export const DEVICE_NAME = "StepSmart_Nano";
export const SERVICE_UUID = "1385f9ca-f88f-4ebe-982f-0828bffb54ee";
export const ACCEL_UUID = "1385f9cb-f88f-4ebe-982f-0828bffb54ee";
export const PRESSURE_UUID = "1385f9cc-f88f-4ebe-982f-0828bffb54ee";
export const GYRO_UUID = "1385f9cd-f88f-4ebe-982f-0828bffb54ee";