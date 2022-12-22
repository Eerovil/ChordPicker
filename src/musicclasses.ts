import { allPitches, chordTemplates, scaleTemplates } from "./musictemplates";
import { getRP, pitchNameToPitch, PitchPlusRP, pitchString, pitchToSemitone, semitoneDistance } from "./utils";


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
    public getChordDegree(root: Pitch) {
        // Get what this chord would be in the given key
        const intervalToRoot = getRP(root, this.root);
        const degreeToNumeral = [
            "I", "II", "III", "IV", "V", "VI", "VII"
        ]
        let ret = degreeToNumeral[intervalToRoot.degree];
        if (intervalToRoot.sharp > 0) {
            ret = "#" + ret;
        }
        if (intervalToRoot.sharp < 0) {
            ret = "b" + ret;
        }
        if (!(this.chordType.includes("maj"))) {
            ret = ret.toLowerCase();
        }
        if (this.chordType.includes("dim")) {
            ret = ret + "°";
        }
        if (this.chordType.includes("7")) {
            ret = ret + "7";
        }
        return ret;
    }
    get defaultDegree() {
        return this.getChordDegree(allPitches[0]);
    }
}
