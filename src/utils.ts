import { Note, Scale, Semitone } from "musictheoryjs";
import { Logger } from "./mylogger";
import { MainMusicParams, MusicParams } from "./params";
import { Tension } from "./tension";

export const BEAT_LENGTH = 12;

type PickNullable<T> = {
    [P in keyof T as null extends T[P] ? P : never]: T[P]
}

type PickNotNullable<T> = {
    [P in keyof T as null extends T[P] ? never : P]: T[P]
}

export type OptionalNullable<T> = {
    [K in keyof PickNullable<T>]?: Exclude<T[K], null>
} & {
        [K in keyof PickNotNullable<T>]: T[K]
    }


export const semitoneDistance = (tone1: number, tone2: number) => {
    // distance from 0 to 11 should be 1
    // 0 - 11 + 12 => 1
    // 11 - 0 + 12 => 23 => 11

    // 0 - 6 + 12 => 6
    // 6 - 0 + 12 => 18 => 6

    // 0 + 6 - 3 + 6 = 6 - 9 = -3
    // 6 + 6 - 9 + 6 = 12 - 15 = 0 - 3 = -3
    // 11 + 6 - 0 + 6 = 17 - 6 = 5 - 6 = -1
    // 0 + 6 - 11 + 6 = 6 - 17 = 6 - 5 = 1

    // (6 + 6) % 12 = 0
    // (5 + 6) % 12 = 11
    // Result = 11!!!!

    return Math.min(
        Math.abs(tone1 - tone2),
        Math.abs((tone1 + 6) % 12 - (tone2 + 6) % 12)
    );
}

export const semitoneScaleIndex = (scale: Scale): { [key: number]: number } => ({
    [scale.notes[0].semitone]: 0,
    [scale.notes[1].semitone]: 1,
    [scale.notes[2].semitone]: 2,
    [scale.notes[3].semitone]: 3,
    [scale.notes[4].semitone]: 4,
    [scale.notes[5].semitone]: 5,
    [scale.notes[6].semitone]: 6,
})


export const nextGToneInScale = (gTone: Semitone, indexDiff: number, scale: Scale): Nullable<number> => {
    let gTone1 = gTone;
    const scaleIndexes = semitoneScaleIndex(scale)
    let scaleIndex = scaleIndexes[gTone1 % 12];
    if (!scaleIndex) {
        gTone1 = gTone + 1;
        scaleIndex = scaleIndexes[gTone1 % 12];
    }
    if (!scaleIndex) {
        gTone1 = gTone - 1;
        scaleIndex = scaleIndexes[gTone1 % 12];
    }
    if (!scaleIndex) {
        return null;
    }
    const newScaleIndex = (scaleIndex + indexDiff) % 7;
    const newSemitone = scale.notes[newScaleIndex].semitone;
    const distance = semitoneDistance(gTone1 % 12, newSemitone);
    const newGtone = gTone1 + (distance * (indexDiff > 0 ? 1 : -1));

    return newGtone;
}


export const startingNotes = (params: MusicParams) => {
    const p1Note = params.parts[0].note || "F4";
    const p2Note = params.parts[1].note || "C4";
    const p3Note = params.parts[2].note || "A3";
    const p4Note = params.parts[3].note || "C3";

    const startingGlobalSemitones = [
        globalSemitone(new Note(p1Note)),
        globalSemitone(new Note(p2Note)),
        globalSemitone(new Note(p3Note)),
        globalSemitone(new Note(p4Note)),
    ]

    const semitoneLimits = [
        [startingGlobalSemitones[0] + -12, startingGlobalSemitones[0] + 12 - 5],
        [startingGlobalSemitones[1] + -12, startingGlobalSemitones[1] + 12 - 5],
        [startingGlobalSemitones[2] + -12, startingGlobalSemitones[2] + 12 - 5],
        [startingGlobalSemitones[3] + -12, startingGlobalSemitones[3] + 12 - 5],
    ]
    return {
        startingGlobalSemitones,
        semitoneLimits,
    }
}


const mySemitoneStrings: {[key: number]: string} = {
    0: "C",
    1: "C#",
    2: "D",
    3: "D#",
    4: "E",
    5: "F",
    6: "F#",
    7: "G",
    8: "G#",
    9: "A",
    10: "A#",
    11: "B",
}


export const gToneString = (gTone: number | null): string => {
    if (!gTone) {
        return "null";
    }
    return `${mySemitoneStrings[gTone % 12]}${Math.floor(gTone / 12)}`;
}


export const arrayOrderBy = function (array: Array<any>, selector: CallableFunction, desc = false) {
    return [...array].sort((a, b) => {
        a = selector(a);
        b = selector(b);

        if (a == b) return 0;
        return (desc ? a > b : a < b) ? -1 : 1;
    });
}


export const chordTemplates: { [key: string]: Array<number> } = {
    maj: [0, 4, 7],
    min: [0, 3, 7],
    dim: [0, 3, 6],
    dim7: [0, 3, 6, 10],
    aug: [0, 4, 8],
    maj7: [0, 4, 7, 11],
    min7: [0, 3, 7, 10],
    dom7: [0, 4, 7, 10],
    sus2: [0, 2, 7],
    sus4: [0, 5, 7],
}


export class Chord {
    public notes: Array<Note>;
    public root: number;
    public chordType: string;
    public toString() {
        // Find correct Semitone key
        const semitoneKeys = Object.keys(Semitone).filter(key => (Semitone as any)[key] as number === this.notes[0].semitone);
        if (semitoneKeys.length == 0) {
            return this.notes.map(note => note.toString()).join(", ");
        }
        let semitoneKey = semitoneKeys.filter(key => key.indexOf('b') == -1 && key.indexOf('s') == -1)[0] || semitoneKeys[0];
        semitoneKey = semitoneKey.replace('s', '#');
        return semitoneKey + this.chordType;
    }
    constructor(semitoneOrName: number | string, chordType: string | undefined = undefined) {
        let semitone;
        if (typeof semitoneOrName === "string") {
            semitone = semitoneOrName.match(/^\d+/);
            const parsedType = semitoneOrName.match(/^\d+(.*)/);
            if (semitone == null) {
                throw "Invalid chord name " + semitoneOrName;
            }
            if (parsedType == null) {
                throw "Invalid chord name " + semitoneOrName;
            }
            semitone = parseInt(semitone[0]);
            chordType = chordType || parsedType[1];
        } else {
            semitone = semitoneOrName;
        }
        this.root = parseInt(`${semitone}`);
        this.chordType = chordType || "?";
        const template = chordTemplates[this.chordType];
        if (template == undefined) {
            throw "Unknown chord type: " + chordType;
        }
        this.notes = [];
        for (let note of template) {
            this.notes.push(new Note({ semitone: (semitone + note) % 12, octave: 1 }));
        }
    }
}


export type Nullable<T> = T | null | undefined;

export type MusicResult = {
    chord: Chord,
    tension: number,
    scale: Scale,
}

export type RichNote = {
    note: Note,
    originalNote?: Note,
    duration: number,
    freq?: number,
    chord: Chord,
    partIndex: number,
    scale: Scale,
    originalScale: Scale,
    beam?: string,
    tie?: string,
    tension: Tension,
    inversionName?: string,
}

export type DivisionedRichnotes = {
    [key: number]: Array<RichNote>,
}

export const globalSemitone = (note: Note) => {
    return note.semitone + ((note.octave) * 12);
}

export const getClosestOctave = (note: Note, targetNote: Nullable<Note> = null, targetSemitone: Nullable<number> = null) => {
    let semitone = globalSemitone(note);
    if (!targetNote && !targetSemitone) {
        throw new Error("No target note or semitone provided");
    }
    targetSemitone = targetSemitone || globalSemitone(targetNote as Note);
    console.log("Closest octave: ", semitone, targetSemitone);
    // Using modulo here -> -7 % 12 = -7
    // -13 % 12 = -1
    if (semitone == targetSemitone) {
        return note.octave;
    }
    const delta: number = targetSemitone > semitone ? 12 : -12;
    let ret = 0;
    let i = 0;
    const cleanOctave = (octave: number) => {
        return Math.min(Math.max(octave, 2), 6);
    }
    while (true) {
        i++;
        if (i > 1000) {
            throw new Error("Infinite loop");
        }
        semitone += delta;
        ret += delta / 12;  // How many octaves we changed
        if (delta > 0) {
            if (semitone >= targetSemitone) {
                if (Math.abs(semitone - targetSemitone) > Math.abs(semitone - 12 - targetSemitone)) {
                    // We went too far, go one back
                    ret -= 1;
                }
                console.log("Closest octave res: ", cleanOctave(note.octave + ret), ret);
                return cleanOctave(note.octave + ret);
            }
        }
        else {
            if (semitone <= targetSemitone) {
                if (Math.abs(semitone - targetSemitone) > Math.abs(semitone + 12 - targetSemitone)) {
                    // We went too far, go one back
                    ret += 1;
                }
                console.log("Closest octave res: ", cleanOctave(note.octave + ret), ret);
                return cleanOctave(note.octave + ret);
            }
        }
    }
}

export const majScaleCircle: { [key: number]: Array<number> } = {}
majScaleCircle[Semitone.C] = [Semitone.G, Semitone.F]
majScaleCircle[Semitone.G] = [Semitone.D, Semitone.C]
majScaleCircle[Semitone.D] = [Semitone.A, Semitone.G]
majScaleCircle[Semitone.A] = [Semitone.E, Semitone.D]
majScaleCircle[Semitone.E] = [Semitone.B, Semitone.A]
majScaleCircle[Semitone.B] = [Semitone.Fs, Semitone.E]

majScaleCircle[Semitone.F] = [Semitone.C, Semitone.Bb]
majScaleCircle[Semitone.Bb] = [Semitone.F, Semitone.Eb]
majScaleCircle[Semitone.Eb] = [Semitone.Bb, Semitone.Ab]
majScaleCircle[Semitone.Ab] = [Semitone.Eb, Semitone.Db]
majScaleCircle[Semitone.Db] = [Semitone.Ab, Semitone.Gb]
majScaleCircle[Semitone.Gb] = [Semitone.Db, Semitone.Cb]
majScaleCircle[Semitone.Cb] = [Semitone.Gb, Semitone.Fb]


export const majScaleDifference = (semitone1: number, semitone2: number) => {
    // Given two major scales, return how closely related they are
    // 0 = same scale
    // 1 = E.G. C and F or C and G
    let currentVal = majScaleCircle[semitone1];
    if (semitone1 == semitone2) {
        return 0;
    }
    for (let i = 0; i < 12; i++) {
        if (currentVal.includes(semitone2)) {
            return i + 1;
        }
        const newCurrentVal = new Set();
        for (const semitone of currentVal) {
            for (const newSemitone of majScaleCircle[semitone]) {
                newCurrentVal.add(newSemitone);
            }
        }
        currentVal = [...newCurrentVal] as Array<number>;
    }
    return 12;
}

export const getRichNote = (divisionedNotes: DivisionedRichnotes, division: number, partIndex: number): RichNote | null => {
    if (division in divisionedNotes) {
        for (const note of divisionedNotes[division]) {
            if (note.partIndex == partIndex) {
                return note;
            }
        }
    }
    return null;
}


export function getRhythmNeededDurations(mainParams: MainMusicParams) {
    const melodyRhythmString = mainParams.melodyRhythm;
    // Figure out what needs to happen each beat to get our melody
    let rhythmDivision = 0;
    const rhythmNeededDurations: { [key: number]: number; } = {};
    for (let i = 0; i < melodyRhythmString.length; i++) {
        const rhythm = melodyRhythmString[i];
        if (rhythm == "W") {
            rhythmNeededDurations[rhythmDivision] = BEAT_LENGTH * 4;
            rhythmDivision += BEAT_LENGTH * 4;
            // TODO
        } else if (rhythm == "H") {
            rhythmNeededDurations[rhythmDivision] = BEAT_LENGTH * 2;
            rhythmDivision += BEAT_LENGTH * 2;
            // TODO
        } else if (rhythm == "Q") {
            rhythmNeededDurations[rhythmDivision] = BEAT_LENGTH;
            rhythmDivision += BEAT_LENGTH;
            continue; // Nothing to do
        } else if (rhythm == "E") {
            // This division needs to be converted to Eighth
            rhythmNeededDurations[rhythmDivision] = BEAT_LENGTH / 2;
            rhythmDivision += BEAT_LENGTH / 2;
        } else if (rhythm == "S") {
            // This division needs to be converted to Sixteenth
            rhythmNeededDurations[rhythmDivision] = BEAT_LENGTH / 4;
            rhythmDivision += BEAT_LENGTH / 4;
        }
    }
    return rhythmNeededDurations;
}


export type MelodyNeededTone = {
    [key: number]: {
        tone: number,
        duration: number,
    }
}



export function getMelodyNeededTones(mainParams: MainMusicParams): MelodyNeededTone {
    const rhythmNeededDurations = getRhythmNeededDurations(mainParams);
    const forcedMelodyArray = mainParams.forcedMelody || "";
    const ret: MelodyNeededTone = {};
    // Figure out what needs to happen each beat to get our melody
    let counter = -1;
    for (const division in rhythmNeededDurations) {
        counter++;
        const divisionNum = parseInt(division);
        ret[divisionNum] = {
            "duration": rhythmNeededDurations[divisionNum],
            "tone": forcedMelodyArray[counter],
        }
    }
    return ret;
}

