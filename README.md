# speeder

Speeder is a speed reading engine in Javascript. 

## How it works

Speeder blinks chunks of a given text in the screen. The chunk size and WPM can be changed dynamically. It slows down for longer chunks and ends of sentences, while sticking to the specified WPM.

The engine is js/SpeederEngine.js. The js/main.js script plugs the engine to the site and manages the UI.

## To-do

 * *Max characters per chunk* option
 * Reading progress indicator
 * Grab readable content from URL (in addition to copy-pasting)
 * Enhance UI
 * Option to save *text* in local storage

