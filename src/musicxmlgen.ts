import builder from 'xmlbuilder';
import { Note, Scale, Chord } from './musicclasses';
import { allPitches } from './musictemplates';
import { MainMusicParams } from './params';
import { DivisionedRichnotes, globalSemitone, RichNote } from './utils';

const BEAT_LENGTH = 12


const scaleToScale = (scale: any) => {
  if (!scale) {
    return scale;
  }
  if (scale instanceof Scale) {
    return scale;
  }
  return Scale.fromObject(scale)
}

const noteToNote = (note: any) => {
  if (!note) {
    return note;
  }
  if (note instanceof Note) {
    return note;
  }
  return new Note(note.pitch, note.octave);
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


function richNoteDuration(richNote: RichNote) {
  const duration = richNote.duration;
  let type: string = 'quarter';
  let dotted = false;
  if (duration >= BEAT_LENGTH * 4) {
    type = 'whole';
    if (duration > BEAT_LENGTH * 4) {
      dotted = true;
    }
  }
  else if (duration >= BEAT_LENGTH * 2) {
    type = 'half';
    if (duration > BEAT_LENGTH * 2) {
        dotted = true;
    }
  }
  else if (duration >= BEAT_LENGTH) {
    type = 'quarter';
    if (duration > BEAT_LENGTH) {
        dotted = true;
    }
  }
  else if (duration >= BEAT_LENGTH / 2) {
    type = 'eighth';
    if (duration > BEAT_LENGTH / 2) {
        dotted = true;
    }
  }
  else if (duration >= BEAT_LENGTH / 4) {
    type = '16th';
    if (duration > BEAT_LENGTH / 4) {
        dotted = true;
    }
  }

  return {
    'duration': duration,
    'dotted': dotted,
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
  // const noteScale = scaleToScale(richNote.scale);
  // const scoreScale = new Scale({ key: 0, octave: note.octave, template: ScaleTemplates.major })

  const degreeName = ['C', 'D', 'E', 'F', 'G', 'A', 'B'][note.pitch.degree];
  return {
    'step': { '#text': degreeName },
    'alter': note.pitch.sharp ? note.pitch.sharp : undefined,
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

  let lyric = richNote.tension && staff == 0 ? { '@number': '1', 'text': { '#text': `${richNote.tension}` } } : undefined
  let lyric2 = undefined;

  if (richNote.scale && richNote.chord && staff == 1) {
    const romanNumeral = richNote.chord.getChordDegree(richNote.scale);
    lyric = { '@number': '1', 'text': { '#text': romanNumeral } }
    const alternativeRomanNumeral = richNote.chord.getAlternativeChordDegree(richNote.scale);
    if (alternativeRomanNumeral) {
      lyric2 = { '@number': '2', 'text': { '#text': alternativeRomanNumeral } }
    }
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
    'dot': duration.dotted ? {} : undefined,
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
    else if (chordTemplateKey == "dimhalf7") {
      chordType = 'half-diminished';
      kindText = "m7b5";
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

    const rootNote = noteToNote(richNote.chord.notes[0]);
    const degreeName = ['C', 'D', 'E', 'F', 'G', 'A', 'B'][rootNote.pitch.degree];

    measure.ele({
      'harmony': {
        'root': {
          'root-step': { '#text': degreeName },
          'root-alter': rootNote.pitch.sharp ? rootNote.pitch.sharp : undefined,
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
  const noteEle = measure.ele({ 'note': attrs });
  if (lyric2) {
    noteEle.ele({ 'lyric': lyric2 });
  }
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
  for (const pitch of scale.pitches) {
    sharpCount += pitch.sharp;
  }
  return sharpCount;
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
  let currentScale = new Scale(allPitches[0], 'major');
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