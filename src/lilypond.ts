import { DivisionedRichnotes } from "./utils";
import { Note, Scale } from "./musicclasses";
import { allPitchesByName } from "./musictemplates";

const degreeNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const parseLilyPondString = (lilyPondString: string, divisionedNotes: DivisionedRichnotes | undefined = undefined): DivisionedRichnotes => {
    divisionedNotes = divisionedNotes || {};
    const notes = lilyPondString.split(' ');
    let division = 0;
    let currentDuration = 12; // 1/4
    for (const lilyNote of notes) {
        if (lilyNote === '|') {
            division += currentDuration;
            continue;
        }
        const matchResult = lilyNote.match(/([a-zA-Z]+)([',]*)(\d*)(\.*)/);
        if (!matchResult) {
            console.log("Can't parse lilypond note: " + lilyNote);
            continue;
        }
        const [, noteName, octaveName, durationName, dottedName ] = matchResult;
        const baseNote = noteName[0].toUpperCase();
        const pitch = {degree: degreeNames.indexOf(baseNote.toUpperCase()), sharp: 0};
        let octave = 4;
        if (noteName.includes('is')) {
            pitch.sharp = 1;
            if (noteName.includes('isis')) {
                pitch.sharp = 2;
            }
        }
        if (noteName.includes('es')) {
            pitch.sharp = -1;
            if (noteName.includes('eses')) {
                pitch.sharp = -2;
            }
        }

        if (octaveName) {
            if (octaveName.includes(',')) {
                octave -= 1;
                if (octaveName.includes(','.repeat(2))) {
                    octave -= 1;
                    if (octaveName.includes(','.repeat(3))) {
                        octave -= 1;
                        if (octaveName.includes(','.repeat(4))) {
                            octave -= 1;
                        }
                    }
                }
            }
            if (octaveName.includes("'")) {
                octave += 1;
                if (octaveName.includes("'".repeat(2))) {
                    octave += 1;
                    if (octaveName.includes("'".repeat(3))) {
                        octave += 1;
                        if (octaveName.includes("'".repeat(4))) {
                            octave += 1;
                        }
                    }
                }
            }
        }

        if (durationName) {
            currentDuration = (12 * 4) / parseInt(durationName);
        }

        if (dottedName) {
            if (dottedName.length === 1) {
                currentDuration += currentDuration / 2;
            } else if (dottedName.length === 2) {
                currentDuration += currentDuration / 2;
                currentDuration += currentDuration / 4;
            }
        }

        const note = new Note(pitch, octave);

        divisionedNotes[division] = divisionedNotes[division] || [];
        divisionedNotes[division].push({
            note,
            duration: currentDuration,
            scale: new Scale(allPitchesByName['C'], 'major'),
            originalScale: new Scale(allPitchesByName['C'], 'major'),
            tension: 0,
            partIndex: 0,
        });
        division += currentDuration;
    }
    return divisionedNotes;
}