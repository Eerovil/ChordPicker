import { allowedScaleRoots, allPitches, allPitchesByName, chordTemplates, diatonicChordsByScale, scaleTemplates } from "./musictemplates";
import { anyChromaticNotes, enharmonicPitch, equalPitch, getRP, pitchNameToPitch, PitchPlusRP, pitchString, pitchToSemitone, relativePitchName, semitoneDistance } from "./utils";


export type Pitch = {
    // Absolute pitch (RelativePitch to C)
    degree: number,
    sharp: number,
}
export type RelativePitch = {
    degree: number,
    sharp: number,
}

export class Scale {
    root: Pitch;
    templateSlug: string;

    constructor(root: Pitch, templateSlug: string) {
        let found = false;
        for (const allowedRoot of allowedScaleRoots) {
            if (equalPitch(root, allowedRoot)) found = true;
        }
        if (!found) {
            const rootSemitone = pitchToSemitone(root);
            for (const allowedRoot of allowedScaleRoots) {
                if (pitchToSemitone(allowedRoot) === rootSemitone) {
                    root = allowedRoot;
                    break;
                }
            }
        }
        this.root = root;
        this.templateSlug = templateSlug;
    }

    get pitches(): Pitch[] {
        const template = scaleTemplates[this.templateSlug];
        if (template == null) throw new Error("Invalid scale template " + this.templateSlug);
        return template.map(p => PitchPlusRP(this.root, p));
    }

    get leadingTone(): Pitch {
        const degreeSeven = this.pitches[6];
        const ret = {
            degree: degreeSeven.degree,
            sharp: degreeSeven.sharp,
        }
        const degreeSevenSemitoneDistance = semitoneDistance(
            pitchToSemitone(degreeSeven),
            pitchToSemitone(this.root)
        );

        if (degreeSevenSemitoneDistance > 1) {
            ret.sharp += degreeSevenSemitoneDistance - 1;
        }
        return ret;
    }

    get diatonicTriads(): Chord[] {
        const ret = [];
        let degree = 0;
        for (const chordTemplateSlug of diatonicChordsByScale[this.templateSlug]) {
            ret.push(new Chord(this.pitches[degree], chordTemplateSlug));
            degree++;
        }
        return ret;
    }

    get diatonicChordsByDegree(): Chord[][] {
        const triads = this.diatonicTriads;
        const chordsByDegree: Array<Array<Chord>> = [
            [triads[0]],
            [triads[1]],
            [triads[2]],
            [triads[3]],
            [triads[4]],
            [triads[5]],
            [triads[6]],
        ]
        // Add some 7th chords
        for (const degreeIndex in triads) {
            const chord = chordsByDegree[degreeIndex][0];
            const dom7 = new Chord(chord.notes[0].pitch, 'dom7');
            if (!anyChromaticNotes(dom7.notes, this)) {
                chordsByDegree[degreeIndex].push(dom7);
            }
            const maj7 = new Chord(chord.notes[0].pitch, 'maj7');
            if (!anyChromaticNotes(maj7.notes, this)) {
                chordsByDegree[degreeIndex].push(maj7);
            }
            const halfDim7 = new Chord(chord.notes[0].pitch, 'dimhalf7');
            if (!anyChromaticNotes(halfDim7.notes, this)) {
                chordsByDegree[degreeIndex].push(halfDim7);
            }
        }
        return chordsByDegree;
    }

    public toString() {
        return pitchString(this.root) + " " + this.templateSlug;
    }

    get name() {
        return this.toString();
    }

    public equals(other: Scale) {
        return (
            this.root.degree == other.root.degree &&
            this.root.sharp == other.root.sharp &&
            this.templateSlug == other.templateSlug
        );
    }

    static fromObject(obj: any) {
        return new Scale(
            obj.root,
            obj.templateSlug,
        );
    }
}


export class Note {
    public pitch: Pitch;
    public octave: number;

    constructor(passedPitch: Pitch | string, passedOctave?: number) {
        let pitch;
        let octave;
        if (typeof passedPitch == "string") {
            const parsedType = passedPitch.match(/^([A-G](?:#|b)*)(\d*)/);
            if (parsedType == null) {
                throw "Invalid note name " + passedPitch;
            }
            octave = parseInt(parsedType[2]);

            if (isNaN(octave)) {
                octave = passedOctave || 4;
            }
            pitch = pitchNameToPitch(parsedType[1]);
        } else {
            pitch = passedPitch;
            octave = passedOctave || 4;
        }
        this.pitch = pitch;
        this.octave = octave;
    }

    get semitone() {
        return pitchToSemitone(this.pitch)
    };
    set semitone(semitone: number) {
        debugger;
    };
    get globalSemitone() {
        return this.semitone + ((this.octave) * 12);
    };
    get gTone() {
        return this.globalSemitone;
    }
    public toString() {
        return pitchString(this.pitch) + "" + this.octave;
    }
    get name() {
        return this.toString();
    }
    public pitchName() {
        return pitchString(this.pitch);
    }
    public copy() {
        return new Note(this.pitch, this.octave);
    }
    public valueOf() {
        // You can use this for direct comparison, yay
        return this.globalSemitone;
    }
    static fromObject(obj: any) {
        return new Note(
            obj.pitch,
            obj.octave,
        );
    }
}

export class Chord {
    public notes: Array<Note>;
    public root: Pitch;
    public chordType: string;
    public toString() {
        return pitchString(this.root) + this.chordType;
    }
    get name() {
        return this.toString();
    }
    constructor(passedPitch: Pitch | string, chordType: string | undefined = undefined) {
        let pitch: Pitch;
        if (typeof passedPitch == "string") {
            const parsedType = passedPitch.match(/^(\w(#|b)?)(.*)/);
            if (parsedType == null) {
                throw "Invalid chord name " + passedPitch;
            }
            pitch = pitchNameToPitch(parsedType[0]);
            chordType = chordType || parsedType[1];
        } else {
            pitch = passedPitch;
        }
        this.root = pitch
        this.chordType = chordType || "?";
        const template = chordTemplates[this.chordType];
        if (template == undefined) {
            throw "Unknown chord type: " + chordType;
        }
        this.notes = [];
        for (let note of template) {
            this.notes.push(new Note(PitchPlusRP(this.root, note), 1));
        }
    }
    static fromObject(obj: any) {
        return new Chord(obj.root, obj.chordType);
    }
    public getDegreePitch(scale: Scale): Pitch {
        let degree = 0;
        let sharp = 0;
        if (!scale || !scale.pitches) {
            debugger;
            return {degree, sharp};
        }
        for (const pitch of scale.pitches) {
            if (equalPitch(this.root, pitch)) {
                break;
            }
            degree++;
        }
        if (degree == scale.pitches.length) {
            // Find the closest pitch
            for (const pitch of scale.pitches) {
                if (pitch.degree == this.root.degree) {
                    degree = pitch.degree;
                    sharp = semitoneDistance(pitchToSemitone(pitch), pitchToSemitone(this.root));
                    break;
                }
            }
        }
        return {degree, sharp};
    }
    public getChordDegree(scale: Scale) {
        // Get what this chord would be in the given key
        const {degree, sharp} = this.getDegreePitch(scale);
        const degreeToNumeral = [
            "I", "II", "III", "IV", "V", "VI", "VII"
        ]
        let ret = degreeToNumeral[degree];
        if (sharp > 0) {
            ret = "#" + ret;
        }
        if (sharp < 0) {
            ret = "b" + ret;
        }
        if (relativePitchName(getRP(this.root, this.notes[1].pitch)) == 'minor third') {
            ret = ret.toLowerCase();
        }
        if (this.chordType.includes("dim")) {
            if (this.chordType.includes("half")) {
                ret = ret + "ø";  // TODO: add sup-tag or something here.
            } else {
                ret = ret + "°";
            }
        }
        if (this.chordType.includes("7")) {
            ret = ret + "7";
        }
        return ret;
    }
    get defaultDegree() {
        return this.getChordDegree(new Scale(allPitchesByName['C'], 'major'));
    }
    public getAlternativeChordDegree(scale: Scale) {
        // Return a guess of a possible "of X" chord degree
        if (!anyChromaticNotes(this.notes, scale)) {
            return null;
        }

        if (['dom7', 'maj'].includes(this.chordType)) {
            // V or V7 secondary function
            // Make a scale that has this chord as the dominant.
            for (const scaleType of ['major', 'minor', 'harmonicMinor']) {
                const degree5Interval = scaleTemplates[scaleType][4];
                const dominantScale = new Scale(PitchPlusRP(this.root, degree5Interval, false), scaleType);  // 5th down
                // Run this same function but with the dominant scale.
                // TODO: Should chromatic notes here be allowed...?
                if (!anyChromaticNotes(this.notes, dominantScale)) {
                    const dominantScaleRootTriad = dominantScale.diatonicTriads[0];
                    if (!anyChromaticNotes(dominantScaleRootTriad.notes, scale)) {
                        return `${this.getChordDegree(dominantScale)}/${dominantScaleRootTriad.getChordDegree(scale)}`;
                    }
                }
            }
        }
        if (['min', 'min7', 'dim', 'dim7', 'dimhalf7'].includes(this.chordType)) {
            // iio/iio7 or ii/ii7 secondary function
            // Make a scale that has this chord as the two chord
            for (const scaleType of ['major', 'minor', 'harmonicMinor']) {
                const degree2Interval = scaleTemplates[scaleType][1];
                const dominantScale = new Scale(PitchPlusRP(this.root, degree2Interval, false), scaleType);  // 2nd down
                // Run this same function but with the dominant scale.
                if (!anyChromaticNotes(this.notes, dominantScale)) {
                    const dominantScaleRootTriad = dominantScale.diatonicTriads[0];
                    if (!anyChromaticNotes(dominantScaleRootTriad.notes, scale)) {
                        return `${this.getChordDegree(dominantScale)}/${dominantScaleRootTriad.getChordDegree(scale)}`;
                    }
                }
            }
        }
        if (['dim', 'dim7', 'dimhalf7'].includes(this.chordType)) {
            // viio/viio7 secondary function
            // Make a scale that has this chord as the vii chord
            for (const scaleType of ['major', 'minor', 'harmonicMinor']) {
                // We need to check what the degree 7 is for this scale.
                const degree7Interval = scaleTemplates[scaleType][6];
                const dominantScale = new Scale(PitchPlusRP(this.root, degree7Interval, false), scaleType);  // 7th down
                // Run this same function but with the dominant scale.
                if (!anyChromaticNotes(this.notes, dominantScale)) {
                    const dominantScaleRootTriad = dominantScale.diatonicTriads[0];
                    if (!anyChromaticNotes(dominantScaleRootTriad.notes, scale)) {
                        return `${this.getChordDegree(dominantScale)}/${dominantScaleRootTriad.getChordDegree(scale)}`;
                    }
                }
            }
        }
    }
}
