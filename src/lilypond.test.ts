import {describe, expect, test} from '@jest/globals';
import { parseLilyPondString } from './lilypond';
import { pitchString } from './utils';

describe('lilypond test', () => {
    test('parse lilypond string', () => {
        const divisionedNotes = parseLilyPondString("c,, d e'' f fis");
        expect(pitchString(divisionedNotes[0][0].note.pitch)).toBe('C')
        expect(pitchString(divisionedNotes[12][0].note.pitch)).toBe('D')
        expect(pitchString(divisionedNotes[24][0].note.pitch)).toBe('E')
        expect(pitchString(divisionedNotes[36][0].note.pitch)).toBe('F')
        expect(pitchString(divisionedNotes[48][0].note.pitch)).toBe('F#')
    
        expect(divisionedNotes[0][0].note.octave).toBe(2);
        expect(divisionedNotes[12][0].note.octave).toBe(4);
        expect(divisionedNotes[24][0].note.octave).toBe(6);
        expect(divisionedNotes[36][0].note.octave).toBe(4);
        
    });
    test('parse another lilypond string', () => {
        const divisionedNotes = parseLilyPondString("c d8 e16 f");
        expect(pitchString(divisionedNotes[0][0].note.pitch)).toBe('C')
        expect(pitchString(divisionedNotes[12][0].note.pitch)).toBe('D')
        expect(pitchString(divisionedNotes[18][0].note.pitch)).toBe('E')
        expect(pitchString(divisionedNotes[21][0].note.pitch)).toBe('F')
    });
});
