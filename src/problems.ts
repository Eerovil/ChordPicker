import { MainMusicParams } from "./params";
import { ChordChoice, ChordProblem } from "./utils";

export const getProblemsBetweenChords = (prevChord: ChordChoice, nextChord: ChordChoice, params: MainMusicParams) : ChordProblem => {
    const ret = {
        parallelFifths: 0,
        voiceDistance: 0,
        chordProgression: 0,
        dissonance: 0,
    }
    return ret;
};


export const getChordProblem = (chord: ChordChoice, params: MainMusicParams) : ChordProblem => {
    const ret = {
        parallelFifths: 0,
        voiceDistance: 0,
        chordProgression: 0,
        dissonance: 0,
    }
    return ret;
}