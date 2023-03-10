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
        const divisionedNotes = parseLilyPondString("c d8 e16 f4 f8");
        expect(pitchString(divisionedNotes[0][0].note.pitch)).toBe('C')
        expect(pitchString(divisionedNotes[12][0].note.pitch)).toBe('D')
        expect(pitchString(divisionedNotes[18][0].note.pitch)).toBe('E')
        expect(pitchString(divisionedNotes[21][0].note.pitch)).toBe('F')
        expect(pitchString(divisionedNotes[33][0].note.pitch)).toBe('F')
    });
    test('a8 g a bf4. a8 g a f8. g16 g8 a4', () => {
        // a4 g a bes4 bes2 a4 g a f4. g8 g4 a2
        const divisionedNotes = parseLilyPondString("a8 g a bes4. a8 g a f8. g16 g8 a4");
        const m = 12 * 4;
        let div = 0;
        expect(pitchString(divisionedNotes[div][0].note.pitch)).toBe('A'); div += m/8;
        expect(pitchString(divisionedNotes[div][0].note.pitch)).toBe('G'); div += m/8;
        expect(pitchString(divisionedNotes[div][0].note.pitch)).toBe('A'); div += m/8;
        expect(pitchString(divisionedNotes[div][0].note.pitch)).toBe('Bb'); div += m/4 + m/8;
        expect(pitchString(divisionedNotes[div][0].note.pitch)).toBe('A'); div += m/8;
        expect(pitchString(divisionedNotes[div][0].note.pitch)).toBe('G'); div += m/8;
        expect(pitchString(divisionedNotes[div][0].note.pitch)).toBe('A'); div += m/8;
        expect(pitchString(divisionedNotes[div][0].note.pitch)).toBe('F'); div += m/8 + m/16;
        expect(pitchString(divisionedNotes[div][0].note.pitch)).toBe('G'); div += m/16;
        expect(pitchString(divisionedNotes[div][0].note.pitch)).toBe('G'); div += m/8;
        expect(pitchString(divisionedNotes[div][0].note.pitch)).toBe('A'); div += m/4;
    });
});


// c'8. d'16 e'4 c'4 a8. b16 c'4 a g8. g16 a4 b c'8. b16 a4 g c'8. d'16 e'4 c'4 a8. b16 c'4 a f'8. e'16 d'8. c'16 b8. g16 c'4 c'4