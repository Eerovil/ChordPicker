import { Scale } from "musictheoryjs";
import { MainMusicParams } from "./params"
import { BEAT_LENGTH, ChordChoice, DivisionedRichnotes, getRP, globalSemitone, relativePitchType, startingNotes } from "./utils"

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
        duration: BEAT_LENGTH,
        partIndex: 3,
        chord: chord,
        scale: (window as any).CMAJ,
        originalScale: (window as any).CMAJ,
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
        let iterations = 0;
        while (part2Note.gTone < bassNote.gTone || part2Note.gTone < semitoneLimits[2][0]) {
            iterations += 1;
            if (iterations > 100) {
                debugger;
                return;
            }
            part2Note.octave += 1;
        }
        if (part2Note.gTone > semitoneLimits[2][1]) {
            score -= 100;
        }
        if (prevPart2Note) {
            score -= Math.min(
                0,
                Math.abs(globalSemitone(part2Note) - globalSemitone(prevPart2Note.note)) - 2
            )
            const relativePitch = getRP(prevPart2Note.note.pitch, part2Note.pitch);
            const rpType = relativePitchType(relativePitch);
            if (['augmented', 'diminished'].includes(rpType)) {
                score -= 100;
            }
        }

        iterations = 0;
        while (part1Note < part2Note || globalSemitone(part1Note) < semitoneLimits[1][0]) {
            iterations += 1;
            if (iterations > 100) {
                debugger;
                return;
            }
            part1Note.octave += 1;
        }
        if (part1Note.gTone > semitoneLimits[1][1]) {
            score -= 100;
        }
        if (melodyNote) {
            if (part1Note.gTone > melodyNote.note.gTone) {
                score -= 1000;
                console.log("Melody note is over: ", melodyNote.note.toString(), "part 1 note is", part1Note.toString())
            } else {
                console.log("Melody note is", melodyNote.note.toString(), "part 1 note is", part1Note.toString())
            }
        }
        if (prevPart1Note) {
            score -= Math.min(
                0,
                Math.abs(globalSemitone(part1Note) - globalSemitone(prevPart1Note.note)) - 2
            )
            const relativePitch = getRP(prevPart1Note.note.pitch, part1Note.pitch);
            const rpType = relativePitchType(relativePitch);
            if (['augmented', 'diminished'].includes(rpType)) {
                score -= 100;
            }
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
    console.log("Best permutation is", bestPermutationNotes, "score", bestPermutationScore)

    let part1Note = chord.notes[bestPermutationNotes[0]].copy();
    if (!part1Note) {
        debugger;
    }
    let part2Note = chord.notes[bestPermutationNotes[1]].copy();
    if (!part2Note) {
        debugger;
    }
    
    while (globalSemitone(part2Note) < globalSemitone(bassNote) || globalSemitone(part2Note) < semitoneLimits[2][0]) {
        part2Note.octave += 1;
    }
    while (globalSemitone(part1Note) < globalSemitone(part2Note) || globalSemitone(part1Note) < semitoneLimits[1][0]) {
        part1Note.octave += 1;
    }

    divisionedNotes[division].push({
        note: part1Note,
        duration: BEAT_LENGTH,
        partIndex: 1,
        chord: chord,
        scale: (window as any).CMAJ,
        originalScale: (window as any).CMAJ,
        tension: 0,
    })
    divisionedNotes[division].push({
        note: part2Note,
        duration: BEAT_LENGTH,
        partIndex: 2,
        chord: chord,
        scale: (window as any).CMAJ,
        originalScale: (window as any).CMAJ,
        tension: 0,
    })
}