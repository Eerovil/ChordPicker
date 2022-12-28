import { MainMusicParams } from "./params";

import { Chord, Note, Pitch, RelativePitch, Scale } from "./musicclasses";
import { allPitches, defaultDegreeNames, degreeToSemitone, pitchesBySemitone } from "./musictemplates";

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
    // tone1 : 5  tone2: 6 -> distance = 1; -> reversed = -11;  -> Result is 1
    // tone1 : 11 tone2: 0 -> distance = -11; -> reversed = 1;  -> Result is 1

    // tone1: 6 tone2: 5   -> distance = -1; -> reversed = 11;   -> Result is -1
    // tone1: 0 tone2: 11  -> distance = 11; -> reversed = -1;   -> Result is -1

    // tone1: 4 tone2: 6   -> distance = 2;  -> reversed = -10   -> Result is 2

    const distance = (tone2 % 12) - (tone1 % 12);
    const reversed = (12 - Math.abs(distance)) * (distance > 0 ? -1 : 1);
    if (Math.abs(distance) < Math.abs(reversed)) {
        return distance;
    }
    return reversed;
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

export type ChordProblemType = "voiceDistance" | "badInterval" | "chordProgression" | "dissonance" | "melody" | "overlapping" | "doubling" | "chromaticism";

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
        chromaticism: [],
    }
    notes: Array<Note> = [];
    public getScore(slug: ChordProblemType) {
        let score = 0;
        for (const problem of this.problems[slug]) {
            score += problem.value;
        }
        return score;
    }
    public totalScore(weights: { [key in ChordProblemType]: number }) {
        let score = 0;
        const handledProblems = new Set();

        // voice distance is a bit special
        if (this.problems.voiceDistance.length > 0) {
            for (const problem of this.problems.voiceDistance) {
                const slug = problem.slug || "";
                if (slug == 'part0Distance') {
                    // This means that melody is not given.
                    // Still, jumps in the melody are quite OK
                    score += problem.value * weights.voiceDistance;
                } else if (['part1Distance', 'part2Distance'].includes(slug)) {
                    // Inner voices shouldn't jump too much
                    if (problem.value <= 2) {
                        // Step wise motion is OK
                        score += problem.value * weights.voiceDistance;
                    } else {
                        score += problem.value * 3 * weights.voiceDistance;
                    }
                } else if (['part3Distance'].includes(slug)) {
                    // Bass can jump around
                    score += problem.value * weights.voiceDistance;
                }
            }
            handledProblems.add("voiceDistance");
        }

        for (const key in this.problems) {
            if (handledProblems.has(key)) {
                continue;
            }
            score += this.getScore(key as ChordProblemType) * weights[key as ChordProblemType];
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


export const chordChoiceTotalScore = (choice: ChordChoice, params: MainMusicParams): number => {
    let totalScore = 0;
    totalScore += choice.prevProblem?.totalScore(params.problemWeights.prev) || 0;
    totalScore += choice.nextProblem?.totalScore(params.problemWeights.next) || 0;
    totalScore += choice.selfProblem?.totalScore(params.problemWeights.self) || 0;
    return totalScore;
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

export const relativePitchName = (rp: RelativePitch): string => {
    const degree = rp.degree % 7;
    const degreeName = ["unison", "second", "third", "fourth", "fifth", "sixth", "seventh"][degree];
    if ([0,3,4].includes(degree)) {
        if (rp.sharp == 0) {
            return "perfect " + degreeName;
        }
        if (rp.sharp == 1) {
            return "augmented " + degreeName;
        }
        if (rp.sharp == -1) {
            return "diminished " + degreeName;
        }
        return rp.sharp + " " + degreeName;
    }
    if (rp.sharp == 0) {
        return "major " + degreeName;
    }
    if (rp.sharp == 1) {
        return "augmented " + degreeName;
    }
    if (rp.sharp == -1) {
        return "minor " + degreeName;
    }
    if (rp.sharp == -2) {
        return "diminished " + degreeName;
    }
    return rp.sharp + " " + degreeName;
}

export const enharmonicPitch = (pitch: Pitch, scale: Scale | undefined = undefined): Pitch => {
    // This function returns the enharmonic equivalent of the given, if it can be made simpler.
    // For example, C double sharp is the same as D.
    if (!scale) {
        if (Math.abs(pitch.sharp) < 2) {
            return pitch;
        }
    }
    const semitone = pitchToSemitone(pitch) % 12;
    if (scale) {
        for (const pitch of scale.pitches) {
            if (pitchToSemitone(pitch) % 12 == semitone) {
                return pitch;
            }
        }
    }
    return pitchesBySemitone[semitone];
}



export const PitchPlusRP = (pitch: Pitch, relativePitch: RelativePitch, plus: boolean = true): Pitch => {
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

    if (!pitch) {
        throw new Error("No pitch")
    }
    if (!relativePitch) {
        throw new Error("No relativePitch")
    }

    const originSemitone = pitchToSemitone(pitch);
    const intervalInSemitones = pitchToSemitone(relativePitch)
    let ret;

    if (plus) {
        const targetSemitone = (originSemitone + intervalInSemitones) % 12;

        ret = {
            degree: (pitch.degree + relativePitch.degree) % 7,
            sharp: pitch.sharp,
        }

        ret.sharp += semitoneDistance(pitchToSemitone(ret), targetSemitone)
    } else {
        const targetSemitone = (originSemitone - intervalInSemitones + 24) % 12;

        ret = {
            degree: (pitch.degree - relativePitch.degree + 14) % 7,
            sharp: pitch.sharp,
        }

        ret.sharp += semitoneDistance(pitchToSemitone(ret), targetSemitone)
    }

    if (ret.sharp > 3 || ret.sharp < -3) {
        try {
            // Code throwing an exception
            throw new Error("Invalid pitch, too many sharps or flats: " + JSON.stringify(ret) + " " + JSON.stringify(pitch) + " " + JSON.stringify(relativePitch));
        } catch(e) {
            console.log(e.stack);
            debugger;
        }
        throw new Error("Invalid pitch, too many sharps or flats: " + JSON.stringify(ret));
    }

    return ret;
}

export const getRP = (pitch1: Pitch, pitch2: Pitch): RelativePitch => {
    const semitone1 = pitchToSemitone(pitch1);
    let semitone2 = pitchToSemitone(pitch2);
    if (semitone2 < semitone1) {
        semitone2 += 12;
    }
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

export const equalPitch = (pitch1: Pitch, pitch2: Pitch): boolean => {
    return pitch1.degree == pitch2.degree && pitch1.sharp == pitch2.sharp;
}

export const anyChromaticNotes = (notes: Array<Note>, scale: Scale) => {
    for (const note of notes) {
        let good = false;
        for (const pitch of scale.pitches) {
            if (equalPitch(note.pitch, pitch)) {
                good = true;
            }
        }
        if (!good) {
            return true;
        }
    }
    return false;
}
