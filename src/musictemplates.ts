import { Pitch, RelativePitch } from "./musicclasses";
import { RP } from "./utils";


export const allPitchesByName: {[key: string]: Pitch} = {
    "C": { degree: 0, sharp: 0 },
    "C#": { degree: 0, sharp: 1 },
    "Db": { degree: 1, sharp: -1 },
    "D": { degree: 1, sharp: 0 },
    "D#": { degree: 1, sharp: 1 },
    "Eb": { degree: 2, sharp: -1 },
    "E": { degree: 2, sharp: 0 },
    "E#": { degree: 2, sharp: 1 },
    "Fb": { degree: 3, sharp: -1 },
    "F": { degree: 3, sharp: 0 },
    "F#": { degree: 3, sharp: 1 },
    "Gb": { degree: 4, sharp: -1 },
    "G": { degree: 4, sharp: 0 },
    "G#": { degree: 4, sharp: 1 },
    "Ab": { degree: 5, sharp: -1 },
    "A": { degree: 5, sharp: 0 },
    "A#": { degree: 5, sharp: 1 },
    "Bb": { degree: 6, sharp: -1 },
    "B": { degree: 6, sharp: 0 },
    "B#": { degree: 6, sharp: 1 },
    "Cb": { degree: 0, sharp: -1 },
}


export const allPitches: Array<Pitch> = [
    { degree: 0, sharp: 0 },  // C
    { degree: 0, sharp: 1 },  // C#
    { degree: 1, sharp: -1 },  // Db
    { degree: 1, sharp: 0 },  // D
    { degree: 1, sharp: 1 },  // D#
    { degree: 2, sharp: -1 },  // Eb
    { degree: 2, sharp: 0 },  // E
    { degree: 2, sharp: 1 },  // E#
    { degree: 3, sharp: -1 },  // Fb
    { degree: 3, sharp: 0 },  // F
    { degree: 3, sharp: 1 },  // F#
    { degree: 4, sharp: -1 },  // Gb
    { degree: 4, sharp: 0 },  // G
    { degree: 4, sharp: 1 },  // G#
    { degree: 5, sharp: -1 },  // Ab
    { degree: 5, sharp: 0 },  // A
    { degree: 5, sharp: 1 },  // A#
    { degree: 6, sharp: -1 },  // Bb
    { degree: 6, sharp: 0 },  // B
    { degree: 6, sharp: 1 },  // B#
    { degree: 0, sharp: -1 },  // Cb
]


export const allowedScaleRoots = [
    allPitchesByName['C'],
    allPitchesByName['Db'],
    allPitchesByName['D'],
    allPitchesByName['Eb'],
    allPitchesByName['E'],
    allPitchesByName['F'],
    allPitchesByName['Gb'],
    allPitchesByName['G'],
    allPitchesByName['Ab'],
    allPitchesByName['A'],
    allPitchesByName['Bb'],
    allPitchesByName['B'],
]


export const pitchesBySemitone: {[key: number]: Pitch } = {
    [0]: allPitchesByName['C'],
    [1]: allPitchesByName['C#'],
    [2]: allPitchesByName['D'],
    [3]: allPitchesByName['D#'],
    [4]: allPitchesByName['E'],
    [5]: allPitchesByName['F'],
    [6]: allPitchesByName['F#'],
    [7]: allPitchesByName['G'],
    [8]: allPitchesByName['G#'],
    [9]: allPitchesByName['A'],
    [10]: allPitchesByName['A#'],
    [11]: allPitchesByName['B'],
}

export const defaultDegreeNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const degreeToSemitone: {[key: number] : number} = {
    [0]: 0,
    [1]: 2,
    [2]: 4,
    [3]: 5,
    [4]: 7,
    [5]: 9,
    [6]: 11,
}

export const scaleTemplates: {[key: string]: Array<RelativePitch>} = {
    'major': [
        RP(0),  // Perfect unison
        RP(1),  // Major second
        RP(2),  // Major third
        RP(3),  // Perfect fourth
        RP(4),  // Perfect fifth
        RP(5),  // Major sixth
        RP(6)  // Major seventh
    ],
    'minor': [
        RP(0),  // Perfect unison
        RP(1),  // Major second
        RP(2, -1),  // Minor third
        RP(3),  // Perfect fourth
        RP(4),  // Perfect fifth
        RP(5, -1),  // Minor sixth
        RP(6, -1)  // Minor seventh
    ],
    'harmonicMinor': [
        RP(0),  // Perfect unison
        RP(1),  // Major second
        RP(2, -1),  // Minor third
        RP(3),  // Perfect fourth
        RP(4),  // Perfect fifth
        RP(5, -1),  // Minor sixth
        RP(6)  // Major seventh
    ],
}


export const diatonicChordsByScale: {[key: string]: Array<string>} = {
    'major':         ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'],
    'minor':         ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'],
    'harmonicMinor': ['min', 'dim', 'maj', 'min', 'maj', 'maj', 'dim'],
}


export const chordTemplates: { [key: string]: Array<RelativePitch> } = {
    maj: [RP(0), RP(2), RP(4)],
    min: [RP(0), RP(2, -1), RP(4)],
    dim: [RP(0), RP(2, -1), RP(4, -1)],
    dim7: [RP(0), RP(2, -1), RP(4, -1), RP(5, 0)],
    dimhalf7: [RP(0), RP(2, -1), RP(4, -1), RP(6, -1)],
    aug: [RP(0), RP(2), RP(4, 1)],
    maj7: [RP(0), RP(2), RP(4), RP(6)],
    min7: [RP(0), RP(2, -1), RP(4), RP(6)],
    dom7: [RP(0), RP(2), RP(4), RP(6, -1)],
    sus2: [RP(0), RP(1), RP(4)],
    sus4: [RP(0), RP(3), RP(4)],
}
