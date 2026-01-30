// step count, cadence, stride length, speed
export interface StepDetectionResult {
    stepCount: number;
    cadence: number; // steps / minute
    strideLength: number; // meters
    speed: number; // miles / hour
}

export class StepDetector {
    private stepCount = 0;
    private stepTimes: number[] = [];

    private lastZ = 0;
    private lastStepTime = 0;

    // *calibrate*
    private impactThreshold = -1.2;    // foot strike
    private releaseThreshold = -0.3;   // foot lift
    private minStepInterval = 350;     // ms

    private readyForStep = true;

    // height in meters
    private height: number;

    // pass in user height, convert to meters for calculations
    constructor(feet: number, inches: number) {
        const heightInches = feet * 12 + inches;
        this.height = heightInches + 0.0254;
    }

    // updates each time there is a new z value
    public update(z: number, timestamp: number): StepDetectionResult {
        // calculate step count

        // strike (down)
        if (this.lastStepTime === 0) {
            // first reading
            this.lastZ = z;
            this.lastStepTime = timestamp;
            return { stepCount: 0, cadence: 0 , strideLength: 0, speed: 0,};
        }

        // if insole has lifted, increment step count and log time
        if (
            this.readyForStep &&
            z < this.impactThreshold &&
            this.lastZ >= this.impactThreshold &&
            timestamp - this.lastStepTime > this.minStepInterval
        ) {
            this.stepCount++;
            this.lastStepTime = timestamp;
            this.stepTimes.push(timestamp);
            this.readyForStep = false;
        }

        // reset after foot lifts
        if (!this.readyForStep && z > this.releaseThreshold) {
            this.readyForStep = true;
        }

        this.lastZ = z;

        // calculate cadence
        this.stepTimes = this.stepTimes.filter(t => timestamp - t <= 10000);
        const cadence = this.stepTimes.length > 1 ? (this.stepTimes.length / 10) * 60 : 0;

        // calculate stride length 
        // industry standard: stride length = 0.41 * leg length, leg length = 0.53 * height
        const legLength = this.height * 0.53;

        // stride factor for running vs walking based on cadence (industry standard)
        let strideFactor: number;
        if (cadence <= 140) {
            strideFactor = 0.41;
        } else {
            strideFactor = 0.65;
        }

        const stepLength = legLength * strideFactor;
        const strideLength = stepLength * 2;

        // calculate speed
        const speed = stepLength * (cadence / 60) * 2.23694;

        return {
            stepCount: this.stepCount,
            cadence: Math.round(cadence),
            strideLength: Number(strideLength.toFixed(2)),
            speed: Number(speed.toFixed(2)),
        };
    }

    // reset values
    public reset() {
        this.stepCount = 0;
        this.stepTimes = [];
        this.lastZ = 0;
        this.lastStepTime = 0;
        this.readyForStep = true;
    }
}

