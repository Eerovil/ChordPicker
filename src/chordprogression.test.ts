import {describe, expect, test} from '@jest/globals';
import { chordSubstitutions, progressionChoices } from './chordprogression';
import { Chord, Scale } from './musicclasses';
import { allPitchesByName } from './musictemplates';



function expectContains<Type>(arr: Array<Type>, callback: (arg: Type) => boolean) {
    for (const item of arr) {
        if (callback(item)) return;
    }
    expect(arr).toBe(false);  // Print the array if the test fails
}


describe('test some chord substitutions', () => {
    test('sub', () => {
        const CMajorScale = Scale.create(allPitchesByName['C'], 'major');
        expect(chordSubstitutions(Chord.create(allPitchesByName['C'], 'maj'), CMajorScale).map(chord => chord.toString())).toStrictEqual([
            'Cmin',
        ]);
        expect(chordSubstitutions(Chord.create(allPitchesByName['D'], 'min'), CMajorScale).map(chord => chord.toString())).toStrictEqual([
            'Ddim', 'Ddimhalf7'
        ]);
        expect(chordSubstitutions(Chord.create(allPitchesByName['E'], 'min'), CMajorScale).map(chord => chord.toString())).toStrictEqual([
            'Ebmaj',
        ]);
        expect(chordSubstitutions(Chord.create(allPitchesByName['C'], 'dom7'), CMajorScale).map(chord => chord.toString())).toStrictEqual([
            'F#dom7',
        ]);
        expect(chordSubstitutions(Chord.create(allPitchesByName['F#'], 'dom7'), CMajorScale).map(chord => chord.toString())).toStrictEqual([
            'Cdom7',
        ]);
        const Emajor = Scale.create(allPitchesByName['E'], 'major');
        expect(chordSubstitutions(Chord.create(allPitchesByName['E'], 'dom7'), Emajor).map(chord => chord.toString())).toStrictEqual([
            'A#dom7',
        ]);
    });
    test('problem sub', () => {
        const CMajorScale = Scale.create(allPitchesByName['C'], 'major');
        expect(chordSubstitutions(Chord.create(allPitchesByName['C'], 'min'), CMajorScale).map(chord => chord.toString())).toStrictEqual([]);
    })
});


describe('test chord progressions', () => {
    const CMajorScale = Scale.create(allPitchesByName['C'], 'major');
    const diatonicChords = CMajorScale.diatonicTriads;
    expect(diatonicChords[0].toString()).toBe('Cmaj');
    const choicesFromCmaj = progressionChoices(diatonicChords[0], CMajorScale).map(prog => prog.chord.toString());

    test('Basic', () => {
        // Any diatonic chord is there
        expect(choicesFromCmaj).toContain('Cmaj');
        expect(choicesFromCmaj).toContain('Dmin'); 
        expect(choicesFromCmaj).toContain('Emin');
        expect(choicesFromCmaj).toContain('Fmaj');
        expect(choicesFromCmaj).toContain('Gmaj');
        expect(choicesFromCmaj).toContain('Amin');
        expect(choicesFromCmaj).toContain('Bdim');
    });

    test('Modal mixture', () => {
        // NOTE: This is actually a substitution check
        expect(choicesFromCmaj).toContain('Cmin');  // Cmin i chord
        expect(choicesFromCmaj).toContain('Ddim');  // Cmin iio chord
        expect(choicesFromCmaj).toContain('Ebmaj'); // Cmin III chord
        expect(choicesFromCmaj).toContain('Fmin');  // Cmin iv chord
        expect(choicesFromCmaj).toContain('Gmaj');  // Cmin V chord
        expect(choicesFromCmaj).toContain('Abmaj');  // Cmin VI chord
        expect(choicesFromCmaj).toContain('Bdim');  // Cmin viio chord
    });

    test('7th chords', () => {
        expect(choicesFromCmaj).toContain('Cmaj7');
        expect(choicesFromCmaj).toContain('Gdom7');
    });

    test('Tritone subs', () => {
        expect(choicesFromCmaj).toContain('C#dom7');  // Gdom7 tritone sub
    });
});

describe('test other chord progressions', () => {
    const CMajorScale = Scale.create(allPitchesByName['C'], 'major');
    const diatonicChords = CMajorScale.diatonicTriads;

    test('Progress from V chord', () => {
        const VChord = diatonicChords[4];
        const choicesFromV = progressionChoices(VChord, CMajorScale).map(prog => prog.chord.toString());
        expect(choicesFromV.some(c => c == "Cmaj")).toBe(true)
        expect(choicesFromV.some(c => c == "Dmin")).toBe(false)
        expect(choicesFromV.some(c => c == "Emin")).toBe(false)
        expect(choicesFromV.some(c => c == "Fmaj")).toBe(false)
        expect(choicesFromV.some(c => c == "Gmaj")).toBe(true)
        expect(choicesFromV.some(c => c == "Gdom7")).toBe(true)
        expect(choicesFromV.some(c => c == "Amin")).toBe(true)
        expect(choicesFromV.some(c => c == "Bdim")).toBe(true)
    })

    test('Progress from ii chord', () => {
        const iiChord = diatonicChords[1];
        const choicesFromii = progressionChoices(iiChord, CMajorScale).map(prog => prog.chord.toString());
        expect(choicesFromii.some(c => c == "Cmaj")).toBe(false)
        expect(choicesFromii.some(c => c == "Dmin")).toBe(true)
        expect(choicesFromii.some(c => c == "Emin")).toBe(false)
        expect(choicesFromii.some(c => c == "Fmaj")).toBe(false)
        expect(choicesFromii.some(c => c == "Gmaj")).toBe(true)
        expect(choicesFromii.some(c => c == "Amin")).toBe(false)
        expect(choicesFromii.some(c => c == "Bdim")).toBe(true)
    })

    test('Progress from iv to V/ii', () => {
        const ivChord = diatonicChords[3];
        const choicesFromiv = progressionChoices(ivChord, CMajorScale)
        expect(choicesFromiv.some(c => c.chord.toString() == "Dmin")).toBe(true)
        expect(choicesFromiv.filter(c => c.chord.toString() == "Dmin")[0].reason).toContain("diatonic")
        expect(choicesFromiv.some(c => c.chord.toString() == "Adom7")).toBe(true)  // V/ii
    })

    test('Progression, IV -> iio/ii -> V7/ii -> viio/ii -> ii', () => {
        // Fmaj -> Edim -> Adom7 -> C#dim -> Dmin
        const ivChord = diatonicChords[3];
        let progs = progressionChoices(ivChord, CMajorScale)
        let nextprogs = progs.filter(c => c.chord.toString() == "Edim");
        expectContains(nextprogs.map(prog => prog.reason), (reason) => reason.includes("ii° of IV"))
        progs = progressionChoices(nextprogs[0].chord, CMajorScale)
        nextprogs = progs.filter(c => c.chord.toString() == "Adom7");
        expectContains(nextprogs.map(prog => prog.reason), (reason) => reason.includes("diatonic in D harmonicMinor"))
        progs = progressionChoices(nextprogs[0].chord, CMajorScale)
        nextprogs = progs.filter(c => c.chord.toString() == "C#dim");
        expectContains(nextprogs.map(prog => prog.reason), (reason) => reason.includes("diatonic in D harmonicMinor"))
        progs = progressionChoices(nextprogs[0].chord, CMajorScale)
        nextprogs = progs.filter(c => c.chord.toString() == "Dmin");
        expectContains(nextprogs.map(prog => prog.reason), (reason) => reason.includes("diatonic in D harmonicMinor"))
    })

    test('Progress from Edim to Cmaj', () => {
        // This is a secondary dominant: iio/ii -> VII/ii (-> ii)
        const EdimChord = Chord.create('E', 'dim');
        const choicesFromEdimChord = progressionChoices(EdimChord, CMajorScale).map(prog => prog.chord.toString());
        expect(choicesFromEdimChord.some(c => c == "Cmaj")).toBe(true)
    })

    test('Progress from Cmin to Ddim', () => {
        // This is not a secondary dominant, and should not work
        const CminChord = Chord.create('C', 'min');
        const choicesFromCminChord = progressionChoices(CminChord, CMajorScale)
        const DdimProg = choicesFromCminChord.filter(c => c.chord.toString() == "Ddim");
        if (DdimProg.length > 0) {
            expect(DdimProg[0].reason).toBe("a good reason");
        }
    })

    test('Progress from Edmin to Gmin', () => {
        // This is not a secondary dominant, and should not work
        const CminChord = Chord.create('E', 'dim');
        const choices = progressionChoices(CminChord, CMajorScale)
        const BadProg = choices.filter(c => c.chord.toString() == "Gmin");
        if (BadProg.length > 0) {
            expect(BadProg[0].reason).toBe("a good reason");
        }
    })

    test('Progress from Bdom7 to Cdom7', () => {
        // This is not a secondary dominant, and should not work
        // Apparently this is taking a tritone sub of Bbdom7, which is Fdom7

        // const Bdom7Chord = Chord.create('B', 'dom7');
        // const choicesFromBdom7Chord = progressionChoices(Bdom7Chord, CMajorScale)
        // const CDomProg = choicesFromBdom7Chord.filter(c => c.chord.toString() == "Cdom7");
        // if (CDomProg.length > 0) {
        //     expect(CDomProg[0].reason).toBe("a good reason");
        // }
    })

    test('Progress from Amin to F#dimhalf7', () => {
        //  Amin -> F#dimhalf7 works because it's iio7 / iii
        // const AminChord = Chord.create('A', 'min');
        // const choicesFromAminChord = progressionChoices(AminChord, CMajorScale)
        // const BadProg = choicesFromAminChord.filter(c => c.chord.toString() == "F#dimhalf7");
        // if (BadProg.length > 0) {
        //     expect(BadProg[0].reason).toBe("a good reason");
        // }
    })

})