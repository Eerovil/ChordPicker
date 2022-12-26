import {describe, expect, test} from '@jest/globals';

import { allPitches, allPitchesByName } from "./musictemplates";
import { getRP, PitchPlusRP, pitchString, pitchToSemitone, relativePitchName, semitoneDistance } from './utils';

describe('check semitone distance calculations', () => {
  test('semitone distance', () => {
    expect(semitoneDistance(0, 0)).toBe(0);
    expect(semitoneDistance(0, 1)).toBe(1);
    expect(semitoneDistance(0, 2)).toBe(2);
    expect(semitoneDistance(1, 1)).toBe(0);
    expect(semitoneDistance(1, 2)).toBe(1);

    expect(semitoneDistance(2, 1)).toBe(-1);
    expect(semitoneDistance(2, 0)).toBe(-2);
    expect(semitoneDistance(2, 11)).toBe(-3);

    expect(semitoneDistance(0, 11)).toBe(-1);
    expect(semitoneDistance(0, 12)).toBe(0);
    expect(semitoneDistance(0, 10)).toBe(-2);

    expect(semitoneDistance(7, 11)).toBe(4);
    expect(semitoneDistance(6, 11)).toBe(5);
    expect(semitoneDistance(7, 0)).toBe(5);
    expect(semitoneDistance(5, 11)).toBe(-6);  // This can be -6 or 6, tritone
    expect(semitoneDistance(4, 11)).toBe(-5);
  })
})

describe('check some relative pitches', () => {
    test('C to D is a major second', () => {
      expect(relativePitchName(getRP(allPitchesByName['C'], allPitchesByName['D']))).toBe('major second');
      expect(pitchString(PitchPlusRP(allPitchesByName['C'], {degree: 1, sharp: 0}))).toBe('D');
    });
    test('C to C# is an augmented unison', () => {
      expect(relativePitchName(getRP(allPitchesByName['C'], allPitchesByName['C#']))).toBe('augmented unison');
      expect(pitchToSemitone({degree: 0, sharp: 0})).toBe(0)
      expect(pitchToSemitone({degree: 0, sharp: 1})).toBe(1)
      expect(pitchString(PitchPlusRP(allPitchesByName['C'], {degree: 0, sharp: 1}))).toBe('C#');
    });
    test('E to F is a minor second', () => {
      expect(relativePitchName(getRP(allPitchesByName['E'], allPitchesByName['F']))).toBe('minor second');
      expect(pitchString(PitchPlusRP(allPitchesByName['E'], {degree: 1, sharp: -1}))).toBe('F');
    });
    test('Eb to F# is an augmented second', () => {
      expect(relativePitchName(getRP(allPitchesByName['Eb'], allPitchesByName['F#']))).toBe('augmented second');
      expect(pitchString(PitchPlusRP(allPitchesByName['Eb'], {degree: 1, sharp: 1}))).toBe('F#');
    });
    test('Eb to E# is an 2 unison', () => {
      expect(relativePitchName(getRP(allPitchesByName['Eb'], allPitchesByName['E#']))).toBe('2 unison');
      expect(pitchString(PitchPlusRP(allPitchesByName['Eb'], {degree: 0, sharp: 2}))).toBe('E#');
    });
    test('F to E is a major 7th', () => {
      expect(relativePitchName(getRP(allPitchesByName['F'], allPitchesByName['E']))).toBe('major seventh');
      expect(pitchString(PitchPlusRP(allPitchesByName['F'], {degree: 6, sharp: 0}))).toBe('E');
    });
    test('A to D is a perfect fourth', () => {
      expect(relativePitchName(getRP(allPitchesByName['A'], allPitchesByName['D']))).toBe('perfect fourth');
      expect(pitchString(PitchPlusRP(allPitchesByName['A'], {degree: 3, sharp: 0}))).toBe('D');
    });
  });