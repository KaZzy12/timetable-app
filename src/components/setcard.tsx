import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Set, Stage } from "../types";

interface SetCardEntryProps {
    set: Set,
    stage: Stage,
};

const SetCard: React.FC<SetCardEntryProps> = ({ set, stage }) => { 
    const almostWindowsWidth = Dimensions.get('window').width * 0.9; 
    const almostWindowsHeight = Dimensions.get('window').height * 0.9; 
    const endTime = new Date();
    const hours = parseInt(set.time.split(":")[0]);
    const mins = parseInt(set.time.split(":")[1]);
    endTime.setHours(hours);
    endTime.setMinutes(mins + set.duration);
    return(
        <View 
          style={
            [
              styles.card, 
              {
                minWidth:almostWindowsWidth, 
                maxHeight: almostWindowsHeight,
                backgroundColor: stage.backgroundColor
            }]}>
            <Text style={[styles.time, { color: stage.textColor || 'white' }]}>
                {set.time} - {endTime.getHours().toString().padStart(2, '0')}:{endTime.getMinutes().toString().padStart(2, '0')}
            </Text>
            <Text 
              style={[styles.title, { color: stage.textColor || 'white' }]}
              numberOfLines={0} // Allow for unlimited lines until max height is reached
              ellipsizeMode="tail" // Use ellipsis if the text overflows
            >
                {set.title}
            </Text>        
        </View>
    );
};
const styles = StyleSheet.create({
    card: {
        padding: 20, // Added padding to create space inside the card
        borderRadius: 8,
        margin: 10,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        flex: 1, // Ensure the card takes the available space
        minHeight: 150, // Set a minimum height for the card to ensure visibility
    },
    title: {
        fontSize: 18, // Increase font size for the title
        marginBottom: 5, // Add margin for spacing      
    },
    time: {
        fontSize: 16, // Increase font size for time
        fontWeight: 'bold',
    },
});

export default SetCard;