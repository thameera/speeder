# speeder

Speeder is a speed reading engine in Javascript. 
A live version is available at http://thameera.com/speeder

## How it works

Speeder blinks chunks of a given text in the screen. The chunk size and WPM can be changed dynamically. It slows down for longer chunks and ends of sentences, while sticking to the specified WPM.

The engine is js/SpeederEngine.js. The js/main.js script plugs the engine to the site and manages the UI.

## To-do

 * Rewind (skip back) text
 * Ability to modify line end characters
 * Reading progress indicator
 * Grab readable content from URL (in addition to copy-pasting)
 * Dim background while reading

