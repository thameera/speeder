var Engine = {
	start:		function() { return EngStart(); },
	pause:		function() { return EngPause(); },
	resume:		function() { return EngResume(); },
	getNextChunk:	function() { return EngGetNextChunk(1); },
	setCallback:	function(callback) { return EngSetCallback(callback); },
	setText: 	function(text) { return EngSetText(text); },
	setChunk: 	function(size) { return EngSetChunkSize(size); },
	setWPM: 	function(wpm) { return EngSetWPM(wpm); }
};

var _WPM;
var _CPM;
var _TimeOut;
var _Text = null;
var _WordsArray = null;
var _WordCount;
var _TimeOut;
var _TotalTime;
var _TimerPerChar;
var _ChunkSize;
var _Cb;
var _Pos = 0;
var _Timer;
var _PauseTriggered = 0;
var _Offset = 0.0;
var _bReading = 0;

function EngStart() {
	if (!_Timer) {
		_Timer = $.timer(function() {
			_EngOnTimer();
		});
	}

	_Pos = 0;
	_EngSetupParams();
	_bReading = 1;

	_EngOnTimer();
}

function EngPause() {
	_PauseTriggered = 1;
	_Timer.stop();
	_bReading = 0;
}

function EngResume() {
	_bReading = 1;
	_EngOnTimer();
}

function EngSetText(text) {
	_Text = text;
	_WordsArray = _Text.split(/\s+/);
	_WordCount = _WordsArray.length;
	_Pos = 0;
	return _WordCount;
}

function _EngSetupParams() {
	_PauseTriggered = 0;

	if (_Text == null) return;

	var effectiveChars = _Text.length - _WordCount - _Pos;
	_TotalTime = (effectiveChars / _CPM) * 60 * 1000;
	//_TimePerChar = _TotalTime / _Text.length;
	_TimePerChar = _TotalTime / effectiveChars;
}

function _EngOnTimer() {
	if (_PauseTriggered == 1) {
		_PauseTriggered = 0;
		_Cb(2, "");
		return;
	}

	var offset = 0.0;
	var txt = EngGetNextChunk(0);

	if (txt == "") { //Finished
		_Cb(0, "");
		_Pos = 0;
		return;
	}
	
	_Cb(1, txt);
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

