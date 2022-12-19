import { MainMusicParams } from "./params";
import { allPitches, Chord, ChordChoice, chordTemplates, Pitch } from "./utils";

export class ChordGenerator {
    private chordTypes: string[];
    private roots: Array<Pitch> = allPitches;
    private availableChords?: Array<string>;
    private usedChords?: Set<string>;

    constructor(params: MainMusicParams) {
        this.chordTypes = Object.keys(chordTemplates)
    };

    public *getChord(): Generator<Chord> {
        for (const root of this.roots) {
            for (const chordType of this.chordTypes) {
                const chord = new Chord(root, chordType);
                yield chord;
            }
        }
    }
}


export const chordInversionsAndDoublings = (chord: Chord): Array<ChordChoice> => {
    const ret: Array<ChordChoice> = [];
    if (chord.notes.length == 3) {
        for (const inversion of [0, 1, 2]) {
            for (const doubling of [[0, 0, 1, 2], [0, 1, 1, 2], [0, 1, 2, 2], [0, 0, 1, 1], [0, 0, 0, 1]]) {
                ret.push({
                    name: chord.toString(),
                    numeral: '',
                    inversion,
                    doubling,
                    chord,
                });
            }
        }
    } else if (chord.notes.length == 4) {
        for (const inversion of [0, 1, 2, 3]) {
            for (const doubling of [[0, 1, 2, 3], [0, 0, 1, 3], [0, 1, 1, 3]]) {
                ret.push({
                    name: chord.toString(),
                    numeral: '',
                    inversion,
                    doubling,
                    chord,
                });
            }
        }
    }
    return ret;
}