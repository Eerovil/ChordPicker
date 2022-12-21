import { buildTables, Scale } from "musictheoryjs";
import { ChordGenerator, chordInversionsAndDoublings } from "./src/allchords";
import { chordChoiceToDivisionedNotes } from "./src/chordchoicetonotes";
import { cleanDivisionedNotes } from "./src/cleandivisionedNotes";
import { melodyToRichNotes } from "./src/melodytorichnotes";
import { toXml } from "./src/musicxmlgen";
import { MainMusicParams } from "./src/params";
import { loadPlayer, renderMusic } from "./src/player"
import { getChordProblem, getProblemsBetweenChords } from "./src/problems";
import { Chord, Note, ChordChoice, ChordChoicesByDivision, chordTemplates, DivisionedRichnotes, Melody } from "./src/utils"

buildTables();

(window as any).MainMusicParams = MainMusicParams;
(window as any).CMAJ = new Scale('Cmaj');
(window as any).chordTypes = Object.keys(chordTemplates);
(window as any).Chord = Chord;
(window as any).Note = Note;

(window as any).loadMelody = async (melody: Melody, chords: ChordChoicesByDivision, params: MainMusicParams) => {
    const divisionedNotes: DivisionedRichnotes = {};
    melodyToRichNotes(melody, divisionedNotes, params);
    for (const division in chords) {
        chordChoiceToDivisionedNotes(chords[division], parseInt(division), divisionedNotes, params);
    }
    console.log(divisionedNotes);
    cleanDivisionedNotes(divisionedNotes, params);
    const scoreXml = toXml(divisionedNotes, params);
    await renderMusic(scoreXml);
}

(window as any).getChordChoices = async (melody: Melody, division: number, prevChord: ChordChoice, nextChord: ChordChoice, params: MainMusicParams) => {
    const divisionedNotes: DivisionedRichnotes = {};
    melodyToRichNotes(melody, divisionedNotes, params);
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
            let totalScore = 0;
            totalScore += ret[ret.length - 1].prevProblem?.totalScore || 0;
            totalScore += ret[ret.length - 1].nextProblem?.totalScore || 0;
            totalScore += ret[ret.length - 1].selfProblem?.totalScore || 0;
            ret[ret.length - 1].totalScore = totalScore;
        }
    }
    return ret;
}