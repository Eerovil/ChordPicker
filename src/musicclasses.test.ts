import {describe, expect, test} from '@jest/globals';
import { Chord, Scale } from './musicclasses';
import { allPitchesByName } from './musictemplates';

describe('chord degree test', () => {
    const CMajorScale = new Scale(allPitchesByName['C'], 'major');
    test('sub', () => {
        expect(new Chord(allPitchesByName['C'], 'maj').getChordDegree(CMajorScale)).toBe('I');
        expect(new Chord(allPitchesByName['D'], 'min').getChordDegree(CMajorScale)).toBe('ii');
        expect(new Chord(allPitchesByName['D'], 'maj').getChordDegree(CMajorScale)).toBe('II');
        expect(new Chord(allPitchesByName['D'], 'dom7').getChordDegree(CMajorScale)).toBe('II7');
        expect(new Chord(allPitchesByName['Db'], 'dom7').getChordDegree(CMajorScale)).toBe('bII7');
        expect(new Chord(allPitchesByName['F#'], 'maj').getChordDegree(CMajorScale)).toBe('#IV');
    });

    test('alt degree', () => {
        expect(new Chord(allPitchesByName['D'], 'maj').getAlternativeChordDegree(CMajorScale)).toBe('V/V');
        expect(new Chord(allPitchesByName['F'], 'min').getAlternativeChordDegree(CMajorScale)).toBe(undefined);
    });
});