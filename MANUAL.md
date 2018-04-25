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
http://flashair/ or http://192.168.0.1, depending on how you set the WiFi up to operate.

You should see a table of files and directories. At the root level, it will mostly be directories with names like DCIM, DR, KITS, SAMPLES, SONGS, & SYNTHS.

The two new directories that did not come with the Deluge distribution are DCIM, DR, and the hidden SD_WLAN. DCIM is there in case you want to stick the card in a digital camera. I use it to keep my copies of the
Deluge notes and Deluge manual. DR is where Downrush itself lives.

You can examine the contents of any of the directories by clicking on its name. You will go to a similar screen, more likely to contain files as well as deeper directories.

In deeper directories, the File Manager inserts an entry at the top which consists of two dots. Click on those to go back up a level.

The fields have header titles, including "Name", "Time", "Size", and "Edit". "Name", "Time", and "Size" are bolder, which means you can click on them and cause the listing to sort on that field. Click again to see the list in the opposite order.

Clicking on a file name will download the file, or in the case of XML files, open a viewer. Typically .WAV (audio) files will start a media player so you can hear what the file sounds like.
 
Some files (such as XML files) will show a link in the Edit column. Clicking on this takes you to a Code Mirror XML viewer/editor.

To move, rename, or delete files, select the one(s) you want to work with by clicking the check box on the left. At the bottom of the screen are buttons for "Removing Checked Files" and "Rename Checked File".

Every 5 seconds or so, the system checks to see if it should update the file list. If you are not sure that is working, press the 'Reload' button.

Checking the "Full File List" box causes the File Manager to display hidden files. I recommend not trying to change those!

The next section is devoted to file uploading, which is described below.

Below the upload area are buttons for creating a "New Directory" and to "Remove Checked Files" and "Rename Checked File".


## Uploading Files

There are two ways to upload files. The first way uses a standard browser file upload dialog. Click on "Choose File" and browse around until you find the file to upload. The file name will then be visible next to the button. To actually upload a file
click on the "Upload" button.

The other way to upload files uses 'drag and drop'. Find the files you want to upload in your Finder or Explorer program and drop them into the yellow area. You can include directories too and the folder hierarchy is preserved.
During a 'drag an drop' upload, progress will be indicated as a percentage completed. When the upload is done, the directory should refresh. If it doesn't, use the Refresh button.

## The XML 'Edit" Button

Clicking on the Edit link (far right, on the same line as a file) takes you to a Code Mirror XML document editor. A text field labeled File contains the full pathway to the file being edited. To the right of this are the "Save" and "Load" buttons. There is also a "#" button that gives access to more special functions. "Search", "Find Next" and "Replace" 
bring up a small popup over line 1 of the file where you can enter a search expression. You can also bring up the box by clicking in the file text and pressing command "f". The locations where the found text was found are indicated with yellow tick marks in the vertical scroll bar.

Along the right side of the edit window, just to the right of the line numbers are little triangles. Clicking on a triangle collapses an XML element to a single line, or expands it back. This is handy for coping with a complicated file.

If you create a mismatched XML element tag, the offending text will be highlighted in red.

To save a file back to the FlashAir card, press the save button. If you change the file name before you save, it will work as a "Save As" and not overstore the original file. This is a handy way of creating a copy somewhere.

Editing an XML file and storing it back can create a corrupted file that the Deluge might trip-out over. In particular, cutting and pasting &lt;track&gt; elements is tricky because some &lt;track&gt;  elements contain references to other &lt;track&gt; elements to avoid duplicating data. For this reason, we recommend you use the "Eye Editor", which has a special feature for making this easier.

## The XML Viewer

Clicking on the name of an XML file in the File Manager list takes you to a custom viewer/editor.

SYNTH files show a 'periodic table' giving the synthesizer parameters used to create a sound.

KIT files display a list of samples and their start and stop times. There is an audio player on the right which plays the sample locally. The Kit Editor recently grew in features and is described in a later section.

SONG files are shown in more sophisticated way.

At the top is drawn a 18 x 8 matrix showing the preview pattern for the song.

Below that is the song tempo in beats per minute. If the swing value is something other than 50%, that will be shown too. The currently selected key and mode follow.

Each track has header entry, which includes a "Copy To Clipboard" button, which copies the track data onto the system clipboard so you can paste it in somewhere else.

Also included in the track header is the section, track type, preset and preset name, and Info.
"Info" is presently used to indicate which 'Midi In" channel is used to capture data for this track, if the track invokes a midi program change, that is also shown here.

Below this header is a plot of the musical note content as a piano roll. Kits are also shown as a piano roll, with the instrument type on the left ('kick', 'snare', etc).
Synth tracks are labeled with high and low note values for the visible range. Piano roll notes can be red, yellow, green, blue, or grey. Red means 'probability less than 30%', Yellow means '30% to 70%', while Green means over 70%. Blue means the note repeats on a cyclical pattern, such as [3rd time out of 5].
Grey notes are darker if the velocity is higher, and lighter if it is lower.

Rolling your mouse or pressing your finger on a piano-roll note will display a small pop-up indicator which shows the pitch, octave, velocity, probability/repeat pattern, duration, and beat clock value for when the note starts.

I recently added a viewer for 'automation parameters'. These are shown as a graph at the same scale as the note plot, showing the value of the parameter over time.

After all the tracks there is a small text field labeled "Paste track data in field below to add it to song". This is where you paste in data that you grabbed using the "Copy To Clipboard". Use the browsers paste menu item or paste shortcut key.
For most users, the act of pasting is enough to trigger the system to load, parse, and modify the song so as to add a track. The pasted text may appear briefly and then disappear. This is normal.
You can copy from one song and paste into another. You can also paste the text into a text editor and view a JSON version of the track data, which is easier to read than the XML original.

You need to activate the "Save" button at the top of the page for your changes to stick. The preview pattern at the top won't change, and when you call up the song on the Deluge, the preview pattern will be wrong. Don't worry, twisting the 'up/down" knob will fix it.

The bottom of the Song page shows the sound parameter table for the overall song. If you click on the black triangles in the sound header, you can see the sound parameters for that track. This parameter table is described in more detail next.

The periodic table is used in severall places. The layout corresponds to the Deluge shortcut labels on the Deluge LED button matrix.

## The Kit Editor

The Kit Editor can be used in two different situations. One is within a song, where a particular track has a kit element. There is one of these for each kit track in a song.
The other context is when you open a KIT.XML file directly. I will use this second case for our description.

Each instrument in a kit has its own table entry. The leftmost column holds a "disclosure wedge", which when clicked, 'opens it up'. The weddge next to an instrument Name (KICK, SNARE, etc.) opens up
a sample plot. On the right hand side is a vertical menu of icons which you can click on. The top two zoom in and out. Below those is a button which launches the Waverly wave editor (which is described later).
There is one more wedge below the 'waveform', which shows the 'periodic table' details of the sound.

If you click on the triangle on the right, below the magnifying glass, you will see
the 'periodic table' used for that particular sample.

The very first wedge, at the upper left hand corner, next to the titles, unlocks a special editing ability. the Name and Mode fields become editable. You can also change the start and stop points for the sample
by placing your mouse at the beginning or ending of the selected area in the waveform where the cursor changes (very subtly) from a 'X,Y moving indication' into a 'left/right resizing indication. Dragging these handles around causes the start/end to change.
Pressing the play button will play the designated zone now.

To the left of where most of the wedges are are two new columns. One is a 'move around box' shown as four dots. Clicking and draggin on that rearranges the order of the kit elements.
Next to that is a checkbox which is used to select entries. These work with the buttons added at the bottom. "Change" lets you select a different sample for the first selected/checked entry.
'Copy' places all the checked items on the browser clipboard as JSON text. 'Delete' does what you expect. After you have copied some kit items onto the clipboard you can go the 'Paste kits' field and do a control/V or use the browser edit menu Paste command.
The tracks on the clipboard are then added to the end of the kit. Copy/Paste works across Kits and between Songs and Kits. (If you paste in a sample multiple times, you can change the start and end times as needed to 'split' the sample.

You will need to 'save back' your edited kit (or song) for the Deluge to be able to load it into its own memory. This is triggered by twisting the Select know back and forth, which causes the reload.

Next to the Save button at the top of the Kit Editor is a 'New Kit' button. Press that and you will get an empty kit to start with. To add samples press the 'Add Samples' button. You will then see a file browser that lets you select a sample file to add. Click on a .WAV file then press the Open button. A kit entry will be added for this sample and the program will guess a Name for this entry based on the file name.
If you hold the command key down while you are in the file browser, you can select multiple files. Using the shift key will 'extend the selection', making it easy to select an entire range.

## The Waverly .WAV Editor

You can enter Waverly by cling on the Edit link in the right column of the File Browser list, or you can press on the 'Wave' icon in the sample viewer (just below the magnifying glasses). This will lauch this special sound editing program.
Waverly is a lot like Audacity, but with far fewer features.

Below the 'Open' and 'Save' buttons we have the waveform display area, with a scroll bar if needed. Below that is an overview waveform that shows the entire wave in one view. Clicking on that jumps to that part of the wave. You can select a region of the wave in the main display by clicking and dragging.

Below the waveforms are two rows of buttons. The + and - magnifiers zoom in and out. The rewind button resets the playback to the beginning. The play button plays. The 'Play button in a circle'plays only the selected region. The right and left arrows 
The left facing arrow undoes the last change and the right facing arrow redoes. The button with both arrows does a 'select all'. 'Del' deletes, 'Cut' cuts, 'Copy' copies, and 'Paste' pastes. If you can, you are better off using copy and paste browser menu items or control-C and control-V.
Using the browser's commands lets you copy from one Wavery instance and paste into another. (The Cut/Copy/Paste buttons only work within a given wave, this is due to some very annoying browser limitations).

On the bottom row you find an 'Effects' drop down. Next to that are a couple of simple editing commands. 'Trim' shrinks a selected area of a waveform to start and stop on a zero crossing point.
'Crop' crops the selected area and throws away what was before and after. Normalize adjusts the waveform range to 'fill in' from -1 to +1. Reverse reverses the selected area. Fade In and Fade Out change the volume from 0 to max and from max to 0, which sounds like a fade.

The Effects drop-down has Quad Filter, Simple Reverb, Delay, and Oscillator. Picking one of these patches a filter into the playback chain and shows a control panel. Each panel is different, but the first row is the same. 'Apply' runs the filter over the selected area of the wave. Close closes the filter down, and 'Audition' controls wether
you can hear the results of the filters during playback. Pressing 'Apply' clears 'Audition', so when you play back, you only hear the result once.

Each filter has the following unique controls:

Quad Filter has Kind, Frequency, and "Quality" (Q). Some filters also have Gain.

Simple Reverb has Dry and Wt level controls, the reverb time in Seconds, the Decay rate, and a Reverse control.

Delay have a Type setting, Delay and Feedback, Cutoff, Offset and a Dry level.

Oscillator has a wave Type, the wave Frequency, Gain, and Duration. If Duration is zero, it just fills in the selected area of the wave.

Someday soon we will add more commands to Waverly.

