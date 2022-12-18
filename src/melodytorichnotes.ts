import { Note } from "musictheoryjs";
import { MainMusicParams } from "./params";
import { Chord, DivisionedRichnotes, globalSemitone, Melody, MelodyNote, startingNotes } from "./utils";
import { BEAT_LENGTH } from "./utils";

export const melodyToRichNotes = (melody: Melody, disivionedRichNotes: DivisionedRichnotes, params: MainMusicParams) => {
    const getDuration = (note: MelodyNote) => {
        let ret = 0;
        if (note.duration == 'q') {
            ret = BEAT_LENGTH * 1;
        }
        if (note.duration == 'h') {
            ret = BEAT_LENGTH * 2;
        }
        if (note.duration == 'w') {
            ret = BEAT_LENGTH * 4;
        }
        if (note.duration == 'e') {
            ret = BEAT_LENGTH / 2;
        }
        if (note.duration == 's') {
            ret = BEAT_LENGTH / 4;
        }
        if (note.dotted) {
            ret *= 1.5;
        }
        return ret;
    }
    const { startingGlobalSemitones, semitoneLimits } = startingNotes(params);
    const getNote = (note: MelodyNote, prevGTone: number | null) => {
        let noteName = note.note;
        if (note.sharp == -1) {
            noteName += 'b';
        }
        if (note.sharp == 1) {
            noteName += '#';
        }
        const newNote = new Note(noteName);
        let newGTone = globalSemitone(newNote);
        if (prevGTone && note.direction != 0) {
            if (note.direction == 1) {
                while (newGTone <= prevGTone) {
                    newGTone += 12;
                    newNote.octave += 1;
                }
            }
            if (note.direction == -1) {
                while (newGTone >= prevGTone) {
                    newGTone -= 12;
                    newNote.octave -= 1;
                }
            }
        }
        while (newGTone < semitoneLimits[0][0]) {
            newGTone += 12;
            newNote.octave += 1;
        }
        while (newGTone > semitoneLimits[0][1]) {
            newGTone -= 12;
            newNote.octave -= 1;
        }
        return newNote;
    }
    const scale = params.getScale();

    let currentDivision = 0;
    let prevGTone = null;

    for (const melodyNote of melody) {
        const duration = getDuration(melodyNote);
        const note = getNote(melodyNote, prevGTone || startingGlobalSemitones[0]);
        prevGTone = globalSemitone(note);
        disivionedRichNotes[currentDivision] = disivionedRichNotes[currentDivision] || [];
        disivionedRichNotes[currentDivision].push({
            note,
            duration,
            scale,
            originalScale: scale,
            tension: 0,
            partIndex: 0,
            chord: new Chord(0, 'maj'),
        });
        currentDivision += duration;
    }
}
