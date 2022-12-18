import { MainMusicParams } from "./params";
import { Chord, ChordChoice, chordTemplates } from "./utils";

export class ChordGenerator {
    private chordTypes: string[];
    private availableChords?: Array<string>;
    private usedChords?: Set<string>;

    constructor(params: MainMusicParams) {
        this.chordTypes = Object.keys(chordTemplates)
        this.usedChords = new Set();
        this.buildAvailableChords();
    };

    private buildAvailableChords() {
        if (!this.usedChords) {
            this.usedChords = new Set();
        }
        this.availableChords = (this.availableChords || []).filter(chord => !(this.usedChords || new Set()).has(chord));
        for (let i=0; i<100; i++) {
            const randomType = this.chordTypes[Math.floor(Math.random() * this.chordTypes.length)];
            const randomRoot = Math.floor(Math.random() * 12);
            if (!this.usedChords.has(randomRoot + randomType)) {
                this.availableChords.push(randomRoot + randomType);
            }
        }
    };

    public cleanUp() {
        if (this.usedChords) {
            this.usedChords.clear();
        }
        this.availableChords = [];
        delete this.usedChords;
        delete this.availableChords;
    }

    public getChord() {
        if (!this.availableChords || this.availableChords.length === 0) {
            this.buildAvailableChords();
        }
        let iterations = 0;
        while (true) {
            if (iterations++ > 10000) {
                return null;
            }
            if (this.availableChords && this.usedChords) {
                while (this.availableChords.length - 3 > 0) {
                    const chordType = this.availableChords[Math.floor(Math.random() * this.availableChords.length)];
                    if (!this.usedChords.has(chordType)) {
                        this.usedChords.add(chordType);
                        this.availableChords = this.availableChords.filter(chord => chord !== chordType);
                        return new Chord(chordType);
                    }
                }
            }
            this.buildAvailableChords();
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