export interface StepDetectionResult {
    stepCount: number;
    cadence: number; // steps per minute
}

export function StepDetector (
    impactThreshold = -1.2,   // below => foot strike
    releaseThreshold = -0.3,  // above => foot lift
    minStepInterval = 350,   // avoid false steps (needs calibrating)
) {
    let stepCount = 0;
    let stepTimes: number[] = []; // timestamps

    // previous values (z and time)
    let lastZ = 0;
    let lastStepTime = 0;

    let readyForStep = true;

    function update(z: number, timestamp: number): StepDetectionResult {
        // detect strike (down)
        if (readyForStep && z < impactThreshold && lastZ >= impactThreshold && timestamp - lastStepTime > minStepInterval) {
            stepCount++;
            lastStepTime = timestamp;
            stepTimes.push(timestamp);
            readyForStep = false;
        }

        // reset after foot lifts
        if (readyForStep && z > releaseThreshold) {
            readyForStep = true;
        }

        lastZ = z;

        // needs calibrating
        stepTimes = stepTimes.filter(t => timestamp - t <= 10000);

        const cadence = stepTimes.length > 1 ? (stepTimes.length / 10) * 60 : 0;

        return {
            stepCount: stepCount,
            cadence: Math.round(cadence),
        };
    }

    function reset() {
        stepCount = 0;
        stepTimes = [];
        lastZ = 0;
        lastStepTime = 0;
        readyForStep = true;
    }

    return { update, reset };
}

