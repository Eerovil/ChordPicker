import { Scale, Semitone } from "musictheoryjs";

import { MainMusicParams } from "./params";


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


export const startingNotes = (params: MainMusicParams) => {
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


export const RP = (degree: number, sharp?: number): RelativePitch => {
    return {
        degree,
        sharp: sharp || 0,
    }
}


export const chordTemplates: { [key: string]: Array<RelativePitch> } = {
    maj: [RP(0), RP(2), RP(4)],
    min: [RP(0), RP(2, -1), RP(4)],
    dim: [RP(0), RP(2, -1), RP(4, -1)],
    dim7: [RP(0), RP(2, -1), RP(4, -1), RP(5, 0)],
    aug: [RP(0), RP(2), RP(4, 1)],
    maj7: [RP(0), RP(2), RP(4), RP(6)],
    min7: [RP(0), RP(2, -1), RP(4), RP(6)],
    dom7: [RP(0), RP(2), RP(4), RP(6, -1)],
    sus2: [RP(0), RP(1), RP(4)],
    sus4: [RP(0), RP(3), RP(4)],
}

export class Note {
    public pitch: Pitch;
    public octave: number;

    constructor(passedPitch: Pitch | string, passedOctave?: number) {
        let pitch;
        let octave;
        if (typeof passedPitch == "string") {
            const parsedType = passedPitch.match(/^([A-G](?:#|b)*)(\d*)/);
            if (parsedType == null) {
                throw "Invalid note name " + passedPitch;
            }
            octave = parseInt(parsedType[2]);

            if (isNaN(octave)) {
                octave = passedOctave || 4;
            }
            pitch = pitchNameToPitch(parsedType[1]);
        } else {
            pitch = passedPitch;
            octave = passedOctave || 4;
        }
        this.pitch = pitch;
        this.octave = octave;
    }

    get semitone() {
        return pitchToSemitone(this.pitch)
    };
    set semitone(semitone: number) {
        debugger;
    };
    get globalSemitone() {
        return this.semitone + ((this.octave) * 12);
    };
    get gTone() {
        return this.globalSemitone;
    }
    public toString() {
        return pitchString(this.pitch) + "" + this.octave;
    }
    public pitchName() {
        return pitchString(this.pitch);
    }
    public copy() {
        return new Note(this.pitch, this.octave);
    }
    public valueOf() {
        // You can use this for direct comparison, yay
        return this.globalSemitone;
    }
}

export class Chord {
    public notes: Array<Note>;
    public root: Pitch;
    public chordType: string;
    public toString() {
        return pitchString(this.root) + this.chordType;
    }
    constructor(passedPitch: Pitch | string, chordType: string | undefined = undefined) {
        let pitch: Pitch;
        if (typeof passedPitch == "string") {
            const parsedType = passedPitch.match(/^(\w(#|b)?)(.*)/);
            if (parsedType == null) {
                throw "Invalid chord name " + passedPitch;
            }
            pitch = pitchNameToPitch(parsedType[0]);
            chordType = chordType || parsedType[1];
        } else {
            pitch = passedPitch;
        }
        this.root = pitch
        this.chordType = chordType || "?";
        const template = chordTemplates[this.chordType];
        if (template == undefined) {
            throw "Unknown chord type: " + chordType;
        }
        this.notes = [];
        for (let note of template) {
            this.notes.push(new Note(PitchPlusRP(this.root, note), 1));
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
    chord?: Chord,
    partIndex: number,
    scale: Scale,
    originalScale: Scale,
    beam?: string,
    tie?: string,
    tension: number,
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
export type MelodyNote = {
    note: string,
    duration: string,
    dotted: boolean,
    sharp: number,
    direction: number,
};
export type Melody = Array<MelodyNote>;


export type ChordProblem = {
    parallelFifths: number,
    voiceDistance: number,
    badInterval: number,
    chordProgression: number,
    dissonance: number,
    melody: number,
    overlapping: number,
}


export type ChordChoice = {
    name: string,
    numeral: string,
    inversion: number,
    doubling: Array<number>,
    prevProblem?: ChordProblem,
    nextProblem?: ChordProblem,
    selfProblem?: ChordProblem,
    totalScore?: number,
    chord?: Chord,
    notes?: Array<Note>,
    division?: number,
}

export type ChordChoicesByDivision = {
    [key: number]: ChordChoice,
}

export const totalChordScore = (chordChoice: ChordChoice, params: MainMusicParams) => {
    const { prevProblem, nextProblem, selfProblem } = chordChoice;
    chordChoice.totalScore = 0;
    if (prevProblem) {
        chordChoice.totalScore += prevProblem.voiceDistance;
        chordChoice.totalScore += prevProblem.badInterval * 3;
    }
    if (nextProblem) {
        chordChoice.totalScore += nextProblem.voiceDistance;
        chordChoice.totalScore += nextProblem.badInterval * 3;
    }
    if (selfProblem) {
        chordChoice.totalScore += selfProblem.dissonance;
        chordChoice.totalScore += selfProblem.melody;
        chordChoice.totalScore += selfProblem.overlapping * 10;
    }
    return chordChoice.totalScore;
}

export type Pitch = {
    degree: number,
    sharp: number,
}
export type RelativePitch = {
    degree: number,
    sharp: number,
}

export const relativePitchType = (rp: RelativePitch): string => {
    if ([0, 3, 4].includes(rp.degree)) {
        if (rp.sharp == 0) {
            return "perfect";
        }
        if (rp.sharp > 0) {
            return "augmented";
        }
        if (rp.sharp < 0) {
            return "diminished";
        }
    } else {
        if (rp.sharp == 0) {
            return "major";
        }
        if (rp.sharp > 0) {
            return "augmented";
        }
        if (rp.sharp == -1) {
            return "minor";
        }
        if (rp.sharp < -1) {
            return "diminished";
        }
    }
    debugger;
    throw "Invalid relative pitch";
}

export const PitchPlusRP = (pitch: Pitch, relativePitch: RelativePitch): Pitch => {
    // Relative pitches are not absolute, they are kind of like intervals (actually that's what they are)
    // This function returns the absolute pitch, when the interval `relativePitch` is added to `pitch`

    // Examples:
    // augmented unison up:
    // C flat (degree 0, sharp -1) + degree0sharp1 => C (degree 0, sharp 0)
    // augmented unison up:
    // C (degree 0, sharp 0) + degree0sharp1 => C sharp (degree 0, sharp 1)
    // augmented unison up:
    // C sharp (degree 0, sharp 1) + degree0sharp1 => C double sharp (degree 0, sharp 2)
    // minor second up:
    // C (degree 0, sharp 0) + degree1sharp-1 => D flat (degree 1, sharp -1)

    // Calculation is easy. Just add the degrees up and then add the sharps up.
    return {
        degree: (pitch.degree + relativePitch.degree) % 7,
        sharp: pitch.sharp + relativePitch.sharp,
    }
}

export const getRP = (pitch1: Pitch, pitch2: Pitch): RelativePitch => {
    return {
        degree: (pitch2.degree - pitch1.degree + 7) % 7,
        sharp: pitch2.sharp - pitch1.sharp,
    }
}

const degreeNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const pitchString = (pitch: Pitch) => {
    let ret = degreeNames[pitch.degree];
    if (pitch.sharp > 0) {
        ret += '#'.repeat(pitch.sharp);
    }
    else if (pitch.sharp < 0) {
        ret += 'b'.repeat(-pitch.sharp);
    }
    return ret;
}

export const allPitches = [
    { degree: 0, sharp: 0 },  // C
    { degree: 0, sharp: 1 },  // C#
    { degree: 1, sharp: -1 },  // Db
    { degree: 1, sharp: 0 },  // D
    { degree: 1, sharp: 1 },  // D#
    { degree: 2, sharp: -1 },  // Eb
    { degree: 2, sharp: 0 },  // E
    { degree: 2, sharp: 1 },  // E#
    { degree: 3, sharp: -1 },  // Fb
    { degree: 3, sharp: 0 },  // F
    { degree: 3, sharp: 1 },  // F#
    { degree: 4, sharp: -1 },  // Gb
    { degree: 4, sharp: 0 },  // G
    { degree: 4, sharp: 1 },  // G#
    { degree: 5, sharp: -1 },  // Ab
    { degree: 5, sharp: 0 },  // A
    { degree: 5, sharp: 1 },  // A#
    { degree: 6, sharp: -1 },  // Bb
    { degree: 6, sharp: 0 },  // B
    { degree: 6, sharp: 1 },  // B#
    { degree: 0, sharp: -1 },  // Cb
]

export const pitchNameToPitch = (name: string): Pitch => {
    const basename = name.replace(/\d/g, '');
    for (const pitch of allPitches) {
        if (pitchString(pitch) == basename) {
            return pitch;
        }
    }
    throw new Error(`Invalid pitch name: ${name}`);
}

export const pitchToSemitone = (pitch: Pitch): number => {
    return (pitch.degree * 2 + pitch.sharp) % 12;
}

export const nonEnharmonicPitch = (semitone: number, chord: Chord): Pitch => {
    // Given a semitone and a chord, return a degree (based on C) and a flatness/sharpness
    const ret = {
        degree: 0,
        sharp: 0,
    }

    return ret;
}
