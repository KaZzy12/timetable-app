import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Set, Stage } from "../types";

interface SetCardEntryProps {
  set: Set;
  stage: Stage;
}

const SetCard: React.FC<SetCardEntryProps> = ({ set, stage }) => {
  const almostWindowsWidth = Dimensions.get("window").width * 0.9;
  const almostWindowsHeight = Dimensions.get("window").height * 0.9;
  const endTime = new Date();
  const hours = parseInt(set.time.split(":")[0]);
  const mins = parseInt(set.time.split(":")[1]);
  endTime.setHours(hours);
  endTime.setMinutes(mins + set.duration);
  return (
    <View
      style={[
        styles.card,
        {
          width: almostWindowsWidth,
          maxHeight: almostWindowsHeight,
          backgroundColor: stage.backgroundColor,
        },
      ]}
    >
      <Text style={[styles.time, { color: stage.textColor || "white" }]}>
        {set.time} - {endTime.getHours().toString().padStart(2, "0")}:
        {endTime.getMinutes().toString().padStart(2, "0")}
      </Text>
      <Text
        style={[styles.title, { color: stage.textColor || "white" }]}
        numberOfLines={0}
        ellipsizeMode="tail"
      >
        {set.title}
      </Text>
    </View>
  );
};
const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    minHeight: 150,
    margin: 0,
  },
  title: {
    fontSize: 18,
    marginBottom: 5,
    fontWeight: "bold",
  },
  time: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
});

export default SetCard;
