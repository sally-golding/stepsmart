// step count, cadence, stride length, speed
export interface StepDetectionResult {
    stepCount: number;
    cadence: number; // steps / minute
    strideLength: number; // meters
    speed: number; // miles / hour
}

export class StepDetector {

    private isGrounded : boolean = true;

    private stepCount = 0;
    private stepTimes: number[] = [];

    private lastStepTime = 0;
    private rawSpeed = 0;

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
        this.height = heightInches * 0.0254;
    }

    public setSpeed(gpsSpeed: number | null) {

        if(gpsSpeed !== null) {

            this.rawSpeed = gpsSpeed;

        } else {

            this.rawSpeed = 0;

        }
        

    }

    // updates each time there is a new z value
    public update(pressure_sensor1: number, pressure_sensor2: number, pressure_sensor3: number, timestamp: number): StepDetectionResult {
        
        // calculate step count

        if (pressure_sensor1 <= 400 || pressure_sensor2 <= 400 || pressure_sensor3 <= 400) {

            if(!this.isGrounded) {

                this.isGrounded = true;
                this.stepCount += 1;

                this.lastStepTime = timestamp;
                this.stepTimes.push(timestamp);
            }     

       } else if (pressure_sensor1 > 400 && pressure_sensor2 > 400 && pressure_sensor3 > 400) {

            this.isGrounded = false;

        }

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

        const stepLength = (cadence === 0) ? 0 : legLength * strideFactor;
        const strideLength = (cadence === 0) ? 0 : stepLength * 2;

        // calculate speed in MPH instead of MPS
        const speed = this.rawSpeed * 2.23694;

        return {
            stepCount: this.stepCount,
            cadence: Math.round(cadence),
            strideLength: Number(strideLength.toFixed(2)),
            speed: Number(speed.toFixed(2)),
        };
    }

    // reset values
    public reset() {

        this.isGrounded = true;
        this.rawSpeed = 0;
        this.stepCount = 0;
        this.stepTimes = [];
        this.lastStepTime = 0;
        this.readyForStep = true;

    }
}

