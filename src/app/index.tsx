import { SafeAreaView, StyleSheet } from "react-native";
import Timetable from "../components/timetable";
import TimeGridTable from "../components/TimeGridTable";

export default function Index() {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#000",
    },
  });
  return (
    <SafeAreaView style={styles.container}>
      <TimeGridTable />
    </SafeAreaView>
  );
}
