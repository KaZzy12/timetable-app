export type Set = {
    time: string;
    duration: number,
    title: string;
}

export type Stage = {
    stage: string;
    backgroundColor: string;
    textColor: string;
    sets: Set[];
}

export type Day = {
    day: string;
    stages: Stage[];
}