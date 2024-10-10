import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import Collapsible from "react-native-collapsible";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";

export default function Component() {
  const [activeSections, setActiveSections] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadCategories(); // Ricarica le categorie quando la pagina viene visualizzata
    }, [])
  );

  const router = useRouter();

  const loadCategories = async () => {
    try {
      const savedCategories = await AsyncStorage.getItem("categories");
      if (savedCategories) {
        setCategories(JSON.parse(savedCategories));
      }
    } catch (error) {
      console.error("Errore nel caricamento delle categorie", error);
    }
  };

  const toggleSection = (id: string) => {
    if (activeSections.includes(id)) {
      setActiveSections(activeSections.filter((i) => i !== id));
    } else {
      setActiveSections([...activeSections, id]);
    }
  };

  const updateDatabase = async (updatedCategories: any[]) => {
    try {
      await AsyncStorage.setItem(
        "categories",
        JSON.stringify(updatedCategories)
      );
    } catch (error) {
      console.error("Errore nell'aggiornamento del database", error);
    }
  };

  const removeItem = (id: string) => {
    const recursiveRemove = (items: any[]): any[] => {
      return items
        .filter((item) => item.id !== id) // Rimuovi l'elemento a questo livello
        .map((item) => {
          if (item.items) {
            // Se l'elemento ha sottocartelle o link, applica la ricorsione
            return { ...item, items: recursiveRemove(item.items) };
          }
          return item;
        });
    };

    const updatedCategories = recursiveRemove(categories);
    setCategories(updatedCategories);
    updateDatabase(updatedCategories);
  };

  const confirmChanges = () => {
    updateDatabase(categories);
    setIsEditing(false); // Esci dalla modalità modifica
  };

  const cancelChanges = () => {
    loadCategories(); // Ricarica le categorie senza salvare le modifiche
    setIsEditing(false);
  };

  const renderItems = (items: any[], depth = 0) => {
    return items.map((item, index) => {
      if (item.url) {
        return (
          <View
            key={index}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginLeft: depth * 10,
            }}
          >
            <TouchableOpacity
              style={[styles.linkCard, { flex: 1 }]}
              onPress={() => !isEditing && Linking.openURL(item.url)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.linkTitle}>{item.name}</Text>
                <Text style={styles.linkURL}>{item.url}</Text>
              </View>
              <Icon name="external-link-alt" size={16} color="#A78BFA" />
            </TouchableOpacity>
            {isEditing && (
              <TouchableOpacity onPress={() => removeItem(item.id)}>
                <Icon
                  name="trash"
                  size={24}
                  color="#F44336"
                  style={{ marginLeft: 10 }}
                />
              </TouchableOpacity>
            )}
          </View>
        );
      } else {
        const isActive = activeSections.includes(item.id);
        return (
          <View key={index} style={{ marginLeft: depth * 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                style={[styles.folderHeader, { flex: 1 }]}
                onPress={() => toggleSection(item.id)}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <Icon name="folder" size={20} color="#A78BFA" />
                  <Text style={styles.folderTitle}>{item.name}</Text>
                </View>
                <Icon
                  name={isActive ? "chevron-down" : "chevron-right"}
                  size={16}
                  color="#A78BFA"
                />
              </TouchableOpacity>
              {isEditing && (
                <TouchableOpacity onPress={() => removeItem(item.id)}>
                  <Icon
                    name="trash"
                    size={24}
                    color="#F44336"
                    style={{ marginLeft: 10 }}
                  />
                </TouchableOpacity>
              )}
            </View>
            <Collapsible collapsed={!isActive}>
              <View style={styles.subItems}>
                {renderItems(item.items, depth + 1)}
              </View>
            </Collapsible>
          </View>
        );
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Linx</Text>
        <View style={{ flexDirection: "row" }}>
          {isEditing ? (
            <>
              <TouchableOpacity onPress={confirmChanges} style={styles.button}>
                <Icon name="check" size={24} color="#4CAF50" />
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelChanges} style={styles.button}>
                <Icon name="times" size={24} color="#F44336" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => router.push("/add")}
                style={styles.button}
              >
                <Icon name="plus" size={24} color="#A78BFA" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                style={styles.button}
              >
                <Icon name="edit" size={24} color="#A78BFA" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <ScrollView style={styles.scrollArea}>
          {renderItems(categories)}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#27272A",
    alignItems: "center",
    padding: 5,
  },
  header: {
    flexDirection: "row",
    marginTop: 30,
    marginBottom: 15,
    width: "90%",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    fontSize: 32,
    color: "#A78BFA",
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#27272A",
    borderRadius: 10,
    width: 320,
    height: 640,
    padding: 0,
  },
  scrollArea: {
    flex: 1,
  },
  folderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#3B3B3B",
    borderRadius: 5,
    marginBottom: 10,
  },
  folderTitle: {
    color: "#A78BFA",
    fontSize: 16,
    marginLeft: 10,
  },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2E2E30",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  linkTitle: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  linkURL: {
    color: "#A1A1AA",
    fontSize: 12,
    marginTop: 5,
  },
  subItems: {
    paddingLeft: 10,
  },
  button: {
    backgroundColor: "#3B3B3B",
    padding: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
});
