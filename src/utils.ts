import { MainMusicParams } from "./params";

import { Chord, Note, Pitch, RelativePitch, Scale } from "./musicclasses";
import { allPitches, defaultDegreeNames, degreeToSemitone } from "./musictemplates";

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


export type MelodyNote = {
    note: string,
    duration: string,
    dotted: boolean,
    sharp: number,
    direction: number,
};
export type Melody = Array<MelodyNote>;

export type ChordProblemType = "voiceDistance" | "badInterval" | "chordProgression" | "dissonance" | "melody" | "overlapping" | "doubling";

export type ChordProblemValue = {
    type: ChordProblemType,
    slug?: string,
    value: number,
    comment: string,
}


export class ChordProblem {
    problems: { [key in ChordProblemType]: Array<ChordProblemValue> } = {
        voiceDistance: [],
        badInterval: [],
        chordProgression: [],
        dissonance: [],
        melody: [],
        overlapping: [],
        doubling: [],
    }
    notes: Array<Note> = [];
    public getScore(slug: ChordProblemType) {
        let score = 0;
        for (const problem of this.problems[slug]) {
            score += problem.value;
        }
        return score;
    }
    get totalScore() {
        let score = 0;
        const handledProblems = new Set();

        // voice distance is a bit special
        if (this.problems.voiceDistance.length > 0) {
            for (const problem of this.problems.voiceDistance) {
                const slug = problem.slug || "";
                if (slug == 'part0Distance') {
                    // This means that melody is not given.
                    // Still, jumps in the melody are quite OK
                    score += problem.value;
                } else if (['part1Distance', 'part2Distance'].includes(slug)) {
                    // Inner voices shouldn't jump too much
                    if (problem.value <= 2) {
                        // Step wise motion is OK
                        score += problem.value;
                    } else {
                        score += problem.value * 3;
                    }
                } else if (['part3Distance'].includes(slug)) {
                    // Bass can jump around
                    score += problem.value;
                }
            }
            handledProblems.add("voiceDistance");
        }

        for (const key in this.problems) {
            if (handledProblems.has(key)) {
                continue;
            }
            score += this.getScore(key as ChordProblemType);
        }
        return score;
    }
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

    // D (degree 1, sharp 0) + degree2sharp0 => F sharp (degree 2, sharp 1)
    // Db (degree 1, sharp -1) + degree2sharp0 => F (degree 2, sharp 0)
    // Db (degree 1, sharp -1) + degree4sharp0 => Ab (degree 4, sharp -1)

    // Calculation is NOT easy. 
    // X + degree2sharp0
    // First check what it would be in C major: an E natural.
    // Then we add the distance the the given X. E + X == Result.
    
    // Example: E + degree1sharp0 should be F sharp, so I guess we must use semitones.

    // In the case of major third from D, we first check that a major third (`intervalInSemitones`) is 4 semitones.
    // Then we add two degrees to `pitch` (that is `ret`) and see how far that is from the wanted semitone distance.
    // Add sharps to get the correct semitone distance

    const originSemitone = pitchToSemitone(pitch);
    const intervalInSemitones = pitchToSemitone(relativePitch)
    const targetSemitone = (originSemitone + intervalInSemitones) % 12;

    let ret = {
        degree: (pitch.degree + relativePitch.degree) % 7,
        sharp: pitch.sharp,
    }

    ret.sharp += targetSemitone - pitchToSemitone(ret)

    return ret;
}

export const getRP = (pitch1: Pitch, pitch2: Pitch): RelativePitch => {
    const semitone1 = pitchToSemitone(pitch1);
    const semitone2 = pitchToSemitone(pitch2);
    let ret = {
        degree: (pitch2.degree - pitch1.degree + 7) % 7,
        sharp: pitch2.sharp,
    }
    ret.sharp += (semitone2 - semitone1) - pitchToSemitone(ret)

    return ret;
}

export const pitchString = (pitch: Pitch) => {
    let ret = defaultDegreeNames[pitch.degree];
    if (pitch.sharp > 0) {
        ret += '#'.repeat(pitch.sharp);
    }
    else if (pitch.sharp < 0) {
        ret += 'b'.repeat(-pitch.sharp);
    }
    return ret;
}


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
    return (degreeToSemitone[pitch.degree] + pitch.sharp) % 12;
}

export const nonEnharmonicPitch = (semitone: number, chord: Chord): Pitch => {
    // Given a semitone and a chord, return a degree (based on C) and a flatness/sharpness
    const ret = {
        degree: 0,
        sharp: 0,
    }

    return ret;
}

export const equalPitch = (pitch1: Pitch, pitch2: Pitch): boolean => {
    return pitch1.degree == pitch2.degree && pitch1.sharp == pitch2.sharp;
}
