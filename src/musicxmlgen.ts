import { Note, Scale, ScaleTemplates } from 'musictheoryjs';

import builder from 'xmlbuilder';
import { MainMusicParams } from './params';
import { Chord, DivisionedRichnotes, globalSemitone, RichNote } from './utils';

const BEAT_LENGTH = 12


const scaleToScale = (scale: any) => {
  if (!scale) {
    return scale;
  }
  if (scale instanceof Scale) {
    return scale;
  }
  return new Scale({
    key: scale._key,
    octave: scale._octave,
    template: scale._template,
  })
}

const noteToNote = (note: any) => {
  if (!note) {
    return note;
  }
  if (note instanceof Note) {
    return note;
  }
  return new Note({
    semitone: note._tone,
    octave: note._octave,
  });
}

const chordToChord = (chord: any) => {
  if (!chord) {
    return chord;
  }
  if (chord instanceof Chord) {
    return chord;
  }
  return new Chord(
    chord.root,
    chord.chordType,
  );
}

function semitoneToPitch(semitone: number, scale: Scale, direction: string = "sharp"): { noteName: string, alter: number } {
  scale = scaleToScale(scale);
  for (const note of scale.notes) {
    if (note.semitone === semitone) {
      return {
        noteName: note.toString().substring(0, 1),
        alter: 0,
      };
    }
  }
  for (const note of scale.notes) {
    if (direction == "flat" && note.semitone === semitone + 1) {
      return {
        noteName: note.toString().substring(0, 1),
        alter: -1,
      };
    }
    if (direction == "sharp" && note.semitone === semitone - 1) {
      return {
        noteName: note.toString().substring(0, 1),
        alter: 1,
      };
    }
  }
  throw new Error("Could not find note for semitone " + semitone);
}


function richNoteDuration(richNote: RichNote) {
  const duration = richNote.duration;
  let type: string = 'quarter';
  if (duration === BEAT_LENGTH * 4) {
    type = 'whole';
  }
  else if (duration === BEAT_LENGTH * 2) {
    type = 'half';
  }
  else if (duration === BEAT_LENGTH) {
    type = 'quarter';
  }
  else if (duration == BEAT_LENGTH / 2) {
    type = 'eighth';
  }
  else if (duration == BEAT_LENGTH / 4) {
    type = '16th';
  }

  return {
    'duration': duration,
    'type': type,
  }
}

const flatScaleSemitones: Set<number> = new Set([
  (new Note('F')).semitone,
  (new Note('Bb')).semitone,
  (new Note('Eb')).semitone,
  (new Note('Ab')).semitone,
]);

function noteToPitch(richNote: RichNote) {
  const note = noteToNote(richNote.note);
  const noteScale = scaleToScale(richNote.scale);
  const scoreScale = new Scale({ key: 0, octave: note.octave, template: ScaleTemplates.major })
  let direction = 'sharp';
  if (noteScale) {
    let base = noteScale.notes[0].semitone;
    if (noteScale.toString().includes('Minor')) {
      base = (base + 3) % 12;
    }
    if (flatScaleSemitones.has(base)) {
      direction = 'flat';
    }
  }
  const pitch = semitoneToPitch(note.semitone, scoreScale, direction);
  return {
    'step': { '#text': pitch.noteName },
    'alter': pitch.alter,
    'octave': { '#text': note.octave }
  };
}


type KeyChange = {
  fifths: number,
  cancel: number,
  mode: string,
}


function addRichNoteToMeasure(richNote: RichNote, measure: builder.XMLElement, staff: number, voice: number, firstNoteInChord: boolean, writeChord: boolean, keychange: KeyChange | undefined = undefined) {
  if (richNote.duration == 0) {
    return;
  }
  richNote.scale = scaleToScale(richNote.scale);
  richNote.originalScale = scaleToScale(richNote.originalScale);
  richNote.chord = chordToChord(richNote.chord);
  const duration = richNoteDuration(richNote);
  let beamNumber = 1;

  let notations = undefined;
  if (richNote.tie) {
    notations = {
      tied: {
        '@type': richNote.tie,
      }
    }
  }

  let lyric = richNote.tension && staff == 0 ? { 'text': { '#text': richNote.tension.totalTension.toFixed(2) } } : undefined

  if (richNote.scale && richNote.chord && staff == 1) {
    const roman = richNote.scale.notes.map(n => n.semitone).indexOf(richNote.chord.notes[0].semitone);
    const numberToRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    let romanNumeral = numberToRoman[roman];
    if (romanNumeral == undefined) {
      romanNumeral = '';
    }
    if (richNote.chord.chordType.includes('min')) {
      romanNumeral = romanNumeral.toLowerCase();
    }
    if (richNote.chord.chordType.includes('dim')) {
      romanNumeral = romanNumeral.toLowerCase() + '°';
    }
    if (richNote.inversionName) {
      if (richNote.chord.chordType.includes('7')) {
        if (richNote.inversionName.startsWith('first')) {
          romanNumeral = romanNumeral + '65';
        }
        else if (richNote.inversionName.startsWith('second')) {
          romanNumeral = romanNumeral + '43';
        }
        else if (richNote.inversionName.startsWith('third')) {
          romanNumeral = romanNumeral + '42';
        }
        else {
          romanNumeral = romanNumeral + '7';
        }
      } else {
        if (richNote.inversionName.startsWith('first')) {
          romanNumeral = romanNumeral + '6';
        }
        if (richNote.inversionName.startsWith('second')) {
          romanNumeral = romanNumeral + '64';
        }
      }
    }
    if (richNote.originalScale && richNote.scale.notes[0].semitone != richNote.originalScale.notes[0].semitone) {
      const currentScaleScaleIndex = richNote.originalScale.notes.map(n => n.semitone).indexOf(richNote.scale.notes[0].semitone);
      if (currentScaleScaleIndex >= 0) {
        romanNumeral = romanNumeral + '/' + numberToRoman[currentScaleScaleIndex];
      }
    }

    lyric = { 'text': { '#text': romanNumeral } }
  }

  const attrs = {
    'chord': !firstNoteInChord ? {} : undefined,
    'pitch': noteToPitch(richNote),
    'duration': duration.duration,
    'tie': richNote.tie ? { '@type': richNote.tie } : undefined,
    'voice': voice,
    'type': duration.type,
    'stem': { '#text': voice == 0 ? 'up' : 'down', '@default-y': voice == 0 ? 5 : -45 },
    'staff': staff + 1,
    'beam': richNote.beam ? { '@number': beamNumber, '#text': richNote.beam } : undefined,
    'notations': notations,
    'lyric': lyric,
  };
  if (writeChord && richNote.chord && staff == 1) {
    let chordType: string = 'major';
    const chordTemplateKey = richNote.chord.chordType;

    let kindText = chordTemplateKey;
    if (chordTemplateKey == "maj") {
      chordType = 'major';
      kindText = '';
    }
    else if (chordTemplateKey == "min") {
      chordType = 'minor';
      kindText = 'm';
    }
    else if (chordTemplateKey == "dim") {
      chordType = 'diminished';
    }
    else if (chordTemplateKey == "dim7") {
      chordType = 'diminished-seventh';
      kindText = "dim7";
    }
    else if (chordTemplateKey == "aug") {
      chordType = 'augmented';
    }
    else if (chordTemplateKey == "dom7") {
      chordType = 'dominant';
      kindText = "7";
    }
    else if (chordTemplateKey == "maj7") {
      chordType = 'major-seventh';
      kindText = "maj7";
    }
    else if (chordTemplateKey == "min7") {
      chordType = 'minor-seventh';
      kindText = "m7";
    }
    else if (chordTemplateKey == "sus2") {
      chordType = 'suspended-second';
      kindText = "sus2";
    }
    else if (chordTemplateKey == "sus4") {
      chordType = 'suspended-fourth';
      kindText = "sus4";
    }

    const scoreScale = new Scale({ key: 0, octave: 4, template: ScaleTemplates.major })
    let direction = 'sharp';
    richNote.scale = scaleToScale(richNote.scale);
    if (richNote.scale) {
      const base = richNote.scale.notes[0].semitone;
      if (flatScaleSemitones.has(base)) {
        direction = 'flat';
      }
    }
    const pitch = semitoneToPitch(noteToNote(richNote.chord.notes[0]).semitone, scoreScale, direction);

    measure.ele({
      'harmony': {
        'root': {
          'root-step': { '#text': pitch.noteName },
          'root-alter': pitch.alter,
        },
        'kind': {
          '@halign': 'center',
          '@text': kindText,
          '#text': chordType,
        }
      }
    })
  }
  if (keychange) {
    const attributes = measure.ele('attributes');
    attributes.ele({
      'key': {
        'cancel': { '#text': keychange.cancel },
        'fifths': { '#text': keychange.fifths },
        'mode': { '#text': keychange.mode },
      }
    })
  }
  measure.ele({ 'note': attrs });
}

function firstMeasureInit(voicePartIndex: number, measure: builder.XMLElement, params: MainMusicParams, separated: boolean) {
  let clef;
  const semitones = [
    globalSemitone(new Note(params.parts[0].note || "F4")),
    globalSemitone(new Note(params.parts[1].note || "C4")),
    globalSemitone(new Note(params.parts[2].note || "A3")),
    globalSemitone(new Note(params.parts[3].note || "C3")),
  ]

  let clefSemitoneIndex;
  if (voicePartIndex <= 1) {
    clefSemitoneIndex = 1;
  }
  else {
    clefSemitoneIndex = 3;
  }
  const mySemitone = semitones[clefSemitoneIndex];
  if (mySemitone < 45) {
    clef = {
      '@number': 1,
      'sign': 'F',
      'line': 4,
    };
  } else if (mySemitone < 50) {
    clef = {
      '@number': 1,
      'sign': 'G',
      'line': 2,
      'clef-octave-change': {
        '#text': '-1'
      }
    };
  } else {
    clef = {
      '@number': 1,
      'sign': 'G',
      'line': 2,
    };
  }

  measure.ele({
    'attributes': {
      'divisions': { '#text': `${BEAT_LENGTH}` },
      'key': {
        'fifths': { '#text': '0' }
      },
      'time': {
        'beats': { '#text': params.beatsPerBar },
        'beat-type': { '#text': '4' }
      },
      'staves': 1,
      clef: [
        clef
      ]
    },
    'direction': {
      '@placement': 'above',
      'direction-type': {
        'metronome': {
          'beat-unit': 'quarter',
          'per-minute': `${params.tempo || 40}`
        }
      },
      'sound': {
        '@tempo': `${params.tempo || 40}`
      }
    }
  });
  // if (separated) {
  //   measure.ele({
  //     'direction': {
  //       'sound': {
  //         '@dynamics': [0, 3].includes(voicePartIndex) ? 10: 10,
  //       }
  //     }
  //   })
  // }
}


const getScaleSharpCount = (scale: Scale) => {
  // Scale objects must be recreated as they might be plain objects
  scale = scaleToScale(scale);
  let sharpCount = 0;
  let semitone = scale.key;
  if (scale.toString().includes("Minor")) {
    semitone += 3;
    semitone = semitone % 12;
  }
  if (semitone == 11) {
    return 5;
  }
  if (semitone == 6) {
    return 6;
  }
  const baseTones = [0, 2, 4, 5, 7, 9, 11];
  if (semitone == 0 || semitone == 2 || semitone == 4 || semitone == 7 || semitone == 9) {
    // Add sharps to the scale
    for (const note of scale.notes) {
      if (!baseTones.includes(note.semitone)) {
        sharpCount++;
      }
    }
    return sharpCount;
  } else {
    // Add flats to the scale
    for (const note of scale.notes) {
      if (!baseTones.includes(note.semitone)) {
        sharpCount--;
      }
    }
    return sharpCount;
  }
}


const getKeyChange = (currentScale: Scale, richNote: RichNote) => {
  let keyChange: KeyChange | undefined = undefined
  richNote.scale = scaleToScale(richNote.scale);
  if (richNote.scale == undefined) {
    return undefined;
  }
  const prevSharpCount = getScaleSharpCount(currentScale);
  const newSharpCount = getScaleSharpCount(richNote.scale);
  let fifths = 0;
  let cancel = 0;
  if (prevSharpCount >= 0 && newSharpCount > prevSharpCount) {
    // There were sharps, and now there are more sharps
    fifths = newSharpCount - prevSharpCount;
  } else if (prevSharpCount <= 0 && newSharpCount < prevSharpCount) {
    // There were flats, and now there are more flats
    fifths = newSharpCount - prevSharpCount;
  } else if (prevSharpCount >= 0 && newSharpCount < prevSharpCount) {
    // There were sharps, and now there are fewer sharps (maybe even flats)
    for (let i = prevSharpCount; i > newSharpCount; i--) {
      if (i > 0) {
        // Turn these fifths into cancels
        cancel++;
        fifths--;
      }
      if (i < 0) {
        fifths--;
      }
    }
    //TODO
  } else if (prevSharpCount <= 0 && newSharpCount > prevSharpCount) {
    // There were flats, and now there are fewer flats (maybe even sharps)
    //TODO
    for (let i = prevSharpCount; i > newSharpCount; i++) {
      if (i < 0) {
        // Turn these flats into cancels
        cancel++;
        fifths--;
      }
      if (i < 0) {
        fifths++;
      }
    }
  }
  console.log(`currentScale: ${currentScale.toString()}, newScale: ${richNote.scale.toString()}, prevSharpCount: ${prevSharpCount}, newSharpCount: ${newSharpCount}, fifths: ${fifths}, cancel: ${cancel}`);
  return {
    fifths: newSharpCount,
    cancel: cancel,
  } as KeyChange
}


export function toXml(divisionedNotes: DivisionedRichnotes, mainParams: MainMusicParams, separated: boolean = false): string {
  const root = builder.create({ 'score-partwise': { '@version': 3.1 } },
    { version: '1.0', encoding: 'UTF-8', standalone: false },
    {
      pubID: '-//Recordare//DTD MusicXML 3.1 Partwise//EN',
      sysID: 'http://www.musicxml.org/dtds/partwise.dtd'
    }
  );
  root.ele({ 'work': { 'work-title': " " } });
  const partList = root.ele({ 'part-list': {} });
  let parts;

  if (separated) {
    partList.ele({
      'score-part': {
        '@id': 'P1',
        'part-name': {
          '#text': 'P1'
        },
        'score-instrument': {
          '@id': 'P1-I1',
          'instrument-name': {
            '#text': `${mainParams.parts[0].voice}`
          },
        },
        'midi-instrument': {
          '@id': 'P1-I1',
          'midi-channel': 1,
          'midi-program': mainParams.parts[0].voice,
          'volume': 1,
          'pan': 0
        }
      }
    });
    partList.ele({
      'score-part': {
        '@id': 'P2',
        'part-name': {
          '#text': 'P2'
        },
        'score-instrument': {
          '@id': 'P2-I1',
          'instrument-name': {
            '#text': `${mainParams.parts[1].voice}`
          },
        },
        'midi-instrument': {
          '@id': 'P2-I1',
          'midi-channel': 1,
          'midi-program': mainParams.parts[1].voice,
          'volume': 1,
          'pan': 0
        }
      }
    });

    partList.ele({
      'score-part': {
        '@id': 'P3',
        'part-name': {
          '#text': 'P3'
        },
        'score-instrument': {
          '@id': 'P3-I1',
          'instrument-name': {
            '#text': `${mainParams.parts[2].voice}`
          },
        },
        'midi-instrument': {
          '@id': 'P3-I1',
          'midi-channel': 1,
          'midi-program': mainParams.parts[2].voice,
          'volume': 1,
          'pan': 0
        }
      }
    });
    partList.ele({
      'score-part': {
        '@id': 'P4',
        'part-name': {
          '#text': 'P4'
        },
        'score-instrument': {
          '@id': 'P4-I1',
          'instrument-name': {
            '#text': `${mainParams.parts[3].voice}`
          },
        },
        'midi-instrument': {
          '@id': 'P4-I1',
          'midi-channel': 1,
          'midi-program': mainParams.parts[3].voice,
          'volume': 1,
          'pan': 0
        }
      }
    });

    parts = [
      root.ele({ 'part': { '@id': 'P1' } }),
      root.ele({ 'part': { '@id': 'P2' } }),
      root.ele({ 'part': { '@id': 'P3' } }),
      root.ele({ 'part': { '@id': 'P4' } }),
    ];

  } else {

    partList.ele({
      'score-part': {
        '@id': 'P1',
        'part-name': {
          '#text': 'P1'
        },
      }
    });
    partList.ele({
      'score-part': {
        '@id': 'P2',
        'part-name': {
          '#text': 'P2'
        },
      }
    });

    parts = [
      root.ele({ 'part': { '@id': 'P1' } }),
      root.ele({ 'part': { '@id': 'P2' } }),
    ];
  }

  const measures: Array<Array<builder.XMLElement>> = [
    [],
    [],
  ]

  if (separated) {
    measures.push([]);
    measures.push([]);
  }

  // (0 + 1) + ((0 + 1) * 2) = 1 + 2 = 3
  // 0 + 0 = 0
  // 0 + 1 = 1
  // 1 + 0 = 2
  // 1 + 1 = 3

  const maxDivision = Math.max(...Object.keys(divisionedNotes).map((k) => parseInt(k)))
  let division = 0;
  let currentScale = new Scale({ key: 0 });
  while (division <= maxDivision) {
    let keyChange;
    if (
      divisionedNotes[division] &&
      divisionedNotes[division][0] &&
      divisionedNotes[division][0].originalScale != undefined &&
      // @ts-ignore
      !currentScale.equals(divisionedNotes[division][0].originalScale)
    ) {
      keyChange = getKeyChange(currentScale, divisionedNotes[division][0]);
      // @ts-ignore
      currentScale = divisionedNotes[division][0].originalScale;
      if (keyChange && keyChange.fifths === 0 && keyChange.cancel === 0) {
        keyChange = undefined;
      }
    }
    let measureIndex = Math.floor(division / (mainParams.beatsPerBar * BEAT_LENGTH))
    for (let partIndex = 0; partIndex < 4; partIndex++) {
      let staff = partIndex <= 1 ? 0 : 1;
      if (separated) {
        staff = partIndex;
      }
      const part = parts[staff];
      const voicePartIndex = partIndex;
      if (division == 0 && (partIndex % 2 == 0 || separated)) {
        measures[staff].push(part.ele({ 'measure': { '@number': 1 } }));
        firstMeasureInit(voicePartIndex, measures[staff][measures[staff].length - 1], mainParams, separated);
      } else if (partIndex % 2 == 0 || separated) {
        measures[staff].push(
          part.ele({ 'measure': { '@number': `${(measureIndex) + 1}` } })
        );
      }
      let currentMeasure = measures[staff][measureIndex]

      // Move second voice backwards by a full measure
      if (!separated && partIndex % 2 != 0) {
        measures[staff][measures[staff].length - 1].ele({
          'backup': {
            'duration': {
              "#text": `${mainParams.beatsPerBar * BEAT_LENGTH}`,
            }
          }
        });
      }

      // Get all richNotes for this part for this measure

      for (let tmpDivision = 0; tmpDivision < mainParams.beatsPerBar * BEAT_LENGTH; tmpDivision++) {
        const measureDivision = division + tmpDivision;
        const richNotes = (divisionedNotes[measureDivision] || []).filter((rn) => rn.partIndex == partIndex);
        if (!richNotes || richNotes.length == 0) {
          continue;
        }
        const richNote = richNotes[0];
        addRichNoteToMeasure(
          richNote,
          currentMeasure,
          staff,
          separated ? 0 : partIndex % 2,
          true,
          measureDivision % BEAT_LENGTH == 0,
          (separated || partIndex % 2) ? keyChange : undefined,
        );
      }
    }
    division += mainParams.beatsPerBar * BEAT_LENGTH;
  }

  const ret = root.end({ pretty: true });
  console.groupCollapsed('Generated XML');
  console.log("Writing XML: ", ret);
  console.groupEnd();
  return ret;
}