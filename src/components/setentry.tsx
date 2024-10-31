import React from "react";
import { View, Text, StyleSheet, GestureResponderEvent, Pressable } from "react-native";
import { Set, Stage } from "../types";

interface SetEntryProps {
  set: Set,
  stage: Stage,
  onClick: Function,
};

const SetEntry: React.FC<SetEntryProps> = ({ set, stage, onClick }) => {
    const heightPerMinute = 2; // Adjust this value as needed
    const cardHeight = set.duration * heightPerMinute;
    return(
        <Pressable 
          style={[styles.event, { backgroundColor: stage.backgroundColor, height: cardHeight }]}        
          onPress={() => onClick(set, stage)}
        >
            <Text style={[styles.time, { color: stage.textColor }]}>{set.time}</Text> 
            <Text style={[styles.title, { color: stage.textColor }]} ellipsizeMode="tail">{set.title}</Text>
        </Pressable>
    );
};
const styles = StyleSheet.create({
    event: {
      padding: 10,
      borderRadius: 10,
      marginVertical: 5,
      width: 120,
      justifyContent: 'space-between',
    },
    time: {
      fontWeight: 'bold',
    },
    title: {
      flex: 1,
      fontSize: 14,
    },
});
export default SetEntry;