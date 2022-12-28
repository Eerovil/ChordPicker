import { getScale, Scale } from "./musicclasses";
import { allPitches } from "./musictemplates";
import { ChordProblemType } from "./utils";

export class MainMusicParams {
    beatsPerBar: number = 4;
    tempo: number = 70;
    problemWeights: {[key in "self" | "next" | "prev"]: {[key in ChordProblemType]: number}} = {
        self:
        {
            'voiceDistance': 1,
            'badInterval': 1,
            'chordProgression': 1,
            'dissonance': 1,
            'melody': 1,
            'overlapping': 1,
            'doubling': 1,
            'chromaticism': 1,
            'resolution': 1,
        },
        next:
        {
            'voiceDistance': 1,
            'badInterval': 1,
            'chordProgression': 1,
            'dissonance': 1,
            'melody': 1,
            'overlapping': 1,
            'doubling': 1,
            'chromaticism': 1,
            'resolution': 1,
        },
        prev:
        {
            'voiceDistance': 1,
            'badInterval': 1,
            'chordProgression': 1,
            'dissonance': 1,
            'melody': 1,
            'overlapping': 1,
            'doubling': 1,
            'chromaticism': 1,
            'resolution': 1,
        },
    }

    parts: Array<{
        voice: string,
        note: string,
        volume: number,
    }> = [
            {
                voice: "41",
                note: "C5",
                volume: 10,
            },
            {
                voice: "41",
                note: "A4",
                volume: 7,
            },
            {
                voice: "42",
                note: "C4",
                volume: 7,
            },
            {
                voice: "43",
                note: "E3",
                volume: 10,
            }
        ];

    getScale(): Scale {
        return getScale(allPitches[0], 'major');
    }
}
