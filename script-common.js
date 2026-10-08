function addFret() {
    app1.addFret();
    app2.addFret();
    app1.update();
    app2.update();
}

function removeFret() {
    app1.removeFret();
    app2.removeFret();
    app1.update();
    app2.update();
}

function updateTuning() {
    inputTuning.classList.remove('error');
    let value = inputTuning.value.replace(/ /, '');
    value = value
        .replace(/sharp/ig, '#')
        .replace(/flat|♭/ig, 'b');
    
    if (
        !value.match(/^([a-gA-G][#b]?)+$/) ||
        value.match(/[a-gA-G][#b]?/g)?.length < 3
    ) {
        inputTuning.classList.add('error');
        return;
    }
    
    app1.setStringValues(value);
    app2.setStringValues(value);

    app2.setStringFreqs();
    
    app1.update(true);
    app2.update();
}

updateTuning();