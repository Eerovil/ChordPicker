import { chordChoiceToDivisionedNotes } from "./chordchoicetonotes";
import { MainMusicParams } from "./params";
import { ChordChoice, ChordProblem, DivisionedRichnotes, getRP, globalSemitone, gToneString, relativePitchType } from "./utils";

export const getProblemsBetweenChords = (prevChord: ChordChoice, nextChord: ChordChoice, divisionedNotes: DivisionedRichnotes, params: MainMusicParams) : ChordProblem => {
    const ret = new ChordProblem();

    if (prevChord.division == undefined || nextChord.division == undefined) {
        debugger;
        return ret;
    }

    const melodyExists = (divisionedNotes[nextChord.division] || []).filter(rn => rn.partIndex == 0).length > 0;

    const fakeDivisionedNotes = {
        // Add melody to divisionednotes
        [prevChord.division]: (divisionedNotes[prevChord.division] || []).filter(rn => rn.partIndex == 0),
        [nextChord.division]: (divisionedNotes[nextChord.division] || []).filter(rn => rn.partIndex == 0),
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

    const part1Distance = Math.abs(globalSemitone(prevNotes[1].note) - globalSemitone(nextNotes[1].note))
    const part2Distance = Math.abs(globalSemitone(prevNotes[2].note) - globalSemitone(nextNotes[2].note))

    if (part1Distance > 0) {
        ret.problems.voiceDistance.push({
            value: (part1Distance),
            type: "voiceDistance",
            slug: "part1Distance",
            comment: "part1Distance"
        });
    }
    if (part2Distance > 0) {
        ret.problems.voiceDistance.push({
            value: (part2Distance),
            type: "voiceDistance",
            slug: "part2Distance",
            comment: "part2Distance"
        });
    }

    if (!melodyExists) {
        const part0Distance = Math.abs(globalSemitone(prevNotes[0].note) - globalSemitone(nextNotes[0].note))
        if (part0Distance > 0) {
            ret.problems.voiceDistance.push({
                value: part0Distance,
                type: "voiceDistance",
                slug: "part0Distance",
                comment: "part0Distance"
            });
        }
    }

    if (part1Distance > 1) {
        const part1Interval = getRP(prevNotes[1].note.pitch, nextNotes[1].note.pitch);
        const rpType = relativePitchType(part1Interval);
        if (['augmented', 'diminished'].includes(rpType)) {
            ret.problems.badInterval.push({
                value: 10,
                type: "badInterval",
                comment: "part1Interval is " + rpType
            });
        }
    }
    if (part2Distance > 1) {
        const part2Interval = getRP(prevNotes[1].note.pitch, nextNotes[1].note.pitch);
        const rpType = relativePitchType(part2Interval);
        if (['augmented', 'diminished'].includes(rpType)) {
            ret.problems.badInterval.push({
                value: 10,
                type: "badInterval",
                comment: "part2Interval is " + rpType
            });
        }
    }

    const part3Distance = Math.abs(globalSemitone(prevNotes[3].note) - globalSemitone(nextNotes[3].note))

    if (part3Distance > 0) {
        ret.problems.voiceDistance.push({
            value: part3Distance,
            type: "voiceDistance",
            slug: "part3Distance",
            comment: "part3Distance"
        });
    }

    return ret;
};


export const getChordProblem = (chord: ChordChoice, divisionedNotes: DivisionedRichnotes, params: MainMusicParams) : ChordProblem => {
    const ret = new ChordProblem();

    if (chord.division == undefined || !chord.chord) {
        debugger;
        return ret;
    }
    const fakeDivisionedNotes = {
        [chord.division]: divisionedNotes[chord.division] || [],
    };
    chordChoiceToDivisionedNotes(chord, chord.division, fakeDivisionedNotes, params);

    // Check part0 and part3 dissonances
    const richNotes = fakeDivisionedNotes[chord.division];
    const part0Note = richNotes.filter(rn => rn.partIndex == 0)[0];
    const part1Note = richNotes.filter(rn => rn.partIndex == 1)[0];
    const part2Note = richNotes.filter(rn => rn.partIndex == 2)[0];
    const part3Note = richNotes.filter(rn => rn.partIndex == 3)[0];
    ret.notes = [part0Note.note, part1Note.note, part2Note.note, part3Note.note];
    const edgesDistance = Math.abs(globalSemitone(part0Note.note) - globalSemitone(part3Note.note));
    if (edgesDistance % 12 == 1) {
        ret.problems.dissonance.push({
            value: 10,
            type: "dissonance",
            comment: "edgesDistance is 1"
        });
    }
    if (edgesDistance % 12 == 6) {
        ret.problems.dissonance.push({
            value: 10,
            type: "dissonance",
            comment: "edgesDistance is 6"
        });
    }

    const chordSemitones = chord.chord.notes.map(n => n.semitone);
    if (!(chordSemitones.includes(part0Note.note.semitone))) {
        ret.problems.melody.push({
            value: 10,
            type: "melody",
            comment: `melody note ${part0Note.note.toString()} is not in chord` 
        });

    }

    if (part0Note.note.gTone < part1Note.note.gTone) {
        ret.problems.overlapping.push({
            value: 10,
            type: "overlapping",
            comment: "part0Note is lower than part1Note"
        });
    }
    if (part1Note.note.gTone < part2Note.note.gTone) {
        ret.problems.overlapping.push({
            value: 10,
            type: "overlapping",
            comment: "part1Note is lower than part2Note"
        });
    }
    if (part2Note.note.gTone < part3Note.note.gTone) {
        ret.problems.overlapping.push({
            value: 10,
            type: "overlapping",
            comment: "part2Note is lower than part3Note"
        });
    }

    return ret;
}