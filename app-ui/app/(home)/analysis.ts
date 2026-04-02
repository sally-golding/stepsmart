// interface defining structure of data returned
export interface StepDetectionResult {
    stepCount: number;
    cadence: number; // steps / minute
    strideLength: number; // meters
    speed: number; // miles / hour
    pace: number; // minute / mile
    distance: number,
}

export class StepDetector {

    private isGrounded : boolean = true; // tracks if foot is currently touching the sensor (ground)

    private stepCount = 0; // total of steps detected
    private stepTimes: number[] = []; // array of timestamps to calculate cadence

    private lastStepTime = 0; // timestamp of last detected step
    private rawSpeed = 0; // gps in m/s
    private pace = 0; // calculated min/mile
    private distanceMeters = 0; // total distance in meters
    private lastTimestamp = 0; // used to calculated time difference between data

    private paused = false; // prevents processing during session pause

    // stores results of last calculation for quick retrieval
    private lastResult = {
        stepCount: 0,
        cadence: 0,
        strideLength: 0,
        speed: 0,
        pace: 0,
        distance: 0
    }

    // session control
    public resume(currentTime: number) {
        this.paused = false;
        this.lastTimestamp = currentTime; // reset timestamp to prevent distance jumps on resume
    }

    public pause() {
        this.paused = true;
    }

    public getLatestMetrics() : StepDetectionResult {
        return this.lastResult;
    }

    // updates internal speed variable
    public setSpeed(gpsSpeed: number | null) {
        if(gpsSpeed !== null) {
            this.rawSpeed = gpsSpeed;
        } else {
            this.rawSpeed = 0;
        }
    }

    // core logic
    // updates each time there is a new z value
    public update(pressure_sensor1: number, pressure_sensor2: number, pressure_sensor3: number, timestamp: number): StepDetectionResult {
       
        if (this.paused) {
            return this.lastResult;
        }

        // calculate step count
        // if any sensor value drops to/below 600, it indicates a foot strike
        if (pressure_sensor1 <= 600 || pressure_sensor2 <= 600 || pressure_sensor3 <= 600) {
            // trigger a step if not grounded and enough time has passed
            if(!this.isGrounded && (timestamp - this.lastStepTime > 700)) {
                this.isGrounded = true;
                this.stepCount += 2; // increment by two to account for both feet

                this.lastStepTime = timestamp;
                this.stepTimes.push(timestamp); // log time of step for cadence
                console.log("++++++++++++++++++++++++++++++");
            }     

       }
       // reset grounding state
       if (pressure_sensor1 > 600 && pressure_sensor2 > 600 && pressure_sensor3 > 600) {
            this.isGrounded = false;
        }

        // calculate cadence
        // keep only steps from last 10 seconds
        this.stepTimes = this.stepTimes.filter(t => timestamp - t <= 10000);
        let cadence = 0;
        if (this.stepTimes.length > 1) {
            const firstStep = this.stepTimes[0];
            const lastStep = this.stepTimes[this.stepTimes.length - 1];
            
            // calculate actual time span in seconds
            const timeSpanSeconds = (lastStep - firstStep) / 1000;

            if (timeSpanSeconds > 0) {
                // (steps / time) * 60 = steps per minute
                // use length - 1 because we are measuring intervals between steps
                cadence = ((this.stepTimes.length - 1) / timeSpanSeconds) * 60;
            }
        }

        // calculate stride length
        let strideLength = 0;
        if (cadence > 0) {
            const stepsPerSecond = cadence / 60;
            // speed (m/s) / steps per second = step length
            // stride length is two steps
            const stepLengthInMeters = this.rawSpeed / stepsPerSecond;
            strideLength = stepLengthInMeters * 2;
        }

        // calculate speed in MPH instead of MPS
        const speed = this.rawSpeed * 2.23694;
        let pace = 0;
        if (speed > 0.1) {
            pace = 60 / speed;
        }

        // calculate distance
        if (this.lastTimestamp !== 0) {
            const deltaTimeSeconds = (timestamp - this.lastTimestamp) / 1000;
            // distance = speed(m/s) * time(s)
            const deltaDistance = this.rawSpeed * deltaTimeSeconds;
            this.distanceMeters += deltaDistance;
        }
        this.lastTimestamp = timestamp;
        const distanceMiles = this.distanceMeters * 0.000621371;

        // final result object
        const result = {
            stepCount: this.stepCount,
            cadence: Math.round(cadence),
            strideLength: Number(strideLength.toFixed(2)),
            speed: Number(speed.toFixed(2)),
            pace: Number(pace.toFixed(2)),
            distance: Number(distanceMiles.toFixed(2)),
        };

        this.lastResult = result;
        return result;
    }

    // helper getters
    public getStepCount(): number {
        return this.stepCount;
    }

    public getDistance(): number {
        return Number((this.distanceMeters * 0.000621371).toFixed(2));
    }

    // reset values
    public reset() {
        this.isGrounded = true;
        this.rawSpeed = 0;
        this.stepCount = 0;
        this.stepTimes = [];
        this.lastStepTime = 0;
        this.pace = 0;
        this.distanceMeters = 0;
        this.lastTimestamp = 0;
        this.paused = false;
    }
}

