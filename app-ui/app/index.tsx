import { StyleSheet, View, Text, TextInput, Button, Alert, ScrollView, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { useRouter, Stack } from "expo-router";

type UserProfile = {
  username: string;
  passwordHash: string;
  name: string;
  dob: string; // ISO date string
  heightFt: number;
  heightIn: number;
  weightLb: number;
};

export default function Index() {

  useEffect(() => {
    console.log("ROOT index.tsx mounted");
  }, []);

  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [name, setName] = useState("");
  const [dob, setDob] = useState(""); // yyyy-mm-dd
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weightLb, setWeightLb] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  // clear session
  useEffect(() => {
    const clearSession = async () => {
      await SecureStore.deleteItemAsync("currentUser");
    };
    clearSession();
  }, []);

  const handleSubmit = async () => {
    setErrorMessage("");

    // get current users
    const rawUsers = await SecureStore.getItemAsync("allUsers");
    const usersList: UserProfile[] = rawUsers ? JSON.parse(rawUsers) : [];

    if (activeTab === "login") {
      // login
      const user = usersList.find(u => u.username.toLowerCase() === username.toLowerCase());
      const hashed = await hashPassword(password);

      if (!user) {
        setErrorMessage("No account found");
        return;
      }

      if (user.passwordHash !== hashed) {
        setErrorMessage("Invalid password");
        return;
      }

      await SecureStore.setItemAsync("currentUser", JSON.stringify(user));
      router.replace("/(home)/home");

    } else {
      // sign up

      // all fields must be filled
      if (!username || !password || !name || !dob || !heightFt || !heightIn || !weightLb) {
        setErrorMessage("Please fill out all fields");
        return;
      }

      // see if user/account exists
      const userExists = usersList.some(u => u.username.toLowerCase() === username.toLowerCase());
    
      if (userExists) {
        setErrorMessage("Username is taken");
        return;
      }

      const profile: UserProfile = {
        username,
        passwordHash: await hashPassword(password),
        name,
        dob,
        heightFt: parseInt(heightFt),
        heightIn: parseInt(heightIn),
        weightLb: parseInt(weightLb),
      };

      const updatedUsersList = [...usersList, profile];
      await SecureStore.setItemAsync("allUsers", JSON.stringify(updatedUsersList));

      await SecureStore.setItemAsync("currentUser", JSON.stringify(profile));
      await SecureStore.setItemAsync("userProfile", JSON.stringify(profile));

      //const user = usersList.find(u => u.username.toLowerCase() === username.toLowerCase());
      

      router.replace("/(home)/home");

    }
  };

  const hashPassword = async (pw: string) => {
    let hash = 0;
    for (let i = 0; i < pw.length; i++) {
      hash = (hash << 5) - hash + pw.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString();
  };

  // ui
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.container}>
        <View style={{ height: 35 }} />

        <Text style={styles.title}>StepSmart</Text>

          {/* <Text style={styles.title}>
            {hasProfile ? "Log In" : "Create An Account"}
          </Text> */}
          <View style={{ height: 8 }} />

          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === "login" && styles.activeTab]} 
              onPress={() => { setActiveTab("login"); setErrorMessage(""); }}
            >
              <Text style={[styles.tabText, activeTab === "login" && styles.activeTabText]}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === "signup" && styles.activeTab]} 
              onPress={() => { setActiveTab("signup"); setErrorMessage(""); }}
            >
              <Text style={[styles.tabText, activeTab === "signup" && styles.activeTabText]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
     
          <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

          {activeTab === "signup" && (
            <>
            <Text style={styles.label}>Name </Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#949494"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Date of Birth</Text>
            <TextInput
              style={styles.input}
              placeholder="MMDDYYY"
              placeholderTextColor="#949494"
              keyboardType="numeric"
              value={dob}
              maxLength={8}
              onChangeText={setDob}
            />

            <Text style={styles.label}>Height</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 5 }]}
                placeholder="ft"
                placeholderTextColor="#949494"
                keyboardType="numeric"
                value={heightFt}
                onChangeText={setHeightFt}
              />
              <TextInput
                style={[styles.input, { flex: 1, marginLeft: 5 }]}
                placeholder="in"
                placeholderTextColor="#949494"
                keyboardType="numeric"
                value={heightIn}
                onChangeText={setHeightIn}
                />
            </View>

            <Text style={styles.label}>Weight</Text>
            <TextInput
              style={styles.input}
              placeholder="lb"
              placeholderTextColor="#949494"
              keyboardType="numeric"
              value={weightLb}
              onChangeText={setWeightLb}
            />
            </>
          )}

          <View style={styles.button}>
            <Button
              title={activeTab === "login" ? "Log In" : "Create Account"} 
              onPress={handleSubmit}
              color="#007AFF" 
            />
          </View>

          <View style={{ height: 50}}>
            {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
          </View>

        </View>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1c1c1e",
    padding: 20,
    justifyContent: "flex-start",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#3a3a3c",
    borderRadius: 5,
    padding: 4,
    marginBottom: 25,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: "#6366f1",
    borderRadius: 5,
  },
  tabText: {
    color: "#8e8e93",
    fontWeight: "600",
    fontSize: 15,
  },
  activeTabText: {
    color: "#fff",
  },
  label: {
    color: "#fff",
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#3a3a3c",
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 5,
  },
  button: {
    marginTop: 35,
    color: "#007AFF"
  },
  errorText: {
    color: "red",
    textAlign: "center",
    fontSize: 12,
    marginTop: 25,
  },
  row: {
    flexDirection: "row",
  },
});

export const options = {
  headerShown: false, 
  drawerItemStyle: { height: 0 }, 
};