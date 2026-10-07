const app2 = (function() {
    const
        NOTE_VALUES = {
            a: 0, b: 2, c: 3, d: 5,
            e: 7, f: 8, g: 10
        },
        NOTE_FREQS = [
              14.35,     14.35,     15.35,     16.35,     17.32,     18.35,
              19.45,     20.60,     21.83,     23.12,     24.50,     25.96,
              27.50,     29.14,     30.87,     32.70,     34.65,     36.71,
              38.89,     41.20,     43.65,     46.25,     49.00,     51.91,
              55.00,     58.27,     61.74,     65.41,     69.30,     73.42,
              77.78,     82.41,     87.31,     92.50,     98.00,    103.83,
             110.00,    116.54,    123.47,    130.81,    138.59,    146.83,
             155.56,    164.81,    174.61,    185.00,    196.00,    207.65,
             220.00,    233.08,    246.94,    261.63,    277.18,    293.66,
             311.13,    329.63,    349.23,    369.99,    392.00,    415.30,
             440.00,    466.16,    493.88,    523.25,    554.37,    587.33,
             622.25,    659.25,    698.46,    739.99,    783.99,    830.61,
             880.00,    932.33,    987.77,   1046.50,   1108.73,   1174.66,
            1244.51,   1318.51,   1396.91,   1479.98,   1567.98,   1661.22,
            1760.00,   1864.66,   1975.53,   2093.00,   2217.46,   2349.32,
            2489.02,   2637.02,   2793.83,   2959.96,   3135.96,   3322.44
        ],
        INTERVAL_NAMES_FULL = {
            'M': 'Major ',
            'm': 'Minor ',
            'A': 'Augmented ',
            'P': 'Perfect ',
            'D': 'Diminished ',
            'R': 'Root Note',
            '##': 'Double sharp ',
            '♭♭': 'Double flat '
        },
        MID_FREQ = 48,
        WEIGHTS = {
            missingNote: -10,
            missingString: -15,
            missingBottomString: -25,
            fretSpan: -5,
            highFret: -20,
            bar: -15,
            baseRoot: +20
        },
        THRESHOLDS = {
            lowFret: 3,
            lowFinger: 2,
            maxFinger: 4,
            maxFretSpan: 3,
        },
        MIN_FRETS = 6,
        DEFAULT_FRETS = 8,
        CHECK_FRETS = 8,
        MAX_BAR = 8;

    let
        savedVoices = [],
        stringFreqs = [],
        stringValues = [],
        fretCount = getFrets(),
        currentVoices = [],
        currentNotes = [],
        currentVoiceNum = 0,
        noteBuffer = [],
        noteTimeouts = [];


    function update() {
        app2_inputChord.classList.remove('error');
        if (app2_inputChord.value === '') {
            currentNotes = [];
            drawFigure();
            return;
        }
        
        const CHORD = getChordFromInput(app2_inputChord.value);
        if (!CHORD) {
            app2_inputChord.classList.add('error');
            return;
        }
        
        currentNotes = CHORD;
        currentVoices = getVoicing(CHORD);
        currentVoiceNum = 0;
        
        drawFigure();
    }

    function getChordFromInput(value) {
        // Clean input
        value = value
            .replace(/^([a-z]) ([b#][0-9])/i, '$1M$2')
            .replace(/ /g, '')
            .replace(/add/ig, '&')
            .replace(/m?(o|°|diminished|dim)/ig, 'mb5')
            .replace(/m?(ø|halfdiminished|halfdim)/ig, 'mb5m7')
            .replace(/altered|alt/i,'M7#5')
            .replace(/\+|aug|augmented/ig, '#5')
            .replace(/minor|min|\-/ig, 'm')
            .replace(/major|maj|Δ|\^/ig, 'n')
            .replace(/M/g, 'n')
            .replace(/sus(pend(ed)?)?([24])?/ig, 's$3')
            .replace(/sharp/ig, '#')
            .replace(/flat|♭/ig, 'b')
            .replace(/\\/ig, '\/')
            .toLowerCase();
        
        // Error
        if (!value.match(/^[a-g][0-9nmb#s]*(&[0-9nmb#]*)?(\/[a-g][#b]?)?$/)) {
            return;
        }

        let chord = [];
        
        // Root note
        let root = value.match(/^[a-g][b#]*/)[0];
        value = value.substring(root.length);
        root = getNoteValue(root);
        chord.push({ value: root, label: 'R' });
        
        // Third
        value = value.replace(/^([nm]?)([0-9]+)/, (_, m1, m2) => m1 + (m1 || 'n') + m2);
        
        if (value[0] === 'm') {
            chord.push({
                value: root + 3,
                label: 'm3'
            });
            value = value.replace(/^m/, '');
        } else if (value.match(/s2/)) {
            chord.push({ value: root + 2, label: 'M2' });
            value = value.replace('s2', '');
        } else if (value[0] === 's') {
            chord.push({ value: root + 5, label: '4' });
            value = value.replace(/s4?/, '');
        } else {
            chord.push({ value: root + 4, label: 'M3' });
            if (value[0] == 'n') {
                value = value.substring(1);
            }
        }
        
        // Fifth
        preAdd = value.split('&')[0];
        if (preAdd.match('#5')) {
            chord.push({ value: root + 8, label: 'A5' });
            value = value.replace(preAdd, preAdd.replace(/#5/g, ''));
        } else if (preAdd.match('b5')) {
            chord.push({ value: root + 6, label: 'D5' });
            value = value.replace(preAdd, preAdd.replace(/b5/g, ''));
        } else {
            chord.push({ value: root + 7, label: '5' });
        }

        
        // Extensions
        const EX = 
            (value.match(/&?(n|m)?(b|#)?(1[0-9]|[1-9])/g) || [])
            .map(e => {
                value = value.replace(e, '')
                return {
                    note: parseInt(e.match(/[0-9]+/)),
                    acc: (e.match(/[&nmb#]*/) || [])[0]
                }
            });
        // Add implied extensions
        if (EX[0] && EX[0].note > 7 && EX[0].note % 2 && EX[0].acc[0] !== '&') {
            for (let i = EX[0].note - 2; i >= 7; i -= 2) {
                if (!EX.find(e => e.note === i)) {
                    EX.push({
                        note: i,
                        acc: (i === 7 && EX[0].acc.match(/n/) ? 'n' : '')
                    });
                }
            }
        }
        EX.forEach(e => {
            let
                label = '',
                interval = [0, 2, 4, 5, 7, 9, 11][(e.note - 1) % 7];
            if (e.note === 7) {
                if (!e.acc.match(/n/)) {
                    interval -= 1;
                    label = 'm';
                } else {
                    label = 'M';
                }
            } else {
                if (e.acc.match(/[bm]/)) {
                    interval -= 1;
                    label = [2, 3, 6].includes(e.note) ? 'm' : '<span class="flat">♭</span>';
                } else if (e.acc.match(/#/)) {
                    interval += 1;
                    label = '<span class="sharp">♯</span>';
                }
            }
            
            chord.push({
                value: root + interval + (Math.floor((e.note - 1) / 7) * 12),
                label: label + e.note
            });
        });
        
        // Slash chords
        let slash = value.match(/\/([a-g][#b]?)/);
        if (slash) {
            slash = slash[1];
            const
                SLASH_VALUE = getNoteValue(slash),
                SLASH_NOTE = chord.find(n => n.value === SLASH_VALUE);
            if (SLASH_NOTE) {
                SLASH_NOTE.slash = true;
            } else {
                chord.push({
                    value: SLASH_VALUE,
                    label: '/' + slash[0].toUpperCase() + (
                        slash[1] === 'b'
                            ? '<span class="flat">♭<span>'
                            : slash[1] === '#'
                            ? '<span class="sharp">♯</span>'
                            : ''
                    ),
                    slash: true
                });
            }
            value = value.replace('/' + slash, '');
        }

        // Err if characters remain in input
        if (value) {
            return;
        }
        
        chord = chord.sort((a, b) => a.value - b.value);
        chord.forEach(c => c.value = (c.value + 12) % 12);
        return chord;
    }

    function getNoteValue(note) {
        const VALUE =
            NOTE_VALUES[note[0]] +
            note
                .substring(1)
                .split('')
                .reduce((acc, n) => acc + (n === 'b' ? -1 : n === '#' ? 1 : 0), 0);
        return (VALUE + 12) % 12;
    }

    function setStringValues(value) {
        stringValues = value
            .match(/[a-gA-G][#b]?/g)
            .map(n => getNoteValue(n.toLowerCase()));
    }

    function setStringFreqs() {
        stringFreqs = getStringFreqs();
    }

    function getVoicing(chord) {
        // Get all note positions
        let
            notes = [],
            voices = [];
        const CHECK = Math.min(
            // For >7 strings, limit iterations to check 
            Math.max(4, CHECK_FRETS - Math.max(0, stringValues.length - 7)),
            fretCount
        );
        for (let s = 0; s < stringValues.length; s++) {
            let sn = [];
            for (let f = 0; f <= CHECK; f++) {
                if (f === 0) {
                    sn.push(-1);
                }
                if (chord.find(c => c.value === (stringValues[s] + f) % 12)) {
                    sn.push(f);
                }
            }
            notes.push(sn);
        }
        
        // Get all possible voicings
        const ITER_VOICE = (s, f, v) => {
            if (s === notes.length) {
                voices.push({
                    frets: v.split('').map(f => parseInt(f) - 1),
                    score: 0,
                    type: {}
                });
                return;
            }
            if (f === notes[s].length) {
                return;
            }
            ITER_VOICE(s + 1, 0, v + (notes[s][f] + 1));
            ITER_VOICE(s, f + 1, v);
        } 
        ITER_VOICE(0, 0, '');
        
        // Rank by missing strings (must be top or bottom, needs >= 3 strings)
        voices = voices.filter(v => {
            const MISSED = v.frets.filter(f => f === -1).length;
            v.score += WEIGHTS[v.frets[0] === -1 ? 'missingBottomString' : 'missingString'] * MISSED;
            v.type.missingStrings = MISSED;
            return (
                v.frets.length - MISSED >= 3 &&
                !v.frets.map(f => f > -1 ? 0 : 1)
                    .join('')
                    .match(/(01+0)|(10+1)/)
            );
        });
        
        // Rank by missing notes (needs root, 3rd, highest extension)
        voices = voices.filter(v => {
            let valid = true;
            v.type.missingNotes = [];
            chord.forEach((c, ci) => {
                if (!v.frets.some((f, s) =>
                        f > -1 &&
                        c.value === (stringValues[s] + f) % 12
                )) {
                    if (
                        c.label === 'R' ||
                        c.label === 'm3' ||
                        c.label === 'M3' ||
                        ci === chord.length - 1
                    ) {
                        valid = false;
                        return;
                    }
                    v.type.missingNotes.push(c.label);
                    v.score += WEIGHTS.missingNote;
                }
            });
            return valid;
        });
        
        voices = voices.filter(v => {
            // Rank by fret span (needs <= 3)
            const HIGHEST = v.frets.reduce((max, f) => Math.max(max, f), 0);
            if (
                HIGHEST -
                v.frets.reduce((min, f) => f > 0 ? Math.min(min, f) : min, fretCount) >
                THRESHOLDS.maxFretSpan - 1
            ) {
                return false;
            }
            if (HIGHEST > THRESHOLDS.lowFret) {
                v.score += WEIGHTS.highFret;
            }
            
            // Rank by finger span
            const BAR = findBar(v.frets);
            let prev = BAR ? [0, BAR.fret] : null;
            const SPAN = v.frets
                .filter(f => BAR ? f !== BAR.fret : true)
                .reduce((span, f, s) => {
                    if (f > 0) {
                        if (prev) {
                            span += (s - prev[0]) + Math.abs(f - prev[1]);
                        }
                        prev = [s, f];
                    }
                    return span;
                }, 0);
            v.score += WEIGHTS.fretSpan * SPAN;
            v.type.fingerSpan = SPAN;
            
            // Rank by fingered notes (needs <= 4 including bars)
            let count = v.frets.reduce((tot, n) => tot + (n > 0 ? 1 : 0), 0);
            if (BAR) {
                count -= v.frets.filter(f => f === BAR.fret).length - 1;
                v.score += WEIGHTS.bar;
                v.type.bar = true;
            }
            if (count > THRESHOLDS.maxFinger) {
                return false;
            }
            v.type.fingeredNotes = count;
            return true;
        });
        
        // Slash chords
        const SLASH = chord.find(v => v.slash);
        if (SLASH) {
            voices = voices.filter(v => {
                const STRING = v.frets.findLastIndex(f => f !== -1);
                return SLASH.value === (stringValues[STRING] + v.frets[STRING]) % 12
            });
        }
        
        // Rank by root in bass
        voices.forEach(v => {
            for (let s = v.frets.length - 1; s >= 0; s--) {
                if (v.frets[s] > -1) {
                    v.type.inversion = chord.findIndex(n =>
                        n.value === (v.frets[s] + stringValues[s]) % 12
                    );
                    if (v.type.inversion === 0) {
                        v.score += WEIGHTS.baseRoot;
                    }
                    break;
                }
            }
        });
        
        return voices.sort((a, b) => b.score - a.score);
    }

    // If chord has > 3 fingered notes and can be barred
    function findBar(frets) {
        if (!frets){
            return;
        }
        
        const
            LOW_FRET = frets.reduce(
                (min, f) => f > 0 ? Math.min(min, f) : min,
            CHECK_FRETS),
            HIGH_BAR = frets.lastIndexOf(LOW_FRET);

        return (
            frets.filter(f => f === LOW_FRET).length > 1 &&
            frets.filter(f => f > 0).length > 3 &&
            (
                frets.indexOf(0) === - 1 ||
                HIGH_BAR < frets.indexOf(0)
            ) &&
            HIGH_BAR <= MAX_BAR
        ) ? { fret: LOW_FRET, length: HIGH_BAR } : false;
    }

    function setCurrentVoiceNum(num) {
        currentVoiceNum = num
    }

    function getFullIntervalName(interval) {
        Object
            .keys(INTERVAL_NAMES_FULL)
            .forEach(i => interval = interval.replace(i, INTERVAL_NAMES_FULL[i]));
        interval = interval.replace(/[0-9]+/, m => m + (m === '2' ? 'nd' : m === '3' ? 'rd' : 'th'));
        return interval;
    }

    function drawFigure() {
        const
            VOICE = currentVoices[currentVoiceNum] || {frets: []},
            MID_STRING = Math.floor(stringValues.length / 2) - 1,
            BAR = findBar(VOICE.frets);
        
        app2_figure.innerHTML = 
            stringValues.reduce((html, s, si) => {
                let sHtml = '';
                for (let f = 0; f < fretCount + 1; f++) {
                    sHtml += '<td' + (
                        si === MID_STRING && f > 1 && f % 2
                            ? ' class="mark"'
                            : si === 0 && BAR && BAR.fret === f
                            ? ' class="bar-' + BAR.length + '"' : ''
                    ) + '>';

                    const N = currentNotes.find(n => n.value === (s + f) % 12);
                    if (f === 0 && VOICE.frets[si] === -1) {
                        sHtml += N
                            ? '<strong>&times;</string>'
                            : '<em>&times;</em>';
                    } else if (N) {
                        const CONTENT = `
                            ${N.label}
                            <span>${getFullIntervalName(N.label)}</span>
                        `;
                        sHtml += VOICE.frets[si] === f
                            ? `<b>${CONTENT}</b>`
                            : `<i>${CONTENT}</i>`;
                    }
                    sHtml += '</td>';
                }
                return html + `<tr>${sHtml}</tr>`;
            }, '');
        
        app2_voiceContainer.innerHTML = currentVoices
            .filter((v, i) => i < 9)
            .reduce((html, v, i) => html +
                `<button
                    onclick="
                        app2.setCurrentVoiceNum(${i});
                        app2.drawFigure();
                        app2.strum();
                    "
                    ${i === currentVoiceNum ? 'class="active"' : ''}
                >
                    ${i + 1}
                </button>`,
            '');
        
        let type = [];
        if (VOICE.type) {
            type.push(
                VOICE.type.inversion
                    ? VOICE.type.inversion +
                        ['', 'st', 'nd', 'rd', 'th'][Math.min(VOICE.type.inversion, 4)] +
                        ' inversion'
                    : 'Root position'
            );
            if (VOICE.type.missingStrings) {
                type.push(`${
                    VOICE.type.missingStrings
                } string${
                    VOICE.type.missingStrings > 1 ? 's' : ''
                } muted`);
            }
            if (VOICE.type.missingNotes.length) {
                type.push(
                    VOICE.type.missingNotes
                        .map(n => `${n}<sup>${n === 'm2' || n === 'M2' ? 'nd' : 'th'}</sup>`)
                        .join(' ') +
                        ' omitted'
                );
            }
            if (VOICE.type.bar) {
                type.push('Bar chord');
            }
            type.push(
                VOICE.type.fingeredNotes +
                ' fingered note' +
                (VOICE.type.fingeredNotes === 1 ? '' : 's')
            );
            if (VOICE.type.fingerSpan) {
                type.push('Finger span of ' + VOICE.type.fingerSpan);
            }
        }
        app2_typeContainer.innerHTML = type.reduce((html, t) => html + `<span>${t}</span>`, '');
    }

    function addToSaved(chord, label) {
        savedVoices.push({
            label: formatLabel(app2_inputChord.value),
            frets: currentVoices[currentVoiceNum].frets
        });
        
        app2_savedContainer.classList.add('active');
        drawSaved();
    }

    function removeFromSaved(index) {
        savedVoices.splice(index, 1);
        if (savedVoices.length === 0) {
            app2_savedContainer.classList.remove('active');
        }
        drawSaved();
    }

    function drawSaved() {
        app2_savedContainer.innerHTML = '';
        savedVoices.forEach((v, vi) => {
            const
                FRETS = 5,
                TOP_FRET = v.frets.reduce((max, f) => Math.max(max, f), 0),
                START = TOP_FRET > FRETS ? TOP_FRET - FRETS + 1 : 0,
                BAR = findBar(v.frets);
            let altTuning;
            if (['EBGDAE', 'GDAE'].indexOf(inputTuning.value.toUpperCase()) === -1) {
                // altTuning = inputTuning.value
                //     .match(/[A-Ga-g][b#]?/g)
                //     .map(t => t[0].toUpperCase() + (
                //         t[1] === 'b'
                //             ? '<span class="flat">♭</span>'
                //             : t[1] === '#'
                //             ? '<span class="sharp">♯</span>'
                //             : ''
                //     ))
                //     .reverse();
            }
            app2_savedContainer.innerHTML += `
                <div>
                    <button onclick="app2.removeFromSaved(${vi})">
                        &times;
                    </button>
                    <div class="table-container">
                        <table class="app2-table${START ? ' mid' : ''}">${
                            v.frets.reduce((sHtml, f, si) => {
                                sHtml += '<tr>';
                                for (let i = START; i <= START + FRETS; i++) {
                                    sHtml += `<td${
                                        (BAR && i === BAR.fret && si === 0)
                                            ? ' class="bar-' + BAR.length + '"'
                                            : ''
                                    }>${
                                        i > START && i === f
                                            ? '<b>&nbsp;</b>'
                                            : i === START && f === -1
                                            ? '<em>&times;</em>'
                                            : i === START && altTuning
                                            ? '<span class="note">' + altTuning[si] + '</span>'
                                            : ''
                                    }${
                                        START &&
                                        si === stringValues.length - 2 &&
                                        i === START + 1
                                            ? '<span class="num">' + (START + 1) + '</span>' : ''
                                    }</td>`;
                                }
                                return sHtml + '</tr>';
                            }, '')
                        }</table>
                    </div>
                    <h3>${v.label}</h3>
                </div>
            `;
        });
    }

    function formatLabel(label) {
        label = label[0].toUpperCase() +
            label.substring(1)
                .replace(/ /g, '')
                .replace(/&|(add)/ig, 'add')
                .replace(/dim|°/ig, 'o')
                .replace(/\aug/ig, '+')
                .replace(/minor|min/ig, 'm')
                .replace(/min|\-/ig, 'm')
                .replace(/major|maj|Δ|\^/ig, 'M')
                .replace(/sharp|#/ig, '♯')
                .replace(/flat|b/ig, '♭')
                .replace(/\\/ig, '\/');
        const PARTS = label.match(/^([A-G][♭♯]?m?(?:M$)?\+?)([^/]*)?(\/[A-Ga-g])?/);
        label =
            PARTS[1] +
            (PARTS[2] ? `<sup>${PARTS[2]}</sup>` : '') +
            (PARTS[3] ? PARTS[3].toUpperCase() : '');
        return label
            .replace(/add/g, '<span class="add">$&</span>')
            .replace(/♭/g, '<span class="flat">$&</span>')
            .replace(/♯/g, '<span class="sharp">$&</span>');
    }

    function getFrets() {
        return window.innerWidth < 440 ? MIN_FRETS : DEFAULT_FRETS;
    }

    function getStringFreqs() {
        const MID_STRING = Math.floor((stringValues.length - 1) / 2);
        let freq = stringValues.map(s => s);
        
        for (let i = MID_STRING + 1; i < stringValues.length; i++) {
            while (freq[i] > freq[i - 1] && freq[i] - 12 + MID_FREQ >= 0) {
                freq[i] -= 12;
            }
        }
        for (let i = MID_STRING - 1; i >= 0; i--) {
            while (freq[i] < freq[i + 1] && freq[i] + 12 + MID_FREQ <= NOTE_FREQS.length) {
                freq[i] += 12;
            }
        }
        
        return freq.map(f => MID_FREQ + f);
    }

    const
        AUDCTX = new AudioContext(),
        GAIN = AUDCTX.createGain();
    GAIN.connect(AUDCTX.destination);

    function strum() {
        if (!currentVoices.length) {
            return;
        }
        
        const
            VOICE = currentVoices[currentVoiceNum].frets,
            NOTES = VOICE
                .map((f, s) => f === -1 ? 0 : NOTE_FREQS[stringFreqs[s] + f])
                .filter(s => s)
                .reverse(),
            VOLUMNE = 1 / NOTES.length,
            INTERVAL = 150,
            SUSTAIN = 1300,
            FADE = 700;
        
        stopNote();
        GAIN.gain.value = VOLUMNE;
        
        NOTES.forEach((freq, i) => noteTimeouts.push(setTimeout(() =>
            playNote(freq, SUSTAIN + (INTERVAL * (NOTES.length - i))),
            INTERVAL * i
        )));
        for (let i = 0; i < FADE; i++) {
            noteTimeouts.push(setTimeout(
                () => GAIN.gain.value = VOLUMNE * (i / FADE),
                (INTERVAL * NOTES.length) + SUSTAIN - i
            ));
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

    function addFret() {
        fretCount += 1;
    }
    
    function removeFret() {
        fretCount -= fretCount > MIN_FRETS ? 1 : 0;
    }

    window.addEventListener('onresize', () => {
        let f = fretCount;
        fretCount = getFrets();
        if (fretCount !== f) {
            drawFigure();
        }
    });

    window.addEventListener('load', () => {
        app2_inputChord.focus();
        app2_inputChord.selectionStart = app2_inputChord.selectionEnd = app2_inputChord.value.length;
    });

    return {
        update,
        drawFigure,
        strum,
        setCurrentVoiceNum,
        removeFromSaved,
        addToSaved,
        addFret,
        removeFret,
        setStringValues,
        setStringFreqs
    };
})();