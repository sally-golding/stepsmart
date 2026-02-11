// step count, cadence, stride length, speed
export interface StepDetectionResult {
    stepCount: number;
    cadence: number; // steps / minute
    strideLength: number; // meters
    speed: number; // miles / hour
    pace: number; // minute / mile
}

export class StepDetector {

    private isGrounded : boolean = true;

    private stepCount = 0;
    private stepTimes: number[] = [];

    private lastStepTime = 0;
    private rawSpeed = 0;
    private pace = 0;

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
        let cadence = 0;
        if (this.stepTimes.length > 1) {
            const firstStep = this.stepTimes[0];
            const lastStep = this.stepTimes[this.stepTimes.length - 1];
            
            // Calculate actual time span in seconds (e.g., 4.2 seconds)
            const timeSpanSeconds = (lastStep - firstStep) / 1000;

            if (timeSpanSeconds > 0) {
                // (Steps / Time) * 60 = Steps Per Minute
                // Use length - 1 because we are measuring intervals BETWEEN steps
                cadence = ((this.stepTimes.length - 1) / timeSpanSeconds) * 60;
            }
        }
        
        //const cadence = this.stepTimes.length > 1 ? (this.stepTimes.length / 10) * 60 : 0;

        // // calculate stride length 
        // // industry standard: stride length = 0.41 * leg length, leg length = 0.53 * height
        // const legLength = this.height * 0.53;

        // // stride factor for running vs walking based on cadence (industry standard)
        // let strideFactor: number;
        // if (cadence <= 140) {
        //     strideFactor = 0.41;
        // } else {
        //     strideFactor = 0.65;
        // }

        // const stepLength = (cadence === 0) ? 0 : legLength * strideFactor;
        // const strideLength = (cadence === 0) ? 0 : stepLength * 2;

        let strideLength = 0;
        if (cadence > 0) {
            const stepsPerSecond = cadence / 60;
            const stepLengthInMeters = this.rawSpeed / stepsPerSecond;
            strideLength = stepLengthInMeters * 2;
        }

        // calculate speed in MPH instead of MPS
        const speed = this.rawSpeed * 2.23694;

        let pace = 0;
        if (speed > 0.1) {
            pace = 60 / speed;
        }

        return {
            stepCount: this.stepCount,
            cadence: Math.round(cadence),
            strideLength: Number(strideLength.toFixed(2)),
            speed: Number(speed.toFixed(2)),
            pace: Number(pace.toFixed(2)),
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
        this.pace = 0;
    }
}

