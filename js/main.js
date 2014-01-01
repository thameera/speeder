var STATE = {
  Empty:    {value: 0, text: 'Empty'},
  Loaded:   {value: 1, text: 'Loaded'},
  Reading:  {value: 2, text: 'Reading'},
  Paused:   {value: 3, text: 'Paused'},
  NewModal: {value: 4, text: 'NewModal'},
  Options:  {value: 5, text: 'Options'}
};

var wpm = 300;
var chunk = 3;
var chunkLen = 20;
var txt;
var wpmdelta = 50;
var skipbackWords = 10;
var skipEnabled = 1;
var canStore = 0; // 1 if local storage is available
var storageEnabled = 1; // 0 if local storage is turned off manually
var darkMode = 0; // 0 if light mode, 1 if dark mode
var hideMode = 1; // whether the extra divs should be hidden while reading
var defaultText;
var filesSupported = ['txt']; // more can be added here, if it works

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

  if (eState == STATE.NewModal || eState == STATE.Options) return;

  if (k == 78 || k == 110) { // N pressed
    Engine.pause();
    $('#txtaInput').focus();
    changeState(STATE.NewModal);
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
  else if (k == 65 || k == 97) { // A pressed
    if (skipEnabled) {
      Engine.rewind(skipbackWords);
    }
  }
}

function onKeyDown(e) {
  var k = (e.keyCode ? e.keyCode : e.which);

  if (eState == STATE.NewModal) {
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
  else if (eState == STATE.Reading) {
    if (k == 27) { // Esc pressed
      Engine.pause();
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

  if (canStore && storageEnabled) {
    localStorage.txt = txt;
  }
  $('#divCanvas').text(Engine.getNextChunk());
}

function onChangeOptions() {
  // Use the new values, or keep the old values if the new values are null
  wpm = parseInt($('#optionsWPM').val(), 10) || wpm;
  changeWPM(0);
  wpmdelta = parseInt($('#optionsDelta').val(), 10) || wpmdelta;
  chunk = parseInt($('#optionsChunkSize').val(), 10) || chunk;
  chunkLen = parseInt($('#optionsChunkLen').val(), 10) || 0;
  hideMode = $('#option-hidenoise').hasClass('active') ? 1 : 0;

  if ($('#option-localstorage').hasClass('active')) {
    setStorageOpts(1);
  } else {
    setStorageOpts(0);
  }

  if ($('#option-darkmode').hasClass('active')) {
    setDarkMode(1);
  } else {
    setDarkMode(0);
  }

  skipEnabled = $('#option-enableskipback').hasClass('active') ? 1 : 0;
  skipbackWords = parseInt($('#optionsSkipBackWords').val(), 10) || skipbackWords;
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

  defaultText = "It was terribly cold and nearly dark on the last evening of the old year, and the snow was falling fast. In the cold and the darkness, a poor little girl, with bare head and naked feet, roamed through the streets. It is true she had on a pair of slippers when she left home, but they were not of much use.";

  if (canStore && storageEnabled && localStorage.getItem("txt") !== null) {
    $('#txtaInput').val(localStorage.txt);
  }
  else {
    $('#txtaInput').val(defaultText);
  }

  var mod = $('#modalInput');
  var mdlFileUpload = $('#mdlFileUpload');

  mod.on('shown', function() {
    $('#txtaInput').val(txt).select().focus();
    // add event listener for input file
    mdlFileUpload.on('change', function() { changeTextWithFile(this) });
  }).on('hidden', function() {
    if (eState == STATE.NewModal) changeState(ePrevState);
    mdlFileUpload.val(''); // clear file
  });

  $('#modalInputLegend').html(formatLegend("[Ctrl]+[ENTER]: Use this text_____[ESC]: Cancel"));

  $('#txtaInput').on('input select focus', function(){
    var wc = ($('#txtaInput').val().split(/\s+/).length -1);
    $('#modalInputWC').text('That\'s roughly ' + parseInt(wc, 10) + ' words');
  });

  $('#modalOptions').on('shown', function() {
    $('#optionsWPM').val(wpm).select().focus();
    $('#optionsDelta').val(wpmdelta);
    $('#optionsChunkSize').val(chunk);
    $('#optionsChunkLen').val(chunkLen);

    if (hideMode == 1) {
      $('#option-hidenoise').addClass('active');
    }

    if (storageEnabled == 1) {
      $('#option-localstorage').addClass('active');
    }

    if (darkMode == 1) {
      $('#option-darkmode').addClass('active');
    }

    if (skipEnabled == 1) {
      $('#option-enableskipback').addClass('active');
    }

    $('#optionsSkipBackWords').val(skipbackWords);
  }).on('hidden', function() {
    if (eState == STATE.Options) changeState(ePrevState);
  });

  $('#modalOptions input').keypress(function(e) {
    validateNumber(e);
  });

  $('#modalOptionsLegend').html(formatLegend("[Ctrl]+[ENTER]: Save_____[D]: Defaults_____[ESC]: Cancel"));

  if (darkMode == 1) {
    setDarkMode(1);
  }
}

function changeTextWithFile (filePath) {
  var reader = (function() {
    if (window.File && window.FileReader && window.Blob) {
      return new FileReader();
    } else { // API not supported
      return false;
    }
  }());

  var output = ""; 
  if(filePath.files && filePath.files[0]) {           
      reader.onload = function (e) {
          output = e.target.result;
          $.trim($('#txtaInput').val(output).focus());
      };
      
      var ext = filePath.files[0].name.split('.').pop();
      if ($.inArray(ext, filesSupported)) {
        alert('Unsupported file');
        $('#mdlFileUpload').val('');
        return;
      }
      reader.readAsText(filePath.files[0]);
  } else if(ActiveXObject && filePath) { //fallback to IE 6-8 support via ActiveX
      try {
          reader = new ActiveXObject("Scripting.FileSystemObject");
          var file = reader.OpenTextFile(filePath, 1); //ActiveX File Object
          output = file.ReadAll(); //text contents of file
          file.Close(); //close file "input stream"
          $.trim($('#txtaInput').val(output).focus());
      } catch (e) {
          if (e.number == -2146827859) {
              alert('Unable to access local files due to browser security settings. ' + 
               'To overcome this, go to Tools->Internet Options->Security->Custom Level. ' + 
               'Find the setting for "Initialize and script ActiveX controls not marked as safe" and change it to "Enable" or "Prompt"'); 
          }
      }       
  }
}

function changeState(state) {
  ePrevState = eState;
  eState = state;

  takeStateBasedActions();
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
    canStore = 'localStorage' in window && window.localStorage !== null;
  } catch (e) {
    canStore = 0;
  }
}

function saveState() {
  if (!canStore || !storageEnabled) return;

  localStorage.spdWPM = wpm;
  localStorage.spdDelta = wpmdelta;
  localStorage.spdChunk = chunk;
  localStorage.spdChunkLen = chunkLen;
  localStorage.hideMode = hideMode;
  localStorage.skipEnabled = skipEnabled;
  localStorage.skipbackWords = skipbackWords;
  localStorage.darkMode = darkMode;
}

function loadState() {
  if (!canStore) return;

  if (localStorage.getItem("spdWPM") !== null) {
    storageEnabled = parseInt(localStorage.storage, 10);
  }

  if (!storageEnabled) return;

  if (localStorage.getItem("spdWPM") !== null) {
    wpm = parseInt(localStorage.spdWPM, 10);
  }

  if (localStorage.getItem("spdDelta") !== null) {
    wpmdelta = parseInt(localStorage.spdDelta, 10);
  }

  if (localStorage.getItem("spdChunk") !== null) {
    chunk = parseInt(localStorage.spdChunk, 10);
  }

  if (localStorage.getItem("spdChunkLen") !== null) {
    chunkLen = parseInt(localStorage.spdChunkLen, 10);
  }

  if (localStorage.getItem("hideMode") !== null) {
    hideMode = parseInt(localStorage.hideMode, 10);
  }

  if (localStorage.getItem("skipbackWords") !== null) {
    skipbackWords = parseInt(localStorage.skipbackWords, 10);
  }

  if (localStorage.getItem("skipEnabled") !== null) {
    skipEnabled = parseInt(localStorage.skipEnabled, 10);
  }

  if (localStorage.getItem("darkMode") !== null) {
    darkMode = parseInt(localStorage.darkMode, 10);
  }

  changeWPM(0);
  changeChunkSize(0);
}

function setStorageOpts(val) {
  if (!canStore) return;

  storageEnabled = val;
  localStorage.storage = val;
}

function setDarkMode(darkModeVal) {
  if (darkModeVal == 1) {
    $('body').addClass('dark');
  } else {
    $('body').removeClass('dark');
  }

  darkMode = darkModeVal;
}

function resetOptionsToDefaults() {
  $('#optionsWPM').val(300).select().focus();
  $('#optionsDelta').val(50);
  $('#optionsChunkSize').val(3);
  $('#optionsChunkLen').val(20);
  $('#optionsSkipBackWords').val(10);
  // TODO: reset check boxes to default
}

function hideNoise() {
  $('a, .rowInfo, .rowLegend').fadeOut();
}

function showNoise() {
  $('a, .rowInfo, .rowLegend').fadeIn();
}

function takeStateBasedActions() {
  if (hideMode == 1) {
    if (eState == STATE.Reading) {
      hideNoise();
    }
    else {
      showNoise();
    }
  }
}
