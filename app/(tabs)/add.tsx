import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/FontAwesome5";
import Collapsible from "react-native-collapsible"; // Per gestire l'espansione

export default function Add() {
  const router = useRouter();
  const [type, setType] = useState<"folder" | "link" | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]); // Cartelle espanse

  useEffect(() => {
    loadFolders(); // Carica le cartelle esistenti
  }, []);

  const loadFolders = async () => {
    try {
      const storedCategories = await AsyncStorage.getItem("categories");
      if (storedCategories) {
        const categories = JSON.parse(storedCategories);
        const onlyFolders = categories.filter((item: any) => item.items); // Filtra solo le cartelle
        setFolders(onlyFolders);
      }
    } catch (error) {
      console.error("Error loading folders", error);
    }
  };

  const toggleExpand = (folderId: string) => {
    if (expandedFolders.includes(folderId)) {
      setExpandedFolders(expandedFolders.filter((id) => id !== folderId));
    } else {
      setExpandedFolders([...expandedFolders, folderId]); // Espandi cartella
    }
  };

  const findFolderById = (categories: any[], folderId: string): any | null => {
    for (let folder of categories) {
      if (folder.id === folderId) {
        return folder; // Se la cartella corrisponde, ritorna la cartella
      }
      if (folder.items && folder.items.length > 0) {
        const found = findFolderById(folder.items, folderId); // Cerca ricorsivamente nelle sotto-cartelle
        if (found) return found;
      }
    }
    return null; // Se non viene trovata, ritorna null
  };

  const addItem = async () => {
    try {
      const storedCategories = await AsyncStorage.getItem("categories");
      const categories = storedCategories ? JSON.parse(storedCategories) : [];

      if (type === "folder" && selectedFolder) {
        // Cerca la cartella selezionata ricorsivamente
        const selectedFolderObj = findFolderById(categories, selectedFolder);
        if (selectedFolderObj && selectedFolderObj.items) {
          // Aggiungi la nuova cartella all'interno di quella selezionata
          selectedFolderObj.items.push({
            id: Date.now().toString(),
            name,
            items: [],
          });
          Alert.alert("Folder added inside another folder!");
        } else {
          Alert.alert("Folder not found or doesn't support subfolders.");
          return;
        }
      } else if (type === "folder" && !selectedFolder) {
        // Aggiungi una nuova cartella nella root
        categories.push({ id: Date.now().toString(), name, items: [] });
        Alert.alert("Folder added!");
      } else if (type === "link" && selectedFolder) {
        // Cerca la cartella selezionata ricorsivamente
        const selectedFolderObj = findFolderById(categories, selectedFolder);
        if (selectedFolderObj && selectedFolderObj.items) {
          // Aggiungi il nuovo link all'interno della cartella selezionata
          selectedFolderObj.items.push({
            id: Date.now().toString(),
            name,
            url,
          });
          Alert.alert("Link added to folder!");
        } else {
          Alert.alert("Folder not found or doesn't support links.");
          return;
        }
      } else {
        Alert.alert("Please select a folder to add the link or folder.");
        return;
      }

      await AsyncStorage.setItem("categories", JSON.stringify(categories));

      // Reset degli input e ricarica delle cartelle aggiornate
      setName("");
      setUrl("");
      setType(null);
      setSelectedFolder(null);

      loadFolders(); // Ricarica le cartelle per aggiornare la lista
    } catch (error) {
      console.error("Error saving data", error);
    }
  };

  const cancel = () => {
    setType(null);
    setName("");
    setUrl("");
    setSelectedFolder(null);
  };

  const renderFolders = (folders: any[], depth = 0) => {
    return folders.map((folder) => {
      const isExpanded = expandedFolders.includes(folder.id);
      const hasSubfolders = folder.items && folder.items.length > 0;

      return (
        <View key={folder.id} style={{ marginLeft: depth * 10 }}>
          <TouchableOpacity
            style={[
              styles.folderItem,
              selectedFolder === folder.id && styles.selectedFolderItem,
            ]}
            onPress={() => {
              setSelectedFolder(folder.id); // Prima seleziona la cartella
              if (hasSubfolders) {
                toggleExpand(folder.id); // Poi la espande se ha sotto-cartelle
              }
            }}
          >
            <Icon name="folder" size={20} color="#A78BFA" />
            <Text style={styles.folderName}>{folder.name}</Text>
            {hasSubfolders && (
              <Icon
                name={isExpanded ? "chevron-down" : "chevron-right"}
                size={16}
                color="#A78BFA"
                style={{ marginLeft: "auto" }} // Posiziona la freccia a destra
              />
            )}
          </TouchableOpacity>

          {/* Se la cartella è espansa, renderizza le sotto-cartelle */}
          <Collapsible collapsed={!isExpanded}>
            {hasSubfolders && renderFolders(folder.items, depth + 1)}
          </Collapsible>
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Add Category/Link</Text>

      {!type ? (
        <View style={styles.selectionContainer}>
          <Text style={styles.questionText}>
            Do you want to create a folder or a link?
          </Text>
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              onPress={() => setType("folder")}
              style={styles.typeButton}
            >
              <Icon name="folder" size={24} color="#A78BFA" />
              <Text style={styles.buttonText}>Folder</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setType("link")}
              style={styles.typeButton}
            >
              <Icon name="link" size={24} color="#A78BFA" />
              <Text style={styles.buttonText}>Link</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.formContainer}>
          <TextInput
            placeholder="Name"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#A1A1AA"
            style={styles.input}
          />
          {type === "link" && (
            <TextInput
              placeholder="URL"
              value={url}
              onChangeText={setUrl}
              placeholderTextColor="#A1A1AA"
              style={styles.input}
            />
          )}

          <Text style={styles.questionText}>
            Select a folder to save the {type === "link" ? "link" : "folder"}:
          </Text>
          <ScrollView style={styles.foldersList}>
            {renderFolders(folders)}
          </ScrollView>

          <View style={styles.buttonsRow}>
            <TouchableOpacity onPress={addItem} style={styles.confirmButton}>
              <Icon name="check" size={24} color="#4CAF50" />
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={cancel} style={styles.cancelButton}>
              <Icon name="times" size={24} color="#F44336" />
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  headerText: {
    fontSize: 32,
    color: "#A78BFA",
    fontWeight: "bold",
    marginBottom: 20,
  },
  selectionContainer: {
    alignItems: "center",
  },
  questionText: {
    color: "#FFFFFF",
    fontSize: 18,
    marginBottom: 20,
  },
  foldersList: {
    maxHeight: 200,
    marginVertical: 10,
  },
  folderItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B3B3B",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedFolderItem: {
    borderWidth: 2,
    borderColor: "#A78BFA",
  },
  folderName: {
    color: "#A78BFA",
    fontSize: 16,
    marginLeft: 10,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  typeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B3B3B",
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  buttonText: {
    color: "#A78BFA",
    fontSize: 16,
    marginLeft: 10,
  },
  formContainer: {
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#3B3B3B",
    backgroundColor: "#3B3B3B",
    color: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    fontSize: 16,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#3B3B3B",
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#3B3B3B",
    padding: 15,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
});
