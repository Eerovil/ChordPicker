import { chordChoiceToDivisionedNotes } from "./chordchoicetonotes";
import { MainMusicParams } from "./params";
import { ChordChoice, ChordProblem, DivisionedRichnotes, getRP, globalSemitone, gToneString, relativePitchType } from "./utils";

export const getProblemsBetweenChords = (prevChord: ChordChoice, nextChord: ChordChoice, divisionedNotes: DivisionedRichnotes, params: MainMusicParams) : ChordProblem => {
    const ret = {
        parallelFifths: 0,
        voiceDistance: 0,
        chordProgression: 0,
        dissonance: 0,
        melody: 0,
        badInterval: 0,
        overlapping: 0,
    }

    if (prevChord.division == undefined || nextChord.division == undefined) {
        debugger;
        return ret;
    }

    const fakeDivisionedNotes = {
        // Add melody to divisionednotes
        [prevChord.division]: divisionedNotes[prevChord.division].filter(rn => rn.partIndex == 0),
        [nextChord.division]: divisionedNotes[nextChord.division].filter(rn => rn.partIndex == 0),
    };
    chordChoiceToDivisionedNotes(prevChord, prevChord.division, fakeDivisionedNotes, params);
    chordChoiceToDivisionedNotes(nextChord, nextChord.division, fakeDivisionedNotes, params);

    // How did it go?
    const prevRichNotes = fakeDivisionedNotes[prevChord.division];
    const nextRichNotes = fakeDivisionedNotes[nextChord.division];

    const prevNotes = [
        prevRichNotes.filter(rn => rn.partIndex == 0)[0],
        prevRichNotes.filter(rn => rn.partIndex == 1)[0],
        prevRichNotes.filter(rn => rn.partIndex == 2)[0],
        prevRichNotes.filter(rn => rn.partIndex == 3)[0],
    ];
    const nextNotes = [
        nextRichNotes.filter(rn => rn.partIndex == 0)[0],
        nextRichNotes.filter(rn => rn.partIndex == 1)[0],
        nextRichNotes.filter(rn => rn.partIndex == 2)[0],
        nextRichNotes.filter(rn => rn.partIndex == 3)[0],
    ];

    const part1Distance = Math.max(
        0,
        Math.abs(globalSemitone(prevNotes[1].note) - globalSemitone(nextNotes[1].note)) - 2
    );
    console.log('part1Distance', prevChord.chord?.toString(), nextChord.chord?.toString(), part1Distance, gToneString(globalSemitone(prevNotes[1].note)), gToneString(globalSemitone(nextNotes[1].note)));
    const part2Distance = Math.max(
        0,
        Math.abs(globalSemitone(prevNotes[2].note) - globalSemitone(nextNotes[2].note)) - 2
    );

    ret.voiceDistance = (part1Distance + part2Distance) * 3;

    if (part1Distance > 1) {
        const part1Interval = getRP(prevNotes[1].note.pitch, nextNotes[1].note.pitch);
        const rpType = relativePitchType(part1Interval);
        if (['augmented', 'diminished'].includes(rpType)) {
            ret.badInterval += 10;
        }
    }
    if (part2Distance > 1) {
        const part2Interval = getRP(prevNotes[1].note.pitch, nextNotes[1].note.pitch);
        const rpType = relativePitchType(part2Interval);
        if (['augmented', 'diminished'].includes(rpType)) {
            ret.badInterval += 10;
        }
    }

    const part3Distance = Math.max(
        0,
        Math.abs(globalSemitone(prevNotes[3].note) - globalSemitone(nextNotes[3].note)) - 2
    );
    ret.voiceDistance += part3Distance;

    return ret;
};


export const getChordProblem = (chord: ChordChoice, divisionedNotes: DivisionedRichnotes, params: MainMusicParams) : ChordProblem => {
    const ret = {
        parallelFifths: 0,
        voiceDistance: 0,
        chordProgression: 0,
        dissonance: 0,
        melody: 0,
        badInterval: 0,
        overlapping: 0,
    }

    if (chord.division == undefined || !chord.chord) {
        debugger;
        return ret;
    }
    const fakeDivisionedNotes = {
        [chord.division]: divisionedNotes[chord.division],
    };
    chordChoiceToDivisionedNotes(chord, chord.division, divisionedNotes, params);

    // Check part0 and part3 dissonances
    const richNotes = fakeDivisionedNotes[chord.division];
    const part0Note = richNotes.filter(rn => rn.partIndex == 0)[0];
    const part1Note = richNotes.filter(rn => rn.partIndex == 1)[0];
    const part2Note = richNotes.filter(rn => rn.partIndex == 2)[0];
    const part3Note = richNotes.filter(rn => rn.partIndex == 3)[0];
    const edgesDistance = Math.abs(globalSemitone(part0Note.note) - globalSemitone(part3Note.note));
    if (edgesDistance % 12 == 1) {
        ret.dissonance += 10;  // A lot
    }
    if (edgesDistance % 12 == 6) {
        ret.dissonance += 10;  // A lot
    }

    const chordSemitones = chord.chord.notes.map(n => n.semitone);
    if (!(chordSemitones.includes(part0Note.note.semitone))) {
        ret.melody += 10;
    }

    if (part0Note.note.gTone < part1Note.note.gTone) {
        ret.overlapping += 10;
    }
    if (part1Note.note.gTone < part2Note.note.gTone) {
        ret.overlapping += 10;
    }
    if (part2Note.note.gTone < part3Note.note.gTone) {
        ret.overlapping += 10;
    }

    return ret;
}