var EngSTATE = {
	Initial:	{value: 0, text: 'Initial'},
	Reading: 	{value: 1, text: 'Reading'},
	Paused: 	{value: 2, text: 'Paused'},
	Finished: 	{value: 3, text: 'Finished'},
};

var Engine = {
	start:		function() { return EngStart(); },
	pause:		function() { return EngPause(); },
	resume:		function() { return EngResume(); },
	reset:		function() { return EngReset(); },
	getNextChunk:	function() { return EngGetNextChunk(1); },
	setCallback:	function(callback) { return EngSetCallback(callback); },
	setText: 	function(text) { return EngSetText(text); },
	setChunk: 	function(size) { return EngSetChunkSize(size); },
	setWPM: 	function(wpm) { return EngSetWPM(wpm); }
};

var _State = EngSTATE.Initial;
var _WPM;
var _CPM;
var _Text = null;
var _WordsArray = null;
var _WordCount;
var _TotalTime;
var _TimePerChar;
var _ChunkSize;
var _Cb; 	// Callback function given by outside
var _Pos = 0;
var _Timer;
var _Offset = 0.0;	// Used to slow down on sentence endings

function EngStart() {
	if (!_Timer) {
		_Timer = $.timer(function() {
			_EngOnTimer();
		});
	}

	_Pos = 0;
	_EngSetupParams();
	_State = EngSTATE.Reading;

	_EngOnTimer();
}

function EngPause() {
	if (_State != EngSTATE.Reading)
		return;

	_State = EngSTATE.Paused;
	_Timer.stop();
}

function EngResume() {
	_State = EngSTATE.Reading;
	_EngOnTimer();
}

function EngReset() {
	_Timer.stop();
	_Pos = 0;
}

function EngSetText(text) {
	_Text = text;
	_WordsArray = _Text.split(/\s+/);
	_WordCount = _WordsArray.length;
	_Pos = 0;
	return _WordCount;
}

function _EngSetupParams() {
	if (_Text == null) return;

	var effectiveChars = _Text.length - _WordCount - _Pos;
	_TotalTime = (effectiveChars / _CPM) * 60 * 1000;
	_TimePerChar = _TotalTime / effectiveChars;
}

function _EngOnTimer() {
	if (_State == EngSTATE.Paused) {
		_Cb(_State, "");
		return;
	}

	var offset = 0.0;
	var txt = EngGetNextChunk(0);

	if (txt == "") {
		_State = EngSTATE.Finished;
		_Cb(_State, "");
		_Pos = 0;
		return;
	}
	
	_Cb(EngSTATE.Reading, txt);
	var time4chunk = txt.length * _TimePerChar;
	_Timer.once(time4chunk + _Offset);
}

function EngGetNextChunk(mode) {
	var txt = "";
	var oldPos = _Pos;
	_Offset = 0.0;

	for (var i = 0; i < _ChunkSize; i++) {
		if (_Pos > _WordCount - 1) break;

		txt += _WordsArray[_Pos++];
		
		var x = txt.substr(-1);
		if (x == '.' || x == ';') {
			_Offset = 10 * _TimePerChar; // May need fixing
			break;
		}	
		txt += " ";
	}

	if (mode == 1) { // When NextChunk is requested from outside
		_Pos = oldPos;
	}

	return txt;
}

function EngSetWPM(wpm) {
	_WPM = wpm;	
	_CPM = _WPM * 5;
	_EngSetupParams();
}

function EngSetChunkSize(size) {
	_ChunkSize = size;	
}

function EngSetCallback(callback) {
	_Cb = callback;	
}

