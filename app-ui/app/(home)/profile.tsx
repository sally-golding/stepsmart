import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

// InfoRow stays stable outside
const InfoRow = ({ label, field, value, isEditing, editedProfile, onUpdate, isLast, formatDate }: any) => {
  const canEdit = isEditing && field !== "username";
  return (
    <View style={[styles.infoRow, isLast && { borderBottomWidth: 0 }]}>
      <Text style={styles.label}>{label}</Text>
      {canEdit ? (
        <TextInput
          style={styles.input}
          value={String(editedProfile[field] || "")}
          onChangeText={(text) => onUpdate(field, text)}
          keyboardType={field === "weightLb" || field === "dob" ? "numeric" : "default"}
        />
      ) : (
        <Text style={[styles.value, isEditing && field === "username" && { color: "#8e8e93" }]}>
          {field === "dob" ? formatDate(value) : value} 
        </Text>
      )}
    </View>
  );
};

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<any>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const data = await SecureStore.getItemAsync("currentUser");
      if (data) {
        const parsedData = JSON.parse(data);
        setProfile(parsedData);
        setEditedProfile(parsedData); 
      }
    };
    loadProfile();
  }, []);

  const onUpdateField = (field: string, text: string) => {
    setEditedProfile((prev: any) => ({ ...prev, [field]: text }));
  };

  const handleSave = async () => {
    await SecureStore.setItemAsync("currentUser", JSON.stringify(editedProfile));
    const rawUsers = await SecureStore.getItemAsync("allUsers");
    if (rawUsers) {
      const usersList = JSON.parse(rawUsers);
      const updatedList = usersList.map((u: any) => 
        u.username.toLowerCase() === profile.username.toLowerCase() ? editedProfile : u
      );
      await SecureStore.setItemAsync("allUsers", JSON.stringify(updatedList));
    }
    setProfile(editedProfile);
    setIsEditing(false);
  };

  const formatDate = (dobString: string) => {
    if (!dobString || dobString.length !== 8) return dobString;
    return `${dobString.substring(0, 2)}/${dobString.substring(2, 4)}/${dobString.substring(4, 8)}`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="always">
      <View style={styles.welcomeBox}>
        <Text style={styles.welcomeText}>User Information</Text>
      </View>

      <View style={styles.card}>
        {!editedProfile ? (
          <Text style={styles.value}>Loading...</Text>
        ) : (
          <>
            <InfoRow label="Username" field="username" value={editedProfile.username} isEditing={isEditing} editedProfile={editedProfile} onUpdate={onUpdateField} formatDate={formatDate} />
            <InfoRow label="Name" field="name" value={editedProfile.name} isEditing={isEditing} editedProfile={editedProfile} onUpdate={onUpdateField} formatDate={formatDate} />
            <InfoRow label="Date of Birth" field="dob" value={editedProfile.dob} isEditing={isEditing} editedProfile={editedProfile} onUpdate={onUpdateField} formatDate={formatDate} />
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Height</Text>
              {isEditing ? (
                <View style={styles.heightInputContainer}>
                  <TextInput style={styles.smallInput} value={String(editedProfile.heightFt || "")} keyboardType="numeric" maxLength={1} onChangeText={(text) => onUpdateField('heightFt', text)} />
                  <Text style={styles.value}>' </Text>
                  <TextInput style={styles.smallInput} value={String(editedProfile.heightIn || "")} keyboardType="numeric" maxLength={2} onChangeText={(text) => onUpdateField('heightIn', text)} />
                  <Text style={styles.value}>"</Text>
                </View>
              ) : (
                <Text style={styles.value}>{`${editedProfile?.heightFt}' ${editedProfile?.heightIn}"`}</Text>
              )}
            </View>

            <InfoRow label="Weight (lbs)" field="weightLb" value={editedProfile.weightLb} isEditing={isEditing} editedProfile={editedProfile} onUpdate={onUpdateField} isLast={true} formatDate={formatDate} />
          </>
        )}
      </View>

      {/* ACTION BUTTONS UNDERNEATH */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.buttonBox} 
          onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
        >
          <Text style={styles.buttonText}>
            {isEditing ? "SAVE" : "EDIT"}
          </Text>
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => { setIsEditing(false); setEditedProfile(profile); }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "flex-start",
    backgroundColor: "#1c1c1e",
    alignItems: "center"
  },
  headerRow: {
    width: '90%',
    marginBottom: 20,
  },
  welcomeText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 10,
    marginBottom: 10,
    fontWeight: "600",
    textAlign: "center"
  },
  welcomeBox: {
    width: "90%",
    height: 50,
    marginBottom: 20,
  },
  card: {
    width: "90%",
    backgroundColor: "#3a3a3c", 
    borderRadius: 20,
    padding: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  label: {
    color: "#ccc",
    fontSize: 16,
    fontWeight: "600",
  },
  value: {
    color: "#fff",
    fontSize: 16,
  },
  input: {
    backgroundColor: "#2c2c2e",
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 16,
    minWidth: 120,
    textAlign: 'right',
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 40,
  },
  buttonBox: {
    width: "45%",
    height: 40,
    backgroundColor: "#007AFF",
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  cancelButton: {
    marginTop: 15,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: "#ff3b30", // Standard iOS Red
    fontSize: 16,
    fontWeight: "600",
  },
  heightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallInput: {
    backgroundColor: "#2c2c2e",
    color: "#fff",
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderRadius: 5,
    fontSize: 16,
    width: 35,
    textAlign: 'center',
  },
});