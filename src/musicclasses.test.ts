import {describe, expect, test} from '@jest/globals';
import { Chord, Scale } from './musicclasses';
import { allPitchesByName } from './musictemplates';

describe('chord degree test', () => {
    const CMajorScale = Scale.create(allPitchesByName['C'], 'major');
    test('sub', () => {
        expect(Chord.create(allPitchesByName['C'], 'maj').getChordDegree(CMajorScale)).toBe('I');
        expect(Chord.create(allPitchesByName['D'], 'min').getChordDegree(CMajorScale)).toBe('ii');
        expect(Chord.create(allPitchesByName['D'], 'maj').getChordDegree(CMajorScale)).toBe('II');
        expect(Chord.create(allPitchesByName['D'], 'dom7').getChordDegree(CMajorScale)).toBe('II7');
        expect(Chord.create(allPitchesByName['Db'], 'dom7').getChordDegree(CMajorScale)).toBe('bII7');
        expect(Chord.create(allPitchesByName['F#'], 'maj').getChordDegree(CMajorScale)).toBe('#IV');
    });

    test('alt degree', () => {
        expect(Chord.create(allPitchesByName['D'], 'maj').getAlternativeChordDegree(CMajorScale)).toBe('V/V');
        expect(Chord.create(allPitchesByName['F'], 'min').getAlternativeChordDegree(CMajorScale)).toBe(undefined);
    });
});