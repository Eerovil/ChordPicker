import { melodyToRichNotes } from "./src/melodytorichnotes";
import { toXml } from "./src/musicxmlgen";
import { MainMusicParams } from "./src/params";
import { loadPlayer, renderMusic } from "./src/player"
import { DivisionedRichnotes, Melody } from "./src/utils"

(window as any).MainMusicParams = MainMusicParams;

(window as any).loadMelody = async (melody: Melody, params: MainMusicParams) => {
    const divisionedNotes: DivisionedRichnotes = {};
    melodyToRichNotes(melody, divisionedNotes, params);
    const scoreXml = toXml(divisionedNotes, params);
    await renderMusic(scoreXml);
}