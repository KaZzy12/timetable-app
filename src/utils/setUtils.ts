import { Stage, Set } from "../types";

export const getDayTimeRange = (stages: Stage[]) => {
    let earliest = "23:59";
    let latest = "00:00";
    stages.forEach(stage => {
      stage.sets.forEach(set => {
        if (set.time < earliest) earliest = set.time;
        const setEnd = new Date(`1970-01-01T${set.time}`).getTime() + set.duration * 60000;
        const formattedEnd = new Date(setEnd).toTimeString().slice(0, 5);
        if (formattedEnd > latest) latest = formattedEnd;
      });
    });
    return { start: earliest, end: latest };
  };
  
 export  const calculateMinimumInterval = (stages: Stage[]) => {
    let minDuration = Infinity;
    stages.forEach(stage => {
      stage.sets.forEach(set => {
        if (set.duration < minDuration) {
          minDuration = set.duration;
        }
      });
    });
    return Math.max(minDuration, 15);
  };

  export const generateTimeSlots = (stageSets: Set[], start: string, end: string, interval: number) => {
    const slots = [];
    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);
    let currentTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;
  
    while (currentTimeInMinutes < endTimeInMinutes) {
      const timeStr = `${String(Math.floor(currentTimeInMinutes / 60)).padStart(2, "0")}:${String(currentTimeInMinutes % 60).padStart(2, "0")}`;
      const setAtTime = stageSets.find(set => set.time === timeStr);
      slots.push(setAtTime ? setAtTime : null);
      currentTimeInMinutes += setAtTime ? setAtTime.duration : interval;
    }
    return slots;
  };