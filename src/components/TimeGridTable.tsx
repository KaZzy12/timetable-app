import { useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import eventsData from "../data/events.json";
import { Day, Set, Stage } from "../types";
import SetCard from "./setcard";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDecay,
} from "react-native-reanimated";
import SetEntry from "./setentry";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const TIME_SLOT_HEIGHT = 70;
const STAGE_WIDTH = 140;
const TIME_COLUMN_WIDTH = 70;
const CONTENT_WIDTH = 2000;

const TimeGridTable = () => {
  const [displayCard, setDisplayCard] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [activeSet, setActiveSet] = useState<Set | null>(null);
  const [activeStage, setActiveStage] = useState<Stage | null>(null);

  // Helper function to calculate set duration in minutes
  const calculateSetDuration = (set: Set): number => {
    // Check if set has duration property
    if (set.duration && typeof set.duration === "number") {
      return set.duration;
    }

    // Fallback to parsing time range if available
    if (set.time && typeof set.time === "string" && set.time.includes(" - ")) {
      try {
        const [startHour, startMin] = set.time
          .split(" - ")[0]
          .split(":")
          .map(Number);
        const [endHour, endMin] = set.time
          .split(" - ")[1]
          .split(":")
          .map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        return endMinutes - startMinutes;
      } catch (error) {
        console.warn(
          "Error calculating set duration from time range:",
          error,
          "for set:",
          set
        );
      }
    }

    return 30; // Default to 30 minutes if no duration info available
  };

  // Helper function to find the earliest start time for the current day
  const getEarliestStartTime = (): number => {
    if (!currentDay) return 10; // fallback to 10 if no day selected

    let earliestHour = 23; // start with latest possible hour

    currentDay.stages.forEach((stage) => {
      stage.sets.forEach((set) => {
        if (set.time) {
          // Handle both formats: "13:00" and "13:00 - 14:00"
          const startTime = set.time.includes(" - ")
            ? set.time.split(" - ")[0]
            : set.time;

          const hour = parseInt(startTime.split(":")[0]);
          if (hour < earliestHour) {
            earliestHour = hour;
          }
        }
      });
    });

    return earliestHour === 23 ? 10 : earliestHour; // fallback to 10 if no sets found
  };

  // Helper function to find the latest end time for the current day
  const getLatestEndTime = (): number => {
    if (!currentDay) return 23; // fallback to 23 if no day selected

    let latestHour = 10; // start with earliest possible hour

    currentDay.stages.forEach((stage) => {
      stage.sets.forEach((set) => {
        if (set.time) {
          let endTime: string;

          if (set.time.includes(" - ")) {
            // Format: "13:00 - 14:00"
            endTime = set.time.split(" - ")[1];
          } else {
            // Format: "13:00" - calculate end time based on duration
            const startTime = set.time;
            const [startHour, startMin] = startTime.split(":").map(Number);
            const durationMinutes = calculateSetDuration(set);
            const endMinutes = startHour * 60 + startMin + durationMinutes;
            const endHour = Math.floor(endMinutes / 60);
            const endMin = endMinutes % 60;
            endTime = `${endHour}:${endMin.toString().padStart(2, "0")}`;
          }

          const hour = parseInt(endTime.split(":")[0]);
          if (hour > latestHour) {
            latestHour = hour;
          }
        }
      });
    });

    return latestHour === 10 ? 23 : latestHour; // fallback to 23 if no sets found
  };

  // Generate time slots for the day starting from earliest set time
  const generateTimeSlots = () => {
    if (!currentDay) return [];

    const startHour = getEarliestStartTime();
    const endHour = getLatestEndTime();
    const allTimes: string[] = [];

    // Only add regular 30-minute intervals
    for (let hour = startHour; hour <= endHour; hour++) {
      allTimes.push(`${hour}:00`);
      if (hour < endHour) allTimes.push(`${hour}:30`);
    }

    return allTimes;
  };

  const currentDay = days.find((day) => day.day === selectedDay);
  const timeSlots = generateTimeSlots();

  // Calculate dynamic content height based on time slots
  const dynamicContentHeight = timeSlots.length * TIME_SLOT_HEIGHT + 100; // Add padding

  // Shared values for completely free movement
  // Calculate maximum scroll bounds
  const maxScrollX = currentDay
    ? currentDay.stages.length * STAGE_WIDTH - SCREEN_WIDTH + 200
    : 0;
  const maxScrollY = dynamicContentHeight - SCREEN_HEIGHT + 200; // Use dynamic height
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const lastTranslateX = useSharedValue(0);
  const lastTranslateY = useSharedValue(0);
  const isGestureActive = useSharedValue(false);

  // True diagonal gesture handler - no restrictions on movement direction
  const panGestureHandler = Gesture.Pan()
    .onStart(() => {
      // Store starting positions
      lastTranslateX.value = translateX.value;
      lastTranslateY.value = translateY.value;
      isGestureActive.value = true;
    })
    .onUpdate((event: any) => {
      // Calculate new positions with COMPLETE freedom
      const newX = lastTranslateX.value + event.translationX;
      const newY = lastTranslateY.value + event.translationY;

      // Apply bounds but allow full diagonal movement
      translateX.value = Math.max(-maxScrollX, Math.min(50, newX));
      translateY.value = Math.max(-maxScrollY, Math.min(50, newY));
    })
    .onEnd((event: any) => {
      isGestureActive.value = false;

      // Apply physics-based momentum for both axes simultaneously
      const velocityX = event.velocityX;
      const velocityY = event.velocityY;

      // Strong momentum on both axes with natural deceleration
      if (Math.abs(velocityX) > 100) {
        translateX.value = withDecay({
          velocity: velocityX * 0.8,
          clamp: [-maxScrollX, 50],
          deceleration: 0.995,
        });
      }

      if (Math.abs(velocityY) > 100) {
        translateY.value = withDecay({
          velocity: velocityY * 0.8,
          clamp: [-maxScrollY, 50],
          deceleration: 0.995,
        });
      }

      // Store final positions
      lastTranslateX.value = translateX.value;
      lastTranslateY.value = translateY.value;
    });
  const closeCard: Function = () => {
    setDisplayCard(false);
    setActiveSet(null);
    setActiveStage(null);
  };
  const activateCard = (item: Set, stage: Stage) => {
    setActiveSet(item);
    setActiveStage(stage);
    setDisplayCard(true);
  };
  // Animated style for the entire scrollable content
  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });
  // Animated style for stage names (horizontal movement only)
  const animatedStageStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });
  // Animated style for time slots (vertical movement only)
  const animatedTimeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  // Helper function to check if a set should be rendered at this time slot
  const shouldRenderSetAtTimeSlot = (set: Set, timeSlot: string): boolean => {
    if (!set.time || typeof set.time !== "string") {
      return false;
    }

    try {
      // Handle both formats: "13:00" and "13:00 - 14:00"
      const setStartTime = set.time.includes(" - ")
        ? set.time.split(" - ")[0]
        : set.time;

      return setStartTime === timeSlot;
    } catch (error) {
      console.warn("Error checking time slot:", error, "for set:", set);
      return false;
    }
  };

  // Helper function to calculate set height based on duration and actual time slots
  const calculateSetHeight = (set: Set): number => {
    const durationMinutes = calculateSetDuration(set);
    // Simple calculation: duration in minutes / 30 minutes per slot * slot height
    const slotsNeeded = durationMinutes / 30;
    return Math.max(1, slotsNeeded) * TIME_SLOT_HEIGHT - 4;
  };

  // Helper function to check if a set should be rendered (only render each set once)
  const shouldRenderSet = (set: Set, timeSlot: string): boolean => {
    if (!set.time) return false;

    const setStartTime = set.time.includes(" - ")
      ? set.time.split(" - ")[0]
      : set.time;
    const [setHour, setMin] = setStartTime.split(":").map(Number);
    const [slotHour, slotMin] = timeSlot.split(":").map(Number);

    // Find the appropriate 30-minute slot for this set
    const setMinutes = setHour * 60 + setMin;
    const slotMinutes = slotHour * 60 + slotMin;
    const nextSlotMinutes = slotMinutes + 30;

    // Render the set in the slot where it starts or belongs
    return setMinutes >= slotMinutes && setMinutes < nextSlotMinutes;
  };

  // Helper function to check if a time slot is occupied by a set that started earlier
  const isSlotOccupiedByEarlierSet = (
    stage: Stage,
    timeSlot: string
  ): boolean => {
    const [currentHour, currentMin] = timeSlot.split(":").map(Number);
    const currentMinutes = currentHour * 60 + currentMin;

    return stage.sets.some((set) => {
      if (!set.time) return false;

      const setStartTime = set.time.includes(" - ")
        ? set.time.split(" - ")[0]
        : set.time;
      const [setHour, setMin] = setStartTime.split(":").map(Number);
      const setStartMinutes = setHour * 60 + setMin;
      const setEndMinutes = setStartMinutes + calculateSetDuration(set);

      // Check if current slot is within this set's duration (but not at start)
      return setStartMinutes < currentMinutes && currentMinutes < setEndMinutes;
    });
  };

  // Helper function to calculate exact position and height for a set
  const calculateSetPosition = (set: Set): { top: number; height: number } => {
    if (!set.time) return { top: 0, height: TIME_SLOT_HEIGHT - 4 };

    const setStartTime = set.time.includes(" - ")
      ? set.time.split(" - ")[0]
      : set.time;
    const [startHour, startMin] = setStartTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;

    const durationMinutes = calculateSetDuration(set);
    const endMinutes = startMinutes + durationMinutes;

    // Find the earliest time slot
    const earliestTime = timeSlots[0];
    const [earliestHour, earliestMin] = earliestTime.split(":").map(Number);
    const earliestMinutes = earliestHour * 60 + earliestMin;

    // Calculate position relative to the start of the timeline
    const minutesFromStart = startMinutes - earliestMinutes;
    const top = (minutesFromStart / 30) * TIME_SLOT_HEIGHT;

    // Calculate height based on duration
    const height = (durationMinutes / 30) * TIME_SLOT_HEIGHT - 4; // 4px gap

    return { top, height };
  };

  useEffect(() => {
    setDays(eventsData);
    // Automatically select the first day if available
    if (eventsData.length > 0) {
      setSelectedDay(eventsData[0].day);
    }
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <Modal
        visible={displayCard}
        transparent={true}
        animationType="fade"
        onRequestClose={() => closeCard()}
      >
        <TouchableWithoutFeedback onPress={() => closeCard()}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.cardContainer}>
                {activeSet && activeStage ? (
                  <SetCard set={activeSet} stage={activeStage} />
                ) : (
                  <Text style={{ color: "#000" }}>Loading...</Text>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Festival Timetable</Text>
        <ScrollView
          horizontal
          contentContainerStyle={styles.dayButtons}
          showsHorizontalScrollIndicator={false}
        >
          {days.map((day) => (
            <Pressable
              key={day.day}
              style={[
                styles.dayButton,
                day.day === selectedDay && styles.dayButtonActive,
              ]}
              onPress={() => setSelectedDay(day.day)}
            >
              <Text
                style={[
                  styles.dayButtonText,
                  day.day === selectedDay && styles.dayButtonTextActive,
                ]}
              >
                {day.day}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {/* Fixed Stage Row - moves horizontally, stays at top */}
      <View style={styles.fixedStageRow}>
        <Animated.View style={[styles.stageRowContainer, animatedStageStyle]}>
          {currentDay &&
            currentDay.stages.map((stage, index) => (
              <View key={stage.stage} style={styles.stageSlotHorizontal}>
                <Text
                  style={[
                    styles.stageTextHorizontal,
                    { color: stage.backgroundColor },
                  ]}
                >
                  {stage.stage}
                </Text>
              </View>
            ))}
        </Animated.View>
      </View>
      {/* Main scrollable area with single gesture handler */}
      <GestureDetector gesture={panGestureHandler}>
        <Animated.View style={styles.scrollableArea}>
          {/* Fixed Time Column - moves vertically, stays at left */}
          <View style={styles.fixedTimeColumn}>
            <Animated.View
              style={[styles.timeColumnContainer, animatedTimeStyle]}
            >
              {timeSlots.map((timeSlot, timeIndex) => (
                <View key={`time-${timeSlot}`} style={styles.timeSlotVertical}>
                  <Text style={styles.timeTextVertical}>{timeSlot}</Text>
                </View>
              ))}
            </Animated.View>
          </View>

          <Animated.View
            style={[
              styles.scrollableContentOnly,
              animatedContentStyle,
              {
                minHeight: dynamicContentHeight, // Use dynamic height
              },
            ]}
          >
            {/* Time grid background */}
            {timeSlots.map((timeSlot, timeIndex) => (
              <View
                key={timeSlot}
                style={[styles.timeRow, { top: timeIndex * TIME_SLOT_HEIGHT }]}
              />
            ))}

            {/* Render all sets with precise positioning */}
            {currentDay &&
              currentDay.stages
                .map((stage, stageIndex) =>
                  stage.sets.map((set, setIndex) => {
                    const position = calculateSetPosition(set);

                    return (
                      <View
                        key={`${stage.stage}-${set.title}-${setIndex}`}
                        style={[
                          styles.setContainer,
                          {
                            left: stageIndex * STAGE_WIDTH + TIME_COLUMN_WIDTH,
                            top: position.top,
                            height: position.height,
                            width: STAGE_WIDTH - 2,
                          },
                        ]}
                      >
                        <SetEntry
                          set={set}
                          stage={stage}
                          onClick={activateCard}
                        />
                      </View>
                    );
                  })
                )
                .flat()}
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexGrow: 1,
    padding: 10,
    marginTop: 30,
    backgroundColor: "#000",
  },
  header: {
    position: "absolute",
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    fontSize: 24,
    color: "#fff",
    marginTop: 10,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  dayButtons: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  dayButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  dayButtonActive: {
    backgroundColor: "#FFD700",
    borderColor: "#FFD700",
  },
  dayButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  dayButtonTextActive: {
    color: "#000",
  },
  stagesContainer: {
    flexDirection: "row",
    paddingVertical: 10,
  },
  stageContainer: {
    marginRight: 10,
  },
  stageTitle: {
    zIndex: 1,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  fixedStageRow: {
    position: "absolute",
    top: 120, // Just below day selection
    left: 0,
    right: 0,
    height: 60, // Taller for better visibility
    zIndex: 500, // Very high z-index
    backgroundColor: "rgba(0, 0, 0, 0.98)", // Almost solid background
    borderBottomWidth: 3,
    borderBottomColor: "#FFD700", // Gold border for visibility
    elevation: 15, // High elevation for Android
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    overflow: "hidden", // Clip any content that might overflow
  },
  fixedTimeColumn: {
    position: "absolute",
    left: 0, // Move to very left edge
    top: 0,
    width: 70, // Responsive width
    zIndex: 400, // High z-index
    backgroundColor: "rgba(0, 0, 0, 0.98)", // Almost solid background
    borderRightWidth: 2,
    borderRightColor: "#FFD700", // Gold border
    elevation: 12, // High elevation for Android
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    overflow: "hidden", // Clip any content that might overflow
  },
  timeColumnContainer: {
    paddingTop: 0, // Remove padding to align with content
  },
  scrollableContentOnly: {
    minWidth: CONTENT_WIDTH,
    paddingHorizontal: 20,
    paddingVertical: 0, // Remove vertical padding to align with time column
    paddingLeft: 0, // Remove padding since we're handling offset in contentCell
    paddingTop: 0, // Remove extra padding that was causing misalignment
    overflow: "hidden", // Clip content that goes outside bounds
  },
  // Grid Layout Styles
  timeRow: {
    position: "absolute",
    width: "100%",
    height: TIME_SLOT_HEIGHT - 2,
    flexDirection: "row",
  },
  contentCell: {
    position: "absolute",
    width: STAGE_WIDTH - 2,
    height: TIME_SLOT_HEIGHT - 2,
    justifyContent: "center",
    alignItems: "center",
  },
  flatListContainer: {
    flexGrow: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 9999,
  },
  cardContainer: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    // Force center positioning
    alignSelf: "center",
    marginVertical: "auto",
  },
  scrollableArea: {
    flex: 1,
    marginTop: 170,
    overflow: "hidden", // Prevent content from overflowing above
  },
  stageRowContainer: {
    flexDirection: "row",
    height: 60,
    paddingLeft: 70,
    overflow: "visible",
  },
  stageSlotHorizontal: {
    width: 140,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    marginRight: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.5)",
  },
  stageTextHorizontal: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  timeSlotVertical: {
    width: 70, // Responsive width
    height: 70 - 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.15)", // Gold tinted background
    marginBottom: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.4)", // Gold border
  },
  timeTextVertical: {
    color: "#FFD700", // Gold text
    fontSize: 12, // Smaller font on mobile
    fontWeight: "bold",
  },
  setContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default TimeGridTable;
