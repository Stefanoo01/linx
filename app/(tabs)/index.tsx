import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import Collapsible from "react-native-collapsible";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";

export default function Component() {
  const [activeSections, setActiveSections] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [backupCategories, setBackupCategories] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get("window")); // Imposta lo stato per le dimensioni

  useFocusEffect(
    React.useCallback(() => {
      loadCategories();
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
        .filter((item) => item.id !== id)
        .map((item) => {
          if (item.items) {
            return { ...item, items: recursiveRemove(item.items) };
          }
          return item;
        });
    };

    const updatedCategories = recursiveRemove(categories);
    setCategories(updatedCategories);
    updateDatabase(updatedCategories);
  };

  const enterEditMode = () => {
    setBackupCategories(categories);
    setIsEditing(true);
  };

  const confirmChanges = () => {
    updateDatabase(categories);
    setIsEditing(false);
  };

  const cancelChanges = () => {
    setCategories(backupCategories);
    updateDatabase(backupCategories);
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
                <Text
                  style={styles.linkTitle}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.name}
                </Text>
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
        const hasChildren = item.items && item.items.length > 0;
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
                  <Text
                    style={styles.folderTitle}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.name}
                  </Text>
                </View>
                {hasChildren && (
                  <Icon
                    name={isActive ? "chevron-down" : "chevron-right"}
                    size={16}
                    color="#A78BFA"
                  />
                )}
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

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <View
      style={[
        styles.container,
        { width: dimensions.width, height: dimensions.height },
      ]}
    >
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
              <TouchableOpacity onPress={enterEditMode} style={styles.button}>
                <Icon name="edit" size={24} color="#A78BFA" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <View
        style={[
          styles.card,
          { width: dimensions.width * 0.9, height: dimensions.height * 0.8 },
        ]}
      >
        <ScrollView
          style={[
            styles.scrollArea,
            { marginBottom: dimensions.width > dimensions.height ? 65 : -30 },
          ]}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
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
  footer: {
    height: 50,
    backgroundColor: "#27272A",
  },
});
