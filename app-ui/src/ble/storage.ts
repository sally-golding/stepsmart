import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";

// file paths for pressure and metric data
export const pressure_file: string = (FileSystem as any).documentDirectory + "pressure_data.txt";
export const metrics_file: string = (FileSystem as any).documentDirectory + "metrics_data.txt"; // cadence, stride length, speed, and pace

// generate history file based on unique user id
export async function getHistoryFile() {
    const userId = await SecureStore.getItemAsync("userId");
    return (FileSystem as any).documentDirectory + `sessions_history_${userId}.json`;
}

// clear file with a new session
export async function resetFile(path: string) {
    try {
        const header = path.includes("metrics") 
            ? "cadence,stride,speed,pace,steps,distance\n" 
            : "p1,p2,p3\n";
        await FileSystem.writeAsStringAsync(path, header, { encoding: "utf8" });
    } catch (e) {
        console.log("File Reset Error:", e);
    }
}

// add new sensor data (reads old content, adds new text, overwrites file)
export async function appendFile(path: string, text: string) {
    try {
        //const fileInfo = await FileSystem.getInfoAsync(path);
        let current = "";
        try {
            current = await FileSystem.readAsStringAsync(path);
        } catch {
            current = "";
        }
        // if (fileInfo.exists) {
        // current = await FileSystem.readAsStringAsync(path);
        await FileSystem.writeAsStringAsync(path, current + text, { encoding: "utf8" }); 

    } catch (e) {
        console.log("File Write Error:", e);
    }
}

// save session into a json history file
export async function saveSessionToHistory(sessionSummary: any) {
    if (!sessionSummary) {
        console.error("No session summary provided to saveSessionToHistory");
        return;
    }
    try {
        const history_file = await getHistoryFile();
        const fileInfo = await FileSystem.getInfoAsync(history_file);
        
        let history = [];
        if (fileInfo.exists) {
            const content = await FileSystem.readAsStringAsync(history_file);
            history = JSON.parse(content);
        }
        history.push(sessionSummary);
        await FileSystem.writeAsStringAsync(history_file, JSON.stringify(history), { encoding: "utf8" });
        console.log("Session saved to history.");
    } catch (e) {
        console.error("Error saving history:", e);
    }
}