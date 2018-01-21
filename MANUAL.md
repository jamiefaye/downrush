# Downrush
Downrush is a simple FlashAir file manager for SynthStrom Deluge music synthesizer. You can use it to download and upload files
without removing the card from the synth. Downrush is gradually adding specialized tools for viewing and editing the various XML
files that the Deluge uses for storing songs, kits, and synth patches.

Downrush is just getting started. While there are people using it today, it is still difficult to set up. The README.md file has setup
instructions which I am assuming you have followed.

### Warnings
Downrush has bugs in it. Please don't keep your only copy of your magnum opus on Downrush. Make backups! Also be aware that Downrush lets you change almost all of the files on your SD card,
including ones that you should not be changing! Don't modify the files in the DR directory or the SD_WLAN directory unless explicitly told to in the setup or software upgrade instructions.

It is possible to change song, synth, and kit files in ways that cause the Deluge to crash. So far, I have not 'bricked' one (knock on wood)!

Be extra careful using the file upload and file savings commands while the FlashAir is plugged into your main computer. MacOS keeps its own copy of the FAT directory and writes that back to the card just before ejecting it.

## The Downrush File Manager

To use Downrush, insert the FlashAir SD card into the Deluge. Wait about 15 seconds for the WiFi to start up. Using a recent web browser such as Chrome, navigate to the home page of your card. You will be entering something like
http://flashair/ or http://192.168.1.2, depending on how you set the WiFi up to operate.

You should see a table of files and directories. At the root level, it will mostly be directories with names like DCIM, DR, KITS, SAMPLES, SONGS, & SYNTHS.

The two new directories that did not come with the Deluge distribution are DCIM, DR, and the hidden SD_WLAN. DCIM is there in case you want to stick the card in a digital camera. I use it to keep my copies of the
Deluge notes and Deluge manual. DR is where Downrush itself lives.

You can examine the contents of any of the directories by clicking on its name. You will go to a similar screen, more likely to contain files as well as deeper directories.

In deeper directories, the File Manager inserts an entry at the top which consists of two dots. Click on those to go back up a level.

The fields have header titles, including "Name", "Time", "Size", "Edit", "Del", "Mov", and an eyeball icon. "Name", "Time", and "Size" are bolder, which means you can click on them and cause the listing to sort on that field. Click again to see the list in the opposite order.

Clicking on a file name will download the file. Typically .WAV (audio) files will start a media player so you can hear what the file sounds like. At present, clicking on an XML file's name
 shows the file as text in your browser. To save the file locally, use the browsers "Save Page As…" menu function.
 
Some files (such as XML files) will show a link in the Edit column. Clicking on this takes you to a Code Mirror XML viewer/editor.

The DEL link deletes a file (after a confirmation dialog).

The MOV link is used for moving or renaming a file. A dialog will pop up and you can modify the file path and/or name to indicate where to move the file to and what to call it. To just change the name, leave the rest of the pathway before the last slash alone. If you change the path part, make sure it refers to a directory that actually exists.

If the "eyeball" is visible in the final column, you can click on that to open a special viewer/editor developed especially for working with Deluge files.

Every 5 seconds or so, the system checks to see if it should update the file list. If you are not sure that is working, press the 'Reload' button.

Checking the "Full File List" box causes the File Manager to display hidden files. I recommend not trying to change those!

The next section is devoted to file uploading, which is described below.

Below the upload area are buttons for creating a "New Directory" and to "Remove All Files". You will be prompted for the new name to use (You don't want to give a full pathname in this case). Removing all files is made particularly difficult on purpose.


## Uploading Files

There are two ways to upload files. The first way uses a standard browser file upload dialog. Click on "Choose File" and browse around until you find the file to upload. The file name will then be visible next to the button. To actually upload a file
click on the "Upload" button.

The other way to upload files uses 'drag and drop'. Find the files you want to upload in your Finder or Explorer program and drop them into the yellow area. You can include directories too, however at this time all the files are uploaded to the destination at only one level. Directory structures are not maintained. To be improved someday.
During a 'drag an drop' upload, progress will be indicated as a percentage completed. When the upload is done, the directory should refresh. If it doesn't, use the Refresh button.

## The XML 'Edit" Button

Clicking on the Edit link (on the same line as a file) takes you to a Code Mirror XML document editor. A text field labeled File contains the full pathway to the file being edited. To the right of this are the "Save" and "Load" buttons. There is also a "#" button that gives access to more special functions. "Search", "Find Next" and "Replace" 
bring up a small popup over line 1 of the file where you can enter a search expression. You can also bring up the box by clicking in the file text and pressing command "f". The locations where the found text was found are indicated with yellow tick marks in the vertical scroll bar.

Along the right side of the edit window, just to the right of the line numbers are little triangles. Clicking on a triangle collapses an XML element to a single line, or expands it back. This is handy for coping with a complicated file.

If you create a mismatched XML element tag, the offending text will be highlighted in red.

To save a file back to the FlashAir card, press the save button. If you change the file name before you save, it will work as a "Save As" and not overstore the original file. This is a handy way of creating a copy somewhere.

Editing an XML file and storing it back can create a corrupted file that the Deluge might trip-out over. In particular, cutting and pasting &lt;track&gt; elements is tricky because some &lt;track&gt;  elements contain references to other &lt;track&gt; elements to avoid duplicating data. For this reason, we recommend you use the "Eye Editor", which has a special feature for making this easier.

## The "Eye Editor"

Clicking on an Eye icon at the right side of a File Manager list takes you to a custom editor which is very much under development.

SYNTH and KIT files generate a nested block diagram showing the file structure in much the same way that Code Mirror XML editor does.

SONG files are shown in a much more sophisticated way.

At the top is drawn a 18 x 8 matrix showing the preview pattern for the song.

Below that is the song tempo in beats per minute.

Each track has an entry, starting from the top.

Under each track's name is a "Copy To Clipboard" button, which copies the track data onto the system clipboard so you can paste it in somewhere else.

Next is a track header which indicated section, track type, preset and preset name, length (in units of 64th note triplets), colour, and Info. I show Colour to help me reverse-engineer how colour assignment works.
"Info" is presently used to indicate which 'Midi In" channel is used to capture data for this track, if the track invokes a midi program change, that is also shown here.

Below this header is a plot of the musical note content as a piano roll. Until I figure out how colour assignment works, the notes are black. The high and low note values for the visible range is shown just above and below.

After all the tracks there is a small text field labeled "Paste track data in field below to add it to song". This is where you paste in data that you grabbed using the "Copy To Clipboard". Use the browsers paste menu item or paste shortcut key.
For most users, the act of pasting is enough to trigger the system to load, parse, and modify the song so as to add a track. The pasted text may appear briefly and then disappear. This is normal.
You can copy from one song and paste into another. You can also paste the text into a text editor and view a JSON version of the track data, which is easier to read than the XML original.

You need to activate the "Save(F1)" button at the top of the page for your changes to stick. The preview pattern at the top won't change, and when you call up the song on the Deluge, the preview pattern will be wrong. Don't worry, twisting the 'up/down" knob will fix it.

The rest of the page shows an object diagram with the header info for the song that has not yet been formatted into a more human-readible way.
