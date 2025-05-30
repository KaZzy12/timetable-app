import React, { useEffect, useState } from "react";
import { Button, ScrollView, StyleSheet, View, Text, FlatList, Modal, Pressable } from "react-native";
import eventsData from "../data/events.json";
import SetEntry from "./setentry";
import SetCard from "./setcard";
import { Set, Stage, Day } from "../types";
import { getDayTimeRange, calculateMinimumInterval, generateTimeSlots } from "../utils";

const Timetable = () => {
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [days, setDays] = useState<Day[]>([]);
    const [displayCard, setDisplayCard] = useState<boolean>(false);
    const [activeSet, setActiveSet] = useState<Set | null>(null);
    const [activeStage, setActiveStage] = useState<Stage | null>(null);
    const activateCard = (item: Set, stage: Stage) => {
        setActiveSet(item);
        setActiveStage(stage);
        setDisplayCard(true);
    };
    const closeCard:Function = () => {
        setDisplayCard(false);
        setActiveSet(null);
        setActiveStage(null);
    };

    useEffect(() => {
        setDays(eventsData);
        // Automatically select the first day if available
        if (eventsData.length > 0) {
            setSelectedDay(eventsData[0].day);
        }
    }, []);

    // Find the currently selected day and its stages
    const currentDay = days.find(day => day.day === selectedDay);

    return(           
        <ScrollView style={styles.container}>
            <Modal
                visible={displayCard}
                transparent={true}
                animationType="fade"
                onRequestClose={() => closeCard()}
            >
                <View style={styles.overlay}>
                    {/* Background overlay to close modal on outside press */}
                    <Pressable style={styles.overlayBackground} onPress={() => closeCard()} />
                    {/* Centered card container */}
                    <View style={styles.cardContainer}>
                        {activeSet && activeStage ? (
                            <SetCard set={activeSet} stage={activeStage} />
                        ) : (
                            <Text style={{ color: "#fff" }}>Loading...</Text>
                        )}
                    </View>
                </View>
            </Modal>
            <ScrollView horizontal contentContainerStyle={styles.dayButtons}>
                {days.map(day => (
                    <Button
                        key={day.day}
                        title={day.day}
                        onPress={() => setSelectedDay(day.day)}
                        color={day.day === selectedDay ? '#FFD700' : '#888'} // Highlight the selected day
                    />
                ))}
            </ScrollView>
            <ScrollView horizontal stickyHeaderIndices={[1]} contentContainerStyle={styles.stagesContainer}>
                {currentDay && currentDay.stages.map(stage => (
                    <View key={stage.stage} style={styles.stageContainer}>
                        <View>
                            <Text style={[styles.stageTitle, { color: stage.backgroundColor }]}>
                                {stage.stage}
                            </Text>
                        </View>
                        <View style={styles.flatListContainer}>
                            <FlatList
                                data={stage.sets}
                                keyExtractor={(item) => stage.stage + item.time + item.title}
                                renderItem={({ item }) => (
                                    <SetEntry 
                                        set={item} 
                                        stage={stage}
                                        onClick={activateCard}
                                    />      
                                )}
                                scrollEnabled={false}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
                    </View>
                ))}
            </ScrollView>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      flexGrow: 1,
      padding: 10,
      marginTop: 30,
      backgroundColor: '#000',
    },
    dayButtons: {
      flexDirection: 'row',
      paddingVertical: 10,
      paddingHorizontal: 5,
    },
    stagesContainer: {
        flexDirection: 'row',
        paddingVertical: 10,
    },
    stageContainer: {
      marginRight: 10,
    },
    stageTitle: {
    zIndex: 1,
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    flatListContainer: {
        flexGrow: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    overlayBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    cardContainer: {
        width: '80%',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
  });

export default Timetable;