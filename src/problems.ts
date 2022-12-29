import { chordChoiceToDivisionedNotes } from "./chordchoicetonotes";
import { progressionChoices } from "./chordprogression";
import { Chord, Note, Pitch, Scale } from "./musicclasses";
import { MainMusicParams } from "./params";
import { ChordChoice, RichNote, ChordProblem, DivisionedRichnotes, getRP, globalSemitone, relativePitchType, equalPitch, semitoneDistance, anyChromaticNotes, relativePitchName, PitchPlusRP } from "./utils";


type RulesParams = {
    problems: ChordProblem,
    prevChord?: ChordChoice,
    prevNotes?: Array<RichNote>,
    nextChord?: ChordChoice,
    nextNotes?: Array<RichNote>,
    params: MainMusicParams,
}


const doublingRules = (rulesParams: RulesParams) => {
    const { problems, prevChord, prevNotes, nextChord, nextNotes, params } = rulesParams;

    // Check 64 (Second inversion triad)
    const secondInversion = (chord: Chord, doubling: Array<number>) => {
        if (chord.notes.length == 3) {
            const is64 = doubling[0] == 2;
            // Fifth should be doubled
            const fifthIsDoubled = doubling.filter(i => i == 2).length > 1;
            if (is64 && !fifthIsDoubled) {
                problems.problems.doubling.push({
                    type: "doubling",
                    slug: "64",
                    comment: "Second inversion triad should have fifth doubled",
                    value: 5,
                });
            }
        }
    }

    const leadingTone = (chord: Chord, doubling: Array<number>, scale: Scale) => {
        const leadingTone = scale.leadingTone;
        const leadingToneIndex = chord.notes.findIndex(note => equalPitch(note.pitch, leadingTone));
        const leadingToneIsDoubled = doubling.filter(i => i == leadingToneIndex).length > 1;
        console.log("chord: ", chord.toString(), " leadingTone: ", leadingTone, " leadingToneIndex: ", leadingToneIndex, " leadingToneIsDoubled: ", leadingToneIsDoubled)

        if (leadingToneIsDoubled) {
            problems.problems.doubling.push({
                type: "doubling",
                slug: "leading-tone",
                comment: "Leading tone should not be doubled",
                value: 10,
            });
        }
    }

    const seventhOfChord = (chord: Chord, doubling: Array<number>) => {
        if (chord.notes.length == 4) {
            const seventhInterval = getRP(chord.notes[0].pitch, chord.notes[3].pitch);
            const seventhIndex = chord.notes.findIndex(note => equalPitch(note.pitch, chord.notes[3].pitch));
            const seventhIsDoubled = doubling.filter(i => i == seventhIndex).length > 1;
            if (seventhIsDoubled) {
                if (seventhInterval.degree == 6 && seventhInterval.sharp == 0) {
                    // Major seventh
                    problems.problems.doubling.push({
                        type: "doubling",
                        slug: "major-seventh",
                        comment: "Major seventh should not be doubled",
                        value: 10,
                    });
                }
                else if (seventhInterval.degree == 6 && seventhInterval.sharp == -1) {
                    // Minor seventh
                    problems.problems.doubling.push({
                        type: "doubling",
                        slug: "minor-seventh",
                        comment: "Minor seventh should not be doubled",
                        value: 10,
                    });
                }
                else {
                    problems.problems.doubling.push({
                        type: "doubling",
                        slug: "seventh",
                        comment: "seventh should not be doubled",
                        value: 10,
                    });
                }
            }
        }
    }

    const doublePrimaryDegreesOfScale = (chord: Chord, doubling: Array<number>, scale: Scale) => {
        const primaryDegrees = [scale.pitches[0], scale.pitches[3], scale.pitches[4]];
        const primaryDegreeIndexes = chord.notes.map(note => primaryDegrees.findIndex(pitch => equalPitch(note.pitch, pitch)));
        if (primaryDegreeIndexes.filter(i => i != -1).length == 0) {
            return;
        }
        let doublingOK = false;
        for (const chordIndex of primaryDegreeIndexes.filter(i => i != -1)) {
            if (doubling.filter(i => i == chordIndex).length > 1) {
                doublingOK = true;
                break;
            }
        }
        if (!doublingOK) {
            problems.problems.doubling.push({
                type: "doubling",
                slug: "primary-degree",
                comment: "Primary degree of scale should be doubled",
                value: 10,
            });
        }
    }

    if (prevChord && prevChord.chord && prevNotes && prevNotes.length > 0) {
        const prevScale = prevNotes[0].scale;

    } else {
        if (nextChord && nextChord.chord && nextNotes && nextNotes.length > 0) {
            const nextScale = nextNotes[0].scale;
            secondInversion(nextChord.chord, nextChord.doubling);
            leadingTone(nextChord.chord, nextChord.doubling, nextScale);
            seventhOfChord(nextChord.chord, nextChord.doubling);
            doublePrimaryDegreesOfScale(nextChord.chord, nextChord.doubling, nextScale);
        }
    }
}


const resolutionRules = (rulesParams: RulesParams) => {
    const { problems, prevChord, prevNotes, nextChord, nextNotes, params } = rulesParams;

    // 7th of a chord must resolve down.
    const seventhOfChord = (chord: Chord, prevPitchesPerPart: Array<Array<Pitch>>, nextPitchesPerPart: Array<Array<Pitch>>, scale: Scale) => {
        if (chord.notes.length == 4 && ['dom7'].includes(chord.chordType)) {
            const possiblePrevPartsWithSeventh = prevPitchesPerPart.map(part => part.filter(pitch => equalPitch(pitch, chord.notes[3].pitch)).length > 0);
            if (!possiblePrevPartsWithSeventh.some(b => b)) {
                debugger;
                // No parts have the seventh...?
                return;
            }
            const possibleNextPartsWithSeventh = nextPitchesPerPart.map(part => part.filter(pitch => equalPitch(pitch, chord.notes[3].pitch)).length > 0);
            const resolutionPitch = PitchPlusRP(chord.notes[0].pitch, {degree: 5, sharp: 0});
            const possibleNextPartsWithResolution = nextPitchesPerPart.map(part => part.filter(pitch => equalPitch(pitch, resolutionPitch)).length > 0);

            for (const prevPart of possiblePrevPartsWithSeventh) {
                for (const nextPart of possibleNextPartsWithSeventh) {
                    if (prevPart && nextPart) {
                        return;  // This part could have the seventh and it could have it also next
                    }
                }
                for (const nextPart of possibleNextPartsWithResolution) {
                    if (prevPart && nextPart) {
                        return;  // This part could have the seventh and it could have the resolution next
                    }
                }
            }
            // Seventh is not resolved or continued. That's bad.
            problems.problems.resolution.push({
                type: "resolution",
                slug: "seventh",
                comment: "Seventh of a dom7 should resolve down",
                value: 10,
            });
        }
    }


    // leading tone must resolve up.
    const leadingTone = (chord: Chord, prevPitchesPerPart: Array<Array<Pitch>>, nextPitchesPerPart: Array<Array<Pitch>>, scale: Scale) => {
        const leadingTone = scale.leadingTone;
        const possiblePrevPartsWithLeadingTone = prevPitchesPerPart.map(part => part.filter(pitch => equalPitch(pitch, leadingTone)).length > 0);
        if (!possiblePrevPartsWithLeadingTone.some(b => b)) {
            return;  // No parts with leading tone
        }
        const resolutionPitch = scale.root;
        const possibleNextPartsWithLeadingTone = nextPitchesPerPart.map(part => part.filter(pitch => equalPitch(pitch, leadingTone)).length > 0);
        const possibleNextPartsWithResolution = nextPitchesPerPart.map(part => part.filter(pitch => equalPitch(pitch, resolutionPitch)).length > 0);

        for (const prevPart of possiblePrevPartsWithLeadingTone) {
            for (const nextPart of possibleNextPartsWithLeadingTone) {
                if (prevPart && nextPart) {
                    return;  // This part could have the leading tone and it could have it also next
                }
            }
            for (const nextPart of possibleNextPartsWithResolution) {
                if (prevPart && nextPart) {
                    return;  // This part could have the leading tone and it could have the resolution next
                }
            }
        }
        // Leading tone is not resolved or continued. That's bad.
        problems.problems.resolution.push({
            type: "resolution",
            slug: "leading-tone",
            comment: "Leading tone should resolve up",
            value: 10,
        });
    }

    const possiblePitchesPerPart = (chord: Chord, doubling: Array<number>, inversion: number): Array<Array<Pitch>> => {
        // Inversion tells us the bass note.
        const bassPitch = chord.notes[inversion].pitch;
        // Doubling tells us the rest.
        // For each part, every note is possible unless it's in the bass and NOT doubled.
        // OR
        // If it's left out completely.

        let doubledIndexes = doubling.filter(i => doubling.filter(j => j == i).length > 1);

        const possiblePitches: Array<Array<Pitch>> = [[], [], []];

        const handledIndexes: Set<Pitch> = new Set();

        for (const noteIndex of doubling) {
            if (noteIndex == inversion) {
                if (!(doubledIndexes.includes(noteIndex))) {
                    continue;  // Can't include this index, it's not doubled and it's in the bass.
                }
            }
            if (handledIndexes.has(chord.notes[noteIndex].pitch)) {
                continue;
            }

            // Add all notes for all non-bass parts.
            possiblePitches[0].push(chord.notes[noteIndex].pitch);
            possiblePitches[1].push(chord.notes[noteIndex].pitch);
            possiblePitches[2].push(chord.notes[noteIndex].pitch);
        }

        possiblePitches[3] = [bassPitch];  // No choices for bass.

        return possiblePitches;
    }

    if (prevChord && prevChord.chord && prevNotes && prevNotes.length > 0) {
        if (nextChord && nextChord.chord && nextNotes && nextNotes.length > 0) {
            const nextScale = nextNotes[0].scale;
            const prevPitchesPerPart = possiblePitchesPerPart(prevChord.chord, prevChord.doubling, prevChord.inversion);
            const nextPitchesPerPart = possiblePitchesPerPart(nextChord.chord, nextChord.doubling, nextChord.inversion);

            leadingTone(prevChord.chord, prevPitchesPerPart, nextPitchesPerPart, prevNotes[0].scale);
            seventhOfChord(prevChord.chord, prevPitchesPerPart, nextPitchesPerPart, prevNotes[0].scale);
        }
    }

}


const chordProgressionRules = (rulesParams: RulesParams) => {
    const { problems, prevChord, prevNotes, nextChord, nextNotes, params } = rulesParams;
    if (!nextChord || !nextChord.chord) {
        return;
    }
    const nextChordString = nextChord.chord.toString();
    if (!prevChord || !prevChord.chord || !prevNotes || prevNotes.length == 0) {
        return;
    }
    const availableProgressions = progressionChoices(prevChord.chord, prevNotes[0].scale);
    // if (availableProgressions.length > 0) {
    //     console.log("availableProgressions from ", prevChord.chord.toString(), ": ", availableProgressions.map(p => p.toString()));
    // } else {
    //     console.log("No availableProgressions from ", prevChord.chord.toString());
    // }

    if (availableProgressions.filter(p => p.chord.toString() == nextChordString).length == 0) {
        problems.problems.chordProgression.push({
            type: "chordProgression",
            slug: "not-available",
            comment: `Chord ${prevChord.chord.toString()} does not have a progression to ${nextChordString}`,
            value: 10,
        });
    } else {
        let bestProg = null;
        for (const prog of availableProgressions.filter(p => p.chord.toString() == nextChordString)) {
            if (!bestProg) {
                bestProg = prog;
            }
            if (prog.score < bestProg.score) {
                bestProg = prog;
            }
            if (prog.score == bestProg.score && prog.reason.length < bestProg.reason.length) {
                bestProg = prog;
            }
        }
        if (bestProg) {
            problems.problems.chordProgression.push({
                type: "chordProgression",
                slug: "available",
                comment: `Chord ${prevChord.chord.toString()} -> ${bestProg.chord.toString()} (${bestProg.reason})`,
                value: bestProg.score,
            });
        }
    }
}


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
    if (prevChord.selectedScale) {
        prevRichNotes.forEach(rn => rn.scale = (prevChord.selectedScale as Scale));
        nextRichNotes.forEach(rn => rn.scale = (prevChord.selectedScale as Scale));
    }
    if (nextChord.selectedScale) {
        nextRichNotes.forEach(rn => rn.scale = (nextChord.selectedScale as Scale));
    }

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
                comment: "Alto interval is a " + relativePitchName(part1Interval)
            });
        }
    }
    if (part2Distance > 1) {
        const part2Interval = getRP(prevNotes[2].note.pitch, nextNotes[2].note.pitch);
        const rpType = relativePitchType(part2Interval);
        if (['augmented', 'diminished'].includes(rpType)) {
            ret.problems.badInterval.push({
                value: 10,
                type: "badInterval",
                comment: "Tenor interval is " + relativePitchName(part2Interval)
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
        const part3Interval = getRP(prevNotes[3].note.pitch, nextNotes[3].note.pitch);
        const rpType = relativePitchType(part3Interval);
        if (['augmented', 'diminished'].includes(rpType)) {
            ret.problems.badInterval.push({
                value: 10,
                type: "badInterval",
                comment: "Bass interval is " + relativePitchName(part3Interval)
            });
        }
    }

    doublingRules({
        prevChord,
        nextChord,
        prevNotes,
        nextNotes,
        problems: ret,
        params,
    });

    chordProgressionRules({
        prevChord,
        nextChord,
        prevNotes,
        nextNotes,
        problems: ret,
        params,
    })

    resolutionRules({
        prevChord,
        nextChord,
        prevNotes,
        nextNotes,
        problems: ret,
        params,
    })

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
    const richNotesArr = [part0Note, part1Note, part2Note, part3Note];
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

    doublingRules({
        prevChord: chord,
        prevNotes: richNotesArr,

        problems: ret,
        params,
    });


    return ret;
}