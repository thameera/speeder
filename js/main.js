var STATE = {
	Empty: 		{value: 0, text: 'Empty'},
	Loaded: 	{value: 1, text: 'Loaded'},
	Reading: 	{value: 2, text: 'Reading'},
	Paused: 	{value: 3, text: 'Paused'},
	Modal:		{value: 4, text: 'Modal'}, 
	Options:	{value: 5, text: 'Options'} 
};

var wpm = 300;
var chunk = 3;
var chunkLen = 20;
var txt;
var wpmdelta = 50;
var canStore = 0;

var eState = STATE.Empty;
var ePrevState = STATE.Empty;

$(document).ready(function(){
	checkLocalStorageSupport();
	loadState();

	InitEngine();
	setupAttributes();
	onNewText();
});

function onKeyPress(event) {
	var k = (event.keyCode ? event.keyCode : event.which);

	if (eState == STATE.Modal || eState == STATE.Options) return;

	if (k == 78 || k == 110) { // N pressed
		Engine.pause();
		$('#txtaInput').focus();
		changeState(STATE.Modal);
		$('#modalInput').modal('show');
	}
	else if (k == 79 || k == 111) { // O pressed
		Engine.pause();
		$('#optionsWPM').focus();
		changeState(STATE.Options);
		$('#modalOptions').modal('show');
	}
	else if (k == 82 || k == 114) { // R pressed
		Engine.reset();
		$('#divCanvas').text(Engine.getNextChunk());
	}
	else if (k == 32) { // Space pressed
		if (eState == STATE.Loaded) {
			changeState(STATE.Reading);
			Engine.start();
		}
		else if (eState == STATE.Reading) {
			Engine.pause();
		}
		else if (eState == STATE.Paused) {
			changeState(STATE.Reading);
			Engine.resume();
		}
	}
	else if (k == 71 || k == 103) { // G pressed
		changeChunkSize(-1);
	}
	else if (k == 72 || k == 104) { // H pressed
		changeChunkSize(1);
	}
	else if (k == 70 || k == 102) { // F pressed
		changeWPM(-wpmdelta);
	}
	else if (k == 74 || k == 106) { // J pressed
		changeWPM(wpmdelta);
	}
}

function onKeyDown(e) {
	var k = e.keyCode;
	if (eState == STATE.Modal) {
		if (e.ctrlKey && k == 13) { // Ctrl+Enter
			$('#modalInput').modal('hide');
			onNewText();
		}
	}
	else if (eState == STATE.Options) {
		if (e.ctrlKey && k == 13) { // Ctrl+Enter
			$('#modalOptions').modal('hide');
			onChangeOptions();
		}
		else if (k == 68 || k == 100) { // D pressed
			resetOptionsToDefaults();
		}
	}
}


function EngineCallback(state, text) {
	if (state == EngSTATE.Finished) {
		changeState(STATE.Loaded);
		return;
	}	
	else if (state == EngSTATE.Paused) {
		changeState(STATE.Paused);
		return;
	}	

	$('#divCanvas').text(text);
}

function InitEngine() {
	changeWPM(0);
	changeChunkSize(0);
	Engine.setCallback(EngineCallback);
}

function onNewText() {
	txt = $.trim($('#txtaInput').val());
	var res = Engine.setText(txt);

	if (res > 0) {
		changeState(STATE.Loaded);
	} else {
		changeState(STATE.Empty);
	}

	$('#divCanvas').text(Engine.getNextChunk());
}

function onChangeOptions() {
	// Use the new values, or keep the old values if the new values are null
	wpm = parseInt($('#optionsWPM').val()) || wpm;
	changeWPM(0);
	wpmdelta = parseInt($('#optionsDelta').val()) || wpmdelta;
	chunk = parseInt($('#optionsChunkSize').val()) || chunk;
	chunkLen = parseInt($('#optionsChunkLen').val()) || 0;
	changeChunkSize(0);
	saveState();
}

function changeWPM(delta) {
	if (wpm + delta < 0) return;

	wpm += delta;
	Engine.setWPM(wpm);
	saveState();
	$('#divWPM').text(wpm);
}

function changeChunkSize(delta) {
	if (chunk + delta < 0) return;

	chunk += delta;
	Engine.setChunk(chunk);
	Engine.setChunkLen(chunkLen);
	saveState();
	$('#divChunk').text(chunk);
}

function setupAttributes() {
	$(document).keypress(function(e){
		onKeyPress(e);
	}).keydown(function(e){
		onKeyDown(e);
	});

	var legend = "[N]: New_____[SPACE]: Start/Pause_____[R]: Restart_____[J]/[F]: +/- WPM_____[H]/[G]: +/- Chunk size_____[O]: Options";
	$('#divLegend').html(formatLegend(legend));

	$('#txtaInput').val("It was terribly cold and nearly dark on the last evening of the old year, and the snow was falling fast. In the cold and the darkness, a poor little girl, with bare head and naked feet, roamed through the streets. It is true she had on a pair of slippers when she left home, but they were not of much use. ");

	var mod = $('#modalInput');

	mod.on('shown', function() {
		$('#txtaInput').val(txt).select().focus();
	}).on('hidden', function() {
		if (eState == STATE.Modal) changeState(ePrevState);
	});

	$('#modalInputLegend').html(formatLegend("[Ctrl]+[ENTER]: Use this text_____[ESC]: Cancel"));

	$('#modalOptions').on('shown', function() {
		$('#optionsWPM').val(wpm).select().focus();
		$('#optionsDelta').val(wpmdelta);
		$('#optionsChunkSize').val(chunk);
		$('#optionsChunkLen').val(chunkLen);
	}).on('hidden', function() {
		if (eState == STATE.Options) changeState(ePrevState);
	});

	$('#modalOptions input').keypress(function(e) {
		validateNumber(e);
	});

	$('#modalOptionsLegend').html(formatLegend("[Ctrl]+[ENTER]: Save_____[D]: Defaults_____[ESC]: Cancel"));
}

function changeState(state) {
	ePrevState = eState;
	eState = state;
}

function formatLegend(str) {
	return str.replace(/\[/g, '<strong class="label">').replace(/\]/g, '</strong>')
		.replace(/_/g, '&nbsp;');
}

function validateNumber(ev) {
	var theEvent = ev || window.event;
	var key = theEvent.keyCode || theEvent.which;
	key = String.fromCharCode(key);
	var regex = /[0-9]|\./;
	if( !regex.test(key) ) {
		theEvent.returnValue = false;
		if(theEvent.preventDefault) theEvent.preventDefault();
	}
}

function checkLocalStorageSupport() {
	try {
		canStore = 'localStorage' in window && window['localStorage'] !== null;
	} catch (e) {
		canStore = 0;
	}
}

function saveState() {
	if (!canStore) return;

	localStorage["spdWPM"] = wpm;
	localStorage["spdDelta"] = wpmdelta;
	localStorage["spdChunk"] = chunk;
	localStorage["spdChunkLen"] = chunkLen;
}

function loadState() {
	if (!canStore) return;

	(localStorage.getItem("spdWPM") != null) && (wpm = parseInt(localStorage["spdWPM"]));
	(localStorage.getItem("spdDelta") != null) && (wpmdelta = parseInt(localStorage["spdDelta"]));
	(localStorage.getItem("spdChunk") != null) && (chunk = parseInt(localStorage["spdChunk"]));
	(localStorage.getItem("spdChunkLen") != null) && (chunkLen = parseInt(localStorage["spdChunkLen"]));

	changeWPM(0);
	changeChunkSize(0);
}

function resetOptionsToDefaults() {
	$('#optionsWPM').val(300).select().focus();
	$('#optionsDelta').val(50);
	$('#optionsChunkSize').val(3);
	$('#optionsChunkLen').val(20);
}

