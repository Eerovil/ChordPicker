import { ChordGenerator, chordInversionsAndDoublings } from "./src/allchords";
import { chordChoiceToDivisionedNotes } from "./src/chordchoicetonotes";
import { cleanDivisionedNotes } from "./src/cleandivisionedNotes";
import { melodyToRichNotes } from "./src/melodytorichnotes";
import { toXml } from "./src/musicxmlgen";
import { MainMusicParams } from "./src/params";
import { loadPlayer, renderMusic } from "./src/player"
import { getChordProblem, getProblemsBetweenChords } from "./src/problems";
import { ChordChoice, ChordChoicesByDivision, chordChoiceTotalScore, DivisionedRichnotes, Melody, pitchString } from "./src/utils"
import { Chord, getScale, Note, Scale } from "./src/musicclasses";
import { allPitches, allPitchesByName, chordTemplates } from "./src/musictemplates";
import { parseLilyPondString } from "./src/lilypond";

(window as any).MainMusicParams = MainMusicParams;
(window as any).CMAJ = Scale.create(allPitches[0], 'major');
(window as any).chordTypes = Object.keys(chordTemplates);
(window as any).Chord = Chord;
(window as any).Note = Note;
(window as any).Scale = Scale;
(window as any).getScale = getScale;
(window as any).pitchString = pitchString;
(window as any).chordChoiceTotalScore = chordChoiceTotalScore;

(window as any).loadMelody = async (lilyPondString: string, chords: ChordChoicesByDivision, params: MainMusicParams) => {
    const divisionedNotes: DivisionedRichnotes = {};
    parseLilyPondString(lilyPondString, divisionedNotes);
    let currentScale = getScale(allPitchesByName['C'], 'major');
    for (const division in chords) {
        chordChoiceToDivisionedNotes(chords[division], parseInt(division), divisionedNotes, params);
        if (chords[division].selectedScale) {
            currentScale = (chords[division].selectedScale as Scale);
        }
        (divisionedNotes[division] || []).forEach(rn => {
            rn.scale = currentScale;
            rn.inversion = chords[division].inversion;
        });
    }
    console.log(divisionedNotes);
    cleanDivisionedNotes(divisionedNotes, params);
    const scoreXml = toXml(divisionedNotes, params);
    await renderMusic(scoreXml);
}

(window as any).getChordChoices = async (lilyPondString: string, division: number, prevChord: ChordChoice, nextChord: ChordChoice, params: MainMusicParams) => {
    const divisionedNotes: DivisionedRichnotes = {};
    parseLilyPondString(lilyPondString, divisionedNotes);
    const chordGenerator = new ChordGenerator(params);
    const ret = [];
    for (const chord of chordGenerator.getChord()) {
        if (!chord || !chord.notes) {
            debugger;
            break;
        }
        for (const inversionAndDoubling of chordInversionsAndDoublings(chord)) {
            inversionAndDoubling.division = division;
            let prevProblem;
            let nextProblem;
            if (prevChord) {
                if (!prevChord.selectedScale) {
                    throw new Error('prevChord.selectedScale is not set');
                }
                prevProblem = getProblemsBetweenChords(prevChord, inversionAndDoubling, divisionedNotes, params);
            }
            if (nextChord) {
                nextProblem = getProblemsBetweenChords(inversionAndDoubling, nextChord, divisionedNotes, params);
            }
            ret.push({
                'name': chord.toString(),
                numeral: '',
                chord: chord,
                inversion: inversionAndDoubling.inversion,
                doubling: inversionAndDoubling.doubling,
                prevProblem,
                nextProblem,
                selfProblem: getChordProblem(inversionAndDoubling, divisionedNotes, params),
            } as ChordChoice);
            ret[ret.length - 1].totalScore = chordChoiceTotalScore(ret[ret.length - 1], params);
        }
    }
    return ret;
}