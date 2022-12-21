import { MainMusicParams } from "./params";
import { DivisionedRichnotes } from "./utils";

export const cleanDivisionedNotes = (divisionedNotes: DivisionedRichnotes, params: MainMusicParams) => {
    // Make sure there are no empty spaces in the divisioned notes
    let division = 0;
    let lastDivision = 0;
    for (const tmpDiv in divisionedNotes) {
        lastDivision = Math.max(lastDivision, parseInt(tmpDiv));
    }
    // Handle division 0 manually
    const firstDivision = divisionedNotes[0] || [];
    let prevRichNotes = [
        firstDivision.filter(rn => rn.partIndex == 0)[0],
        firstDivision.filter(rn => rn.partIndex == 1)[0],
        firstDivision.filter(rn => rn.partIndex == 2)[0],
        firstDivision.filter(rn => rn.partIndex == 3)[0],
    ];
    let prevDivisions = [
        0, 0, 0, 0
    ]

    for (division = 1; division <= lastDivision; division++) {
        const richNotes = divisionedNotes[division] || [];
        const newRichNotes = [
            richNotes.filter(rn => rn.partIndex == 0)[0],
            richNotes.filter(rn => rn.partIndex == 1)[0],
            richNotes.filter(rn => rn.partIndex == 2)[0],
            richNotes.filter(rn => rn.partIndex == 3)[0],
        ];
        for (let partIndex = 0; partIndex < 4; partIndex++) {
            if (newRichNotes[partIndex] == undefined) {
                continue;
            }
            // Make sure that the previous note for this part has enough duration
            if (prevRichNotes[partIndex] != undefined) {
                const prevNote = prevRichNotes[partIndex];
                prevNote.duration = division - prevDivisions[partIndex];
            }
            prevDivisions[partIndex] = division;
            prevRichNotes[partIndex] = newRichNotes[partIndex];
        }
    }
}
