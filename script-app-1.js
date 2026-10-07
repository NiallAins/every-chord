const app1 = (function() {
    const
        NOTE_VALUES = {
            a: 0, b: 2, c: 3, d: 5,
            e: 7, f: 8, g: 10
        },
        INTERVAL_NAMES = [
            ['R'],
            ['', 'm2', 'M2', 'A2', '##2'],
            ['', '', '♭♭3', 'm3', 'M3', 'A3', '##3'],
            ['', '', '', '♭♭4', 'D4', 'P4', 'A4', '##4'],
            ['', '', '', '', '', '♭♭5', 'D5', 'P5', 'A5', '##5', '', ''],
            ['', '', '', '', '', '', '', '♭♭6', 'm6', 'M6', 'A6', '##6'],
            ['', '', '', '', '', '', '', '', '', '♭♭7', 'm7', 'M7']
        ],
        INTERVAL_NAMES_FULL = {
            'M': 'Major ',
            'm': 'Minor ',
            'A': 'Augmented ',
            'P': 'Perfect ',
            'D': 'Diminished ',
            'R': 'Root Note',
            '##': 'Double sharp ',
            '♭♭': 'Double flat ',
            '2': '2nd',
            '3': '3rd',
            '4': '4th',
            '5': '5th',
            '6': '6th',
            '7': '7th'
        },
        CHORD_NAMES_FULL = [
            ['o', ' diminished ', 'dim'],
            ['ø', ' half-diminished ', 'm7b5'],
            ['Δ7', ' maj7'],
            ['Δ9', ' maj9'],
            ['+7', ' augmented 7 ', 'aug7'],
            ['+9', ' augmented 9 ', 'aug9'],
            ['+', ' augmented ', 'aug'],
            ['♭9', ' ♭n', '♭n'],
            ['♭7', ' ♭s', '♭s'],
            ['#9', ' #n', '#n'],
            ['#7', ' #s', '#s'],
            ['7', ' min7', 'm7'],
            ['9', ' min9', 'm9'],
            ['♭n', ' ♭9', '♭9'],
            ['♭s', ' ♭7', '♭7'],
            ['#n', ' #9', '#9'],
            ['#s', ' #7', '#7'],
            ['alt', ' maj7 ♭9', 'M7♭9']
            
        ],
        CHORD_NUMS = [
            'i', 'ii', 'iii',
            'iv', 'v', 'vi', 'vii'
        ],
        CHORD_NAMES = [
            ['6', 'o', '', 'diminished'],
            ['8', '', '+', 'augmented'],
            ['69', 'o7'],
            ['610', 'ø'],
            ['710', '7'],
            ['711', 'Δ7'],
            ['811', '7', '+'],
            ['691', 'o♭9'],
            ['692', 'o♭'],
            ['6101', 'ø♭9'],
            ['6102', 'ø9'],
            ['7101', '7♭9'],
            ['7102', '9'],
            ['7111', 'Δ7♭9'],
            ['7112', 'Δ9'],
            ['7113', 'Δ7#9'],
            ['8112', '9', '+'],
            ['8113', 'alt']
        ],
        EXTENSIONS = [
            'Triads',
            '7ths',
            '9ths'
        ],
        SCALES = {
            'Major': {
                intervals: [2, 2, 1, 2, 2, 2, 1],
                modes: [
                    'Major', 'Dorian', 'Phrygian',
                    'Lydian', 'Mixolydian',
                    'Aeolian', 'Locrian'
                ],
            },
            'Minor': {
                intervals: [2, 1, 2, 2, 1, 2, 2],
                modes: [
                    'Minor', 'Locrian', 'Ionian',
                    'Dorian', 'Phrygian',
                    'Lydian', 'Mixolydian'
                ]
            },
            'Harmonic Major': {
                intervals: [2, 2, 1, 2, 1, 3, 1],
                modes: [
                    'Harmonic Major',
                    'Dorian ♭5',
                    'Phrygian ♭4',
                    'Lydian Diminished',
                    'Mixolydian',
                    'Lydian Augmented #2',
                    'Diminished Blues ♭9'
                ]
            },
            'Harmonic Minor': {
                intervals: [2, 1, 2, 2, 1, 3, 1],
                modes: [
                    'Harmonic Minor',
                    'Locrian ♮6',
                    'Ionian #5',
                    'Ukrainian Dorian',
                    'Phrygian dominant',
                    'Lydian #2',
                    'Super-Locrian ♭♭7'
                ]
            },
            'Whole Tone': {
                intervals: [2, 2, 2, 2, 2, 2],
                modes: [
                    'Whole Tone Scale', 'Whole Tone Scale',
                    'Whole Tone Scale', 'Whole Tone Scale',
                    'Whole Tone Scale', 'Whole Tone Scale'
                ]
            },
            'Melodic Minor': {
                intervals: [2, 1, 2, 2, 2, 2, 1],
                modes: [
                    'Melodic Minor',
                    'Dorian ♭2',
                    'Lydian Augmented',
                    'Lydian Dominant',
                    'Mixolydian ♭6',
                    'Aeolian b5',
                    'Super-Locrian'
                ]
            }
        },
        MODES = [
            '1st Mode', '2', '3',
            '4', '5', '6', '7'
        ],
        MIN_FRETS = 6,
        DEFAULT_FRETS = 8,
        NOTE_FREQS = [
            185.00, 196.00,    207.65,
            220.00,    233.08,    246.94,    261.63,    277.18,    293.66,
            311.13,    329.63,    349.23,    369.99,    392.00,    415.30,
            440.00,    466.16,    493.88,    523.25,    554.37,    587.33,
            622.25,    659.25,    698.46,    739.99,    783.99,    830.61,
            880.00,    932.33,    987.77, 1046.50, 1108.73, 1174.66,
            1244.51, 1318.51, 1396.91, 1479.98, 1567.98, 1661.22
        ],
        FREQ_INIT = 3;

    let
        fretCount = getFrets(),
        stringValues = [],
        currentNotes = [],
        currentChords = [],
        currentKey = 0,
        currentAcc = 0,
        currentMode = 0,
        currentScale = 'Major',
        currentChord = -1,
        currentExtension = 3,
        noteBuffer = [],
        noteTimeouts = [];

    function update() {
        getNotes();
        getChords();
        drawFigure();
    }

    function getNoteValue(note) {
        let v = NOTE_VALUES[note[0]];
        v += note[1] === '#'
            ? 1
            : note[1] === 'b'
            ? -1
            : 0;
        return v === -1 ? 11 : v;
    }

    function setStringValues(value) {
        stringValues = value
            .match(/[a-gA-G][#b]?/g)
            .map(n => getNoteValue(n.toLowerCase()));
    }

    function getNotes() {
        const SCALE = SCALES[currentScale].intervals;
        let
            note = (currentKey + currentAcc + 12) % 12,
            interval = 0;
        
        currentNotes = [];
        for (let i = 0; i < SCALE.length; i++) {
            currentNotes.push({
                value: note,
                label: INTERVAL_NAMES[i][interval]
            });
            const DIFF = SCALE[(i + currentMode) % SCALE.length];
            interval += DIFF;
            note = (note + DIFF) % 12;
        }
    }

    function getChordRoot(chordNum) {
        const
            NOTES = Object.keys(NOTE_VALUES),
            ROOT =
                ['a', 'b', 'c', 'd', 'e', 'f', 'g']
                    .indexOf('aabccddeffgh'[currentKey]),
            INTERVALS = SCALES[currentScale].intervals,
            NOTE = NOTES[(ROOT + chordNum) % NOTES.length];
        
        let interval = 0;
        for (let i = 0; i < chordNum; i++) {
            interval += INTERVALS[(i + currentMode) % INTERVALS.length];
        }
        let acc = (
            (currentKey + currentAcc + interval - NOTE_VALUES[NOTE] + 12)
            % 12
        );
        acc = acc > 6 ? 12 - acc : acc;
        
        return NOTE.toUpperCase() +
            ['♭♭♭', '♭♭', '♭', '', '#', '##', '###'][acc + 3];
    }

    function getChords() {
        currentChords = currentNotes.map((_, i) => {
            let notes = [];
            for (let t = 0; t < currentExtension; t++) {
                notes.push(
                    currentNotes[(i + (t * 2)) % currentNotes.length].value
                );
            }
            
            return {
                notes,
                label: getChordName(i, notes, false),
                fullLabel: getChordName(i, notes, true)
            };
        });
    }

    function getChordName(num, notes, nameNote) {
        notes = notes
            .map(n => (n - notes[0] + 12) % 12)
            .filter((n, i, arr) => arr.indexOf(n) === i)
            .join('');
        const AFFIX = CHORD_NAMES.find(n => n[0] === notes.substring(2));
        
        return (
            nameNote
                ? getChordRoot(num) + (notes[1] === '3' ? 'm' : '')
                : notes[1] === '3'
                ? CHORD_NUMS[num]
                : CHORD_NUMS[num].toUpperCase()
            ) + 
            (AFFIX && AFFIX[2] ? AFFIX[2] : '') +
            (AFFIX && AFFIX[1] ? '<sup>' + AFFIX[1] + '</sup>' : '') +
            (
                notes[1] === 2
                    ? 'sus2'
                    : notes[1] === 5
                    ? 'sus' : ''
            );
    }

    function getFullIntervalName(interval) {
        Object
            .keys(INTERVAL_NAMES_FULL)
            .forEach(i => interval = interval.replace(i, INTERVAL_NAMES_FULL[i]));
        return interval;
    }

    function setCurrentKey(key) {
        currentKey = key;
    }

    function setCurrentAcc(acc) {
        currentAcc = acc;
    }

    function setCurrentScale(scale) {
        currentScale = scale;
    }

    function setCurrentMode(mode) {
        currentMode = mode;
    }

    function setCurrentChord(chord) {
        currentChord = chord;
    }

    function setCurrentExtension(extension) {
        currentExtension = extension;
    }

    function drawFigure() {
        const MID_STRING = Math.floor(stringValues.length / 2) - 1;
        app1_inputContainer.innerHTML = `
            <div>${
                    Object.keys(NOTE_VALUES).reduce((htm, n) => htm + `
                        <button
                            ${currentKey === NOTE_VALUES[n] ? 'class="active"' : ''}
                            onclick="
                                app1.setCurrentKey(${NOTE_VALUES[n]});
                                app1.update();
                                app1.play();
                            "
                        >
                            ${n.toUpperCase()}
                        </button>
                    `, '')
            }</div>
            <div>${
                    ['♭', '♮', '#'].reduce((htm, n, i) => htm + `
                        <button
                            ${currentAcc === i - 1 ? 'class="active"' : ''}
                            onclick="
                                app1.setCurrentAcc(${i - 1});
                                app1.update();
                                app1.play();
                            "
                        >
                            ${n}
                        </button>
                    `, '')
            }</div>
            <br/>
            <div>${
                    Object.keys(SCALES).reduce((htm, s, i) => htm + `
                        <button
                            ${currentScale === s ? 'class="active"' : ''}
                            onclick="
                                app1.setCurrentScale('${s}');
                                app1.setCurrentMode(Math.min(${
                                    currentMode
                                }, ${
                                    SCALES[s].modes.length - 1
                                }));
                                app1.setCurrentChord(Math.min(${
                                    currentChord
                                }, ${
                                    SCALES[s].modes.length - 1
                                }));
                                app1.update();
                                app1.play();
                            "
                        >
                            ${s}
                        </button>
                        ${i % 2 ? '</div><div>': ''}
                    `, '')
            }</div>
            <div>${
                    SCALES[currentScale].modes.reduce((htm, _, i) => htm + `
                        <button
                            ${currentMode === i ? 'class="active"' : ''}
                            onclick="
                                app1.setCurrentMode(${i});
                                app1.update();
                                app1.play();
                            "
                        >
                            ${MODES[i]}
                        </button>
                    `, '')
            }</div>`;
        app1_figure.innerHTML = 
            stringValues.reduce((html, s, si) => {
                let sHtml = '';
                for (let f = 0; f < fretCount + 1; f++) {
                    sHtml += '<td' + (
                        si === MID_STRING && f > 1 && f % 2
                            ? ' class="mark"'
                            : ''
                    ) + '>';
                    const N = currentNotes.find(n => n.value === (s + f) % 12);
                    if (N) {
                        const EL = 
                            currentChord > -1 &&
                            currentChords[currentChord].notes.includes(N.value)
                                ? 'b' : 'i';
                        sHtml += `<${EL}>
                            ${N.label}
                            <span>${getFullIntervalName(N.label)}</span>
                        </${EL}>`;
                    }
                    sHtml += '</td>';
                }
                return html + `<tr>${sHtml}</tr>`;
            }, '');
        
        app1_chords.innerHTML = `
            <div>${
                currentChords.reduce((htm, c, i) => htm + `
                    <button
                        class="
                            music-note
                            ${currentChord === i ? 'active' : ''}
                        "
                        onclick="
                            app1.setCurrentChord(${i});
                            app1.update();
                            app1.play();
                        "
                    >
                        ${c.label}
                    </button>
                `, '')
            }<button
                    class="chord-clear"
                    onclick="
                        app1.setCurrentChord(-1);
                        app1.update();
                        app1.play();
                    "
                >
                    &nbsp;&times;&nbsp;
                </button>
            </div>
            <div>${
                EXTENSIONS.reduce((htm, e, i) => htm + `
                    <button
                        ${currentExtension === i + 3 ? 'class="active"' : ''}
                        onclick="
                            app1.setCurrentExtension(${i + 3});
                            app1.update();
                            app1.play(true);
                        "
                    >
                        ${e}
                    </button>
                `, '')
            }</div>`;
        
        let desc = [];
        desc.push(
            'AABCCDDEFFGG'[currentKey] +
            ['♭','', '#'][currentAcc + 1] + ' ' +
            SCALES[currentScale].modes[currentMode]
        );
        if (currentMode === 0) {
            desc.push('1st mode');
        } else {
            desc.push(
                (currentMode + 1) + (
                    currentMode === 1
                        ? 'nd'
                        : currentMode === 2
                        ? 'rd' : 'th'
                ) + ' mode of ' + currentScale
            );
        }
        if (currentChord !== -1) {
            let chordLong = currentChords[currentChord].fullLabel.replace(/<.*?>/g, '');
            CHORD_NAMES_FULL.forEach(sym => chordLong = chordLong.replace(sym[0], sym[1]));
            let chordShort = chordLong;
            CHORD_NAMES_FULL
                .filter(sym => sym[2])
                .forEach(sym => chordShort = chordShort.replace(sym[1], sym[2]));
            chordShort = chordShort.replace(/ /g, '');
            chordShort = chordShort.replace(/mm/g, 'm');

            desc.push(
                '<span class="music-note">' +
                    currentChords[currentChord].label + 
                '</span> chord'
            );
            desc.push(`
                <span class="music-note">
                    ${chordLong}
                </span>
                <button
                    class="notes-goto"
                    onclick="document.body.classList.remove('tab-one')"
                >
                    Find voicings
                </button>
            `);

            app2_inputChord.value = chordShort; 
            app2.update();
        }
        app1_chords.innerHTML += `
            <div class="notes">
                ${desc.reduce((htm, d, di, dArr) => htm +`<span> ${d} </span>`, '')}
            </div>
        `;
    }

    const
        AUDCTX = new AudioContext(),
        GAIN = AUDCTX.createGain();
    GAIN.connect(AUDCTX.destination);

    function play(onlyChord) {
        if (currentChord === -1) {
            if (onlyChord) {
                return;    
            }
            
            const
                INTERVALS = SCALES[currentScale].intervals,
                VOLUMNE = 0.5,
                SUSTAIN = 200;

            let notes = [currentKey + currentAcc];
            for (let i = 0; i < INTERVALS.length; i++) {
                notes.push(
                    notes[notes.length - 1] +
                    INTERVALS[(i + currentMode) % INTERVALS.length]
                );
            }

            stopNote();
            GAIN.gain.value = VOLUMNE;

            notes.forEach((n, i) => noteTimeouts.push(
                setTimeout(() =>
                    playNote(NOTE_FREQS[FREQ_INIT + n], SUSTAIN),
                    SUSTAIN * i
                )
            ));
        } else {
            let notes = currentChords[currentChord].notes.map(n => n);
            for (let i = 0; i < notes.length; i++) {
                while (notes[i] < notes[i - 1]) {
                    notes[i] += 12;
                }
            }
            if (notes.length < 5) {
                notes.push(currentChords[currentChord].notes[0] + 12);
            }

            const
                VOLUMNE = 1 / notes.length,
                INTERVAL = 150,
                SUSTAIN = 1300,
                FADE = 700;

            stopNote();
            GAIN.gain.value = VOLUMNE;

            notes.forEach((n, i) => noteTimeouts.push(setTimeout(() =>
                playNote(
                    NOTE_FREQS[FREQ_INIT + n],
                    SUSTAIN + (INTERVAL * (notes.length - i))
                ),
                INTERVAL * i
            )));
            for (let i = 0; i < FADE; i++) {
                noteTimeouts.push(setTimeout(
                    () => GAIN.gain.value = VOLUMNE * (i / FADE),
                    (INTERVAL * notes.length) + SUSTAIN - i
                ));
            }
        }
    }

    function playNote(freq, duration) {
        const OSC = AUDCTX.createOscillator();
        OSC.connect(GAIN);
        OSC.type = 'triangle';
        OSC.frequency.value = freq;
        OSC.start();
        noteBuffer.push(OSC);
        
        setTimeout(() => stopNote(OSC), duration);
    }

    function stopNote(note) {
        if (note) {
            note.stop();
            noteBuffer.splice(noteBuffer.indexOf(note), 1);
        } else {
            noteTimeouts.forEach(t => clearTimeout(t));
            noteTimeouts = [];
            noteBuffer.forEach(n => n.stop());
            noteBuffer = [];
        }
    }

    function getFrets() {
        return window.innerWidth < 440 ? MIN_FRETS : DEFAULT_FRETS;
    }

    function addFret() {
        fretCount += 1;
    }

    function removeFret() {
        fretCount -= fretCount > MIN_FRETS ? 1 : 0;
    }

    window.addEventListener('resize', () => {
        let f = fretCount;
        fretCount = getFrets();
        if (fretCount !== f) {
            drawFigure();
        }
    });

    return {
        play,
        update,
        setCurrentKey,
        setCurrentAcc,
        setCurrentScale,
        setCurrentMode,
        setCurrentChord,
        setCurrentExtension,
        setStringValues,
        addFret,
        removeFret
    };
})();
