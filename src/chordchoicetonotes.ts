import { Scale } from "musictheoryjs";
import { MainMusicParams } from "./params"
import { BEAT_LENGTH, ChordChoice, DivisionedRichnotes, globalSemitone, startingNotes } from "./utils"

export const chordChoiceToDivisionedNotes = (chordChoice: ChordChoice, division: number, divisionedNotes: DivisionedRichnotes, params: MainMusicParams) => {
    const chord = chordChoice.chord;
    if (!chord) {
        return;
    }
    const { startingGlobalSemitones, semitoneLimits } = startingNotes(params);

    const inversion = chordChoice.inversion;
    const doubling = chordChoice.doubling;
    const bassNote = chord.notes[inversion];
    let previousNotes = null;

    for (let i = division - 1; i >= 0; i--) {
        if (divisionedNotes[i]) {
            previousNotes = divisionedNotes[i];
            const maxDuration = division - i;
            for (const richNote of previousNotes) {
                if (richNote.duration > maxDuration) {
                    richNote.duration = maxDuration;
                }
            }
            break;
        }
    }

    let prevPart1Note = null;
    let prevPart2Note = null;
    let prevPart3Note = null;
    if (previousNotes) {
        prevPart1Note = previousNotes.find((note) => note.partIndex == 1);
        prevPart2Note = previousNotes.find((note) => note.partIndex == 2);
        prevPart3Note = previousNotes.find((note) => note.partIndex == 3);
    }

    // Use lowest possible gTone for part 3
    while (globalSemitone(bassNote) < semitoneLimits[3][0]) {
        bassNote.octave += 1;
    }

    divisionedNotes[division] = divisionedNotes[division] || [];
    divisionedNotes[division].push({
        note: bassNote,
        duration: BEAT_LENGTH * 2,
        partIndex: 3,
        chord: chord,
        scale: new Scale('Cmaj'),
        originalScale: new Scale('Cmaj'),
        tension: 0,
    })

    // Find out the notes that we need
    let notesLeft = [...doubling];
    notesLeft.splice(notesLeft.indexOf(inversion), 1)  // Bass note is already added
    let melodyNote = divisionedNotes[division].filter((note) => note.partIndex == 0)[0];
    const chordSemitones = chord.notes.map((note) => note.semitone);
    if (melodyNote && chordSemitones.includes(melodyNote.note.semitone)) {
        const melodyNoteChordIndex = chordSemitones.indexOf(melodyNote.note.semitone);
        notesLeft.splice(notesLeft.indexOf(melodyNoteChordIndex), 1);
    }

    // We should be left with 2 notes. If 3, lets remove number 2 if it exists
    if (notesLeft.length == 3 && notesLeft.indexOf(2) >= 0) {
        notesLeft.splice(notesLeft.indexOf(2), 1);
    }

    // Try all combinations
    let permutations = [[notesLeft[0], notesLeft[1]], [notesLeft[1], notesLeft[0]]];
    if (notesLeft.length == 3) {
        permutations = [
            [notesLeft[0], notesLeft[1], notesLeft[2]],
            [notesLeft[0], notesLeft[2], notesLeft[1]],
            [notesLeft[1], notesLeft[0], notesLeft[2]],
            [notesLeft[1], notesLeft[2], notesLeft[0]],
            [notesLeft[2], notesLeft[0], notesLeft[1]],
            [notesLeft[2], notesLeft[1], notesLeft[0]],
        ]
    }

    let bestPermutation = null;
    let bestPermutationScore = 0;
    for (let i=0; i<permutations.length; i++) {
        const permutation = permutations[i];
        let score = 0;
        let part1Note = chord.notes[permutation[0]].copy();
        if (!part1Note) {
            debugger;
        }
        let part2Note = chord.notes[permutation[1]].copy();
        if (!part2Note) {
            debugger;
        }
        
        while (globalSemitone(part1Note) < globalSemitone(bassNote)) {
            part1Note.octave += 1;
        }
        if (globalSemitone(part1Note) > semitoneLimits[1][1]) {
            score -= 100;
        }
        if (prevPart1Note) {
            score -= Math.abs(globalSemitone(part1Note) - globalSemitone(prevPart1Note.note))
        } 
        while (globalSemitone(part2Note) < globalSemitone(part1Note)) {
            part2Note.octave += 1;
        }
        if (globalSemitone(part2Note) > semitoneLimits[2][1]) {
            score -= 100;
        }
        if (prevPart2Note) {
            score -= Math.abs(globalSemitone(part1Note) - globalSemitone(prevPart2Note.note))
        }
        if (bestPermutation == null || score > bestPermutationScore) {
            bestPermutation = i;
            bestPermutationScore = score;
        }
    }
    if (bestPermutation == null) {
        debugger;
        return;
    }

    const bestPermutationNotes = permutations[bestPermutation];

    let part1Note = chord.notes[bestPermutationNotes[0]].copy();
    if (!part1Note) {
        debugger;
    }
    let part2Note = chord.notes[bestPermutationNotes[1]].copy();
    if (!part2Note) {
        debugger;
    }
    
    while (globalSemitone(part1Note) < globalSemitone(bassNote)) {
        part1Note.octave += 1;
    }
    while (globalSemitone(part2Note) < globalSemitone(part1Note)) {
        part2Note.octave += 1;
    }

    divisionedNotes[division].push({
        note: part1Note,
        duration: BEAT_LENGTH * 2,
        partIndex: 1,
        chord: chord,
        scale: new Scale('Cmaj'),
        originalScale: new Scale('Cmaj'),
        tension: 0,
    })
    divisionedNotes[division].push({
        note: part2Note,
        duration: BEAT_LENGTH * 2,
        partIndex: 2,
        chord: chord,
        scale: new Scale('Cmaj'),
        originalScale: new Scale('Cmaj'),
        tension: 0,
    })
}