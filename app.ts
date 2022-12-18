import { buildTables } from "musictheoryjs";
import { ChordGenerator, chordInversionsAndDoublings } from "./src/allchords";
import { chordChoiceToDivisionedNotes } from "./src/chordchoicetonotes";
import { melodyToRichNotes } from "./src/melodytorichnotes";
import { toXml } from "./src/musicxmlgen";
import { MainMusicParams } from "./src/params";
import { loadPlayer, renderMusic } from "./src/player"
import { getChordProblem, getProblemsBetweenChords } from "./src/problems";
import { ChordChoice, ChordChoicesByDivision, DivisionedRichnotes, Melody } from "./src/utils"

buildTables();

(window as any).MainMusicParams = MainMusicParams;

(window as any).loadMelody = async (melody: Melody, chords: ChordChoicesByDivision, params: MainMusicParams) => {
    const divisionedNotes: DivisionedRichnotes = {};
    melodyToRichNotes(melody, divisionedNotes, params);
    for (const division in chords) {
        chordChoiceToDivisionedNotes(chords[division], parseInt(division), divisionedNotes, params);
    }
    const scoreXml = toXml(divisionedNotes, params);
    await renderMusic(scoreXml);
}

(window as any).getChordChoices = async (prevChord: ChordChoice, nextChord: ChordChoice, params: MainMusicParams) => {
    const chordGenerator = new ChordGenerator(params);
    let chord = chordGenerator.getChord();
    const ret = [];
    while (chord) {
        for (const inversionAndDoubling of chordInversionsAndDoublings(chord)) {
            let prevProblem;
            let nextProblem;
            if (prevChord) {
                prevProblem = getProblemsBetweenChords(prevChord, inversionAndDoubling, params);
            }
            if (nextChord) {
                nextProblem = getProblemsBetweenChords(inversionAndDoubling, nextChord, params);
            }
            ret.push({
                chord,
                inversion: inversionAndDoubling.inversion,
                doubling: inversionAndDoubling.doubling,
                prevProblem,
                nextProblem,
                selfProblem: getChordProblem(inversionAndDoubling, params),
            }); 
        }
        chord = chordGenerator.getChord();
    }
    return ret;
}