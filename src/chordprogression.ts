import { Chord, Pitch, Scale } from "./musicclasses";
import { scaleTemplates } from "./musictemplates";
import { equalPitch, anyChromaticNotes, PitchPlusRP, enharmonicPitch } from "./utils";

/*
        0: null,                     // I can go anywhere
        1: ['dominant', ],           // ii can go to V or vii or dominant
        2: [5, 3],                   // iii can go to vi or IV
        3: [1, 2, 'dominant'],       // IV can go to I, ii or dominant
        4: ['tonic', 6, 'dominant'], //, 5], // V can go to I, vii or dominant or vi  DECEPTIVE IS DISABLED FOR NOW
        5: ['sub-dominant', 2],      // vi can go to ii, IV, (or iii)
        6: ['tonic'],                // vii can go to I
*/

const chordProgressionCache: {[key: string]: Array<ChordProgression>} = {};


export type ChordProgression = {
    chord: Chord,
    reason: string,
}


const progressionEquals = (a: ChordProgression, b: ChordProgression): boolean => {
    return a.chord.toString() == b.chord.toString() && a.reason == b.reason;
}


export const chordSubstitutions = (chord: Chord, scale: Scale): Array<Chord> => {
    // For any given chord, return a list of chords that can substitute for it.
    let ret : Array<Chord> = [];
    let modalMixtureScales: string[] = []
    if (scale.templateSlug == 'major') {
        modalMixtureScales = ['harmonicMinor'];
    }
    if (scale.templateSlug == 'harmonicMinor' || scale.templateSlug == 'minor') {
        modalMixtureScales = ['major'];
    }
    const chordDegree = scale.pitches.findIndex(x => equalPitch(x, chord.notes[0].pitch));
    if (!anyChromaticNotes(chord.notes, scale)) {
        for (const scaleSlug of modalMixtureScales) {
            const newScale = new Scale(scale.pitches[0], scaleSlug);
            ret = ret.concat(newScale.diatonicChordsByDegree[chordDegree]);
        }
    }

    // tritone substitution of the 7th chord
    if (chord.chordType == 'dom7') {
        const tritonePitch = enharmonicPitch(PitchPlusRP(chord.notes[0].pitch, {degree: 3, sharp: 1}), scale);
        ret.push(new Chord(tritonePitch, 'dom7'));
    }
    return ret.filter(c => c.toString() != chord.toString());
}

const diatonicProgressionChoices = (chord: Chord, scale: Scale): Array<Chord> => {
    // This will return an array of DIATONIC chords that can follow the given chord in the scale `scale`.
    // Nothing fancy here, just the basic rules.
    // TODO: Allow going backwards. for some of them
    const triads = scale.diatonicTriads;
    const chordsByDegree = scale.diatonicChordsByDegree;
    const dominant = [chordsByDegree[4], chordsByDegree[6]].reduce((a, b) => a.concat(b), []);    // V and vii
    const subDominant = [chordsByDegree[1], chordsByDegree[3]].reduce((a, b) => a.concat(b), []); // ii and IV
    const tonic = [chordsByDegree[0], chordsByDegree[5]].reduce((a, b) => a.concat(b), []);       // I and vi
    const ret : Array<Chord> = [];
    const pitch = chord.notes[0].pitch;

    if (!anyChromaticNotes(chord.notes, scale)) {
        if (equalPitch(pitch, scale.pitches[0])) {
            // This is the tonic. Anything is ok after the tonic!
            return chordsByDegree.reduce((a, b) => a.concat(b), []);
        } else if (equalPitch(pitch, scale.pitches[1])) {
            // ii can go to dominant
            return dominant;
        } else if (equalPitch(pitch, scale.pitches[2])) {
            // iii can go to vi or IV
            return [chordsByDegree[5], chordsByDegree[3]].reduce((a, b) => a.concat(b), []);
        } else if (equalPitch(pitch, scale.pitches[3])) {
            // IV can go to I, ii or dominant
            return [chordsByDegree[0], chordsByDegree[1]].reduce((a, b) => a.concat(b), []).concat(dominant);
        } else if (equalPitch(pitch, scale.pitches[4])) {
            // V can go to I, vii or dominant or vi
            return tonic.concat(dominant);
        } else if (equalPitch(pitch, scale.pitches[5])) {
            // vi can go to ii, IV, (or iii)
            return chordsByDegree[2].concat(subDominant);
        } else if (equalPitch(pitch, scale.pitches[6])) {
            // vii can go to I
            return tonic;
        } else {
            debugger;
            throw new Error("Chord not in scale, but has no chromatic notes!");
        }
    }
    return ret;
}

export const progressionChoices = (chord: Chord, scale: Scale, passedRecursionHandled: Set<string> | undefined = undefined, originalScale: Scale | undefined = undefined) : Array<ChordProgression> => {
    let recursionHandled = passedRecursionHandled || new Set();

    let initialResults: Array<ChordProgression> = [];
    const identifierString = `${chord.toString()}-${scale.toString()}`;
    if (recursionHandled.has(identifierString)) {
        return initialResults;
    }

    if (chordProgressionCache[identifierString] != undefined) {
        return chordProgressionCache[identifierString];
    }

    console.log("Checking progression choices for", chord.toString(), "in scale", scale.toString());

    // The procedure is as follows:
    // First we check what the chord is possibly substituting (a diatonic chord). If so, we use that diatonic chord for progressions.
    // (If the chord is not diatonic and not a substitution, we must change key and try again).
    // When we get the results, we need to add all possible substitutions to the results.
    //
    // Additionally, we need to add all possible secondary dominants etc., that resolve to a result, to the results.

    if (!anyChromaticNotes(chord.notes, scale)) {
        // We're good, this cannot be a substitution or a secondary chord.
        initialResults = diatonicProgressionChoices(chord, scale).map(chord => ({chord, reason: 'diatonic in ' + scale.toString() }));
    } else {
        // Run this same function for all chords this chord could be substituting.
        const substitutions = chordSubstitutions(chord, scale);
        recursionHandled.add(`${chord.toString()}-${scale.toString()}`);
        for (const sub of substitutions) {
            initialResults = initialResults.concat(progressionChoices(sub, scale, recursionHandled));
        }

        if (['dom7', 'maj'].includes(chord.chordType)) {
            // V or V7 secondary function
            // Make a scale that has this chord as the dominant.
            for (const scaleType of ['major', 'minor', 'harmonicMinor']) {
                const degree5Interval = scaleTemplates[scaleType][4];
                const dominantScale = new Scale(PitchPlusRP(chord.root, degree5Interval, false), scaleType);  // 5th down
                // Run this same function but with the dominant scale.
                // TODO: Should chromatic notes here be allowed...?
                if (!anyChromaticNotes(chord.notes, dominantScale)) {
                    initialResults = initialResults.concat(
                        progressionChoices(chord, dominantScale, recursionHandled, scale).map(
                            prog => {prog.reason += " in scale " + dominantScale.toString(); return prog}
                        )
                    );
                }
            }
        }
        if (['min', 'min7', 'dim', 'dim7'].includes(chord.chordType)) {
            // iio/iio7 or ii/ii7 secondary function
            // Make a scale that has this chord as the two chord
            for (const scaleType of ['major', 'minor', 'harmonicMinor']) {
                const degree2Interval = scaleTemplates[scaleType][1];
                const dominantScale = new Scale(PitchPlusRP(chord.root, degree2Interval, false), scaleType);  // 2nd down
                // Run this same function but with the dominant scale.
                if (!anyChromaticNotes(chord.notes, dominantScale)) {
                    initialResults = initialResults.concat(
                        progressionChoices(chord, dominantScale, recursionHandled, scale).map(
                            prog => {prog.reason += " in scale " + dominantScale.toString(); return prog}
                        )
                    );
                }
            }
        }
        if (['dim', 'dim7'].includes(chord.chordType)) {
            // viio/viio7 secondary function
            // Make a scale that has this chord as the vii chord
            for (const scaleType of ['major', 'minor', 'harmonicMinor']) {
                // We need to check what the degree 7 is for this scale.
                const degree7Interval = scaleTemplates[scaleType][6];
                const dominantScale = new Scale(PitchPlusRP(chord.root, degree7Interval, false), scaleType);  // 7th down
                // Run this same function but with the dominant scale.
                if (!anyChromaticNotes(chord.notes, dominantScale)) {
                    initialResults = initialResults.concat(
                        progressionChoices(chord, dominantScale, recursionHandled, scale).map(
                            prog => {prog.reason += " in scale " + dominantScale.toString(); return prog}
                        )
                    );
                }
            }
        }
    }

    initialResults = initialResults.concat({chord, reason: 'self'});

    // Remove duplicates
    const ret = initialResults.filter((chord, index, self) =>
        index === self.findIndex((t) => (
            progressionEquals(t, chord)
        ))
    );

    // Add substitutions
    let finalResults: Array<ChordProgression> = [...ret];
    for (const prog of ret) {
        finalResults = finalResults.concat(chordSubstitutions(prog.chord, scale).map(c => ({
            chord: c, reason: c.toString() + 'is a substitution of ' + prog.chord.toString() + ' in scale ' + scale.toString()
        })));
    }

    // Add secondary dominants of each diatonic chord
    const addSecondaryDominants = (chords: Chord[], degree: number, of: number, dominantScale: Scale) => {
        for (const chord of chords) {
            if (!anyChromaticNotes(chord.notes, scale)) {
                // Secondary dominants must have chromatic notes.
                continue;
            }
            const degrees = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
            finalResults.push({chord, reason: `${chord.toString()} is ${chord.getChordDegree(scale.root)} of ${degrees[of]}`});
        }
    }

    if (!originalScale || originalScale.equals(scale)) {
        for (const prog of ret) {
            if (['maj', 'min'].includes(prog.chord.chordType)) {
                // Make a scale that has this chord as the root/tonic
                for (const scaleType of ['major', 'harmonicMinor']) {
                    const chordDegree = scale.diatonicChordsByDegree.findIndex(chords => chords.some(c => c.toString() == prog.chord.toString()));
                    const dominantScale = new Scale(prog.chord.root, scaleType);
                    if (equalPitch(dominantScale.root, scale.root)) {
                        continue;
                    }
                    if (anyChromaticNotes(prog.chord.notes, dominantScale)) {
                        continue;
                    }
                    // V chord
                    addSecondaryDominants(dominantScale.diatonicChordsByDegree[4], 4, chordDegree, scale);
                    // ii chord
                    addSecondaryDominants(dominantScale.diatonicChordsByDegree[1], 1, chordDegree, scale);
                    // vii chord
                    addSecondaryDominants(dominantScale.diatonicChordsByDegree[6], 6, chordDegree, scale);
                }
            }
        }
    }

    // Remove duplicates
    const ret2 = finalResults.filter((chord, index, self) =>
        index === self.findIndex((t) => (
            progressionEquals(t, chord)
        ))
    );

    chordProgressionCache[identifierString] = ret2;

    return ret2
}
