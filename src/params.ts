import { Scale } from "./musicclasses";
import { allPitches } from "./musictemplates";

export class MainMusicParams {
    beatsPerBar: number = 4;
    tempo: number = 70;

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
        return new Scale(allPitches[0], 'major');
    }
}
