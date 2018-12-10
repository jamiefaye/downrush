# downrush
Downrush is a simple FlashAir file manager for SynthStrom Deluge music synthesizer. You can use it to download and upload files without removing the card from the synth. This first version is very simple. Expect improvements.

## Installation Instructions
1. Make a backup copy of your Deluge SD card! You will need to use that backup later to populate the FlashAir card.
1. Get a Toshiba FlashAir card. Make sure it is a  W-03 or W-04 (this code appears on the SD card label just below the FlashAir title on the right). W-04 cards are faster and are worth seeking out.
1. Download the Downrush distribution. This is a .zip file that you downloaded from Github.
1. Unzip the 'downrush.zip' file creating a distribution folder. It will be called 'distribution'. I will refer to this place as the distribution directory.
1. Insert the FlashAir card into a computer. You will be changing the contents of a hidden directory, so you may have
to set an option that lets you view hidden files in order to find it. 

## Unhiding Files
If you are using Windows, the following link gives instructions on making hidden files visible.


https://www.howtogeek.com/howto/windows-vista/show-hidden-files-and-folders-in-windows-vista/


On the Apple Mac, you can enter the following command on the command line and it will unhide the directory and file involved.
You will want to activate a 'Terminal Window', which you can find by typing 'terminal.app' into Spotlight. Then paste the following line into the terminal to execute.
````
chflags -R nohidden /VOLUMES/NO\ NAME/SD_WLAN
````


## Copying Files onto the FlashAir:

1. Click on the NO NAME icon to open it so you can see what is inside. This window is the 'destination window' (or root directory).
1. Drag the DR folder from the distribution directory and drop it onto destination window.
1. Drag the SD_WLAN folder from the distribution directory and drop it onto destination window.
1. You will likely see a warning about overwriting the SD_WLAN directory on the SD Card. Approve doing this.
1. There is no need to copy LICENSE, MANUAL, or README files.
1. Copy the four directories from your backup copy of the Deluge SD card into the root directory of your FlashAir card. The directory names to copy should be KITS, SAMPLES, SONGS, and SYNTHS.
1. Safely eject the FlashAir card from your computer and put it into the Deluge and power the Deluge up.
1. Connect to the card in your browser (Chrome recommended) This can present its own set of headaches.
1. Wait 30 seconds for the card to boot up inside your Deluge. (It is slower the first time).

  2. Your SD card will advertise itself as a WiFi Access Point (AP). The name will look like this: flashair_ec21e5e2939f. (The code after the underscore will be different). Connect to it.
  3. When asked for a password, use 12345678.
  4. Type the following URL into the browser: `http://flashair/` or `http://192.168.0.1/`
  5. If you have problems connecting to the FlashAir in the Deluge, you might try connecting to it while it is inserted into your computer. The file browser works in there too.

## Re-hiding Files

Once everything works OK, you might want to re-hide your files. On the Mac, you can do this with the following:

```
chflags -R hidden /VOLUMES/NO\ NAME/SD_WLAN
```

To re-hide on Windows, just uncheck the box you checked earlier.

## Upgrades

If you are updating an existing Downrush installation, put the new List.htm into card's SD_WLAN and completely replace the contents of DR with the new version. Unless told-to, you don't need to update the stuff in SD_WLAN.

## Troubleshooting Hints

The FlashAir card comes with a timeout feature which shuts down the WiFi AP functionality after 5 minutes of inactivity. If you want to disable this feature, set the timeout value to 0.
Change the CONFIG line: `APPAUTOTIME=300000` to instead be: `APPAUTOTIME=0` 

If you are updating downrush from a previous version and things seem strange, you may have to clear the browsers cache. The time stamps on SD Card directory entries are not always valid and this can cause stale files to linger unwanted in the cache.


## ADVANCED FEATURE: Editing CONFIG.

If you build Downrush from source, or want to change the configuration yourself, you can.

It is possible to configure the FlashAir card to act like any other device on your home network.
Be aware that the WiFi range is only a few meters. It is relatively easy to make a mistake editing CONFIG that breaks the WiFi functionality. You need to know how to use a text editing program that works with raw text.

First you need to unhide the SD_WLAN directory and the SD_WLAN/CONFIG file as described above.

You can open the CONFIG file using vi, nano, or TextEdit. On Windows, use NotePad.

Here is an example using nano:
```
nano /Volumes/NO\ NAME/SD_WLAN/CONFIG
```
Make sure that these three lines are present in the file, these enable the uploading features and avoid timeouts:
```
UPLOAD=1
WEBDAV=2
APPAUTOTIME=0
```

If you want to change your WiFi password, you can do that by replacing asterisks in the line:
```
APPNETWORKKEY=********
```
with:
```
APPNETWORKKEY=NEWPASSW
```
More information on the contents of the CONFIG file:
https://flashair-developers.com/en/documents/api/config/

If you really in trouble, you can find a tool for reinitializing a FlashAir card here:

http://www.toshiba-personalstorage.net/ww/support/download/flashair/w04/config02.htm

Here are the full contents of the CONFIG file as recommended:

```
[Vendor]

CIPATH=/DCIM/100__TSB/FA000001.JPG
APPMODE=4
APPNETWORKKEY=********
VERSION=F15DBW3BW4.00.00
CID=02544d535731364754d0f21e7a011601
PRODUCT=FlashAir
VENDOR=TOSHIBA
UPLOAD=1
WEBDAV=2
APPAUTOTIME=0
LOCK=1

```
## Credits

Downrush is based on a project by Junichi Kitano called the FlashTools Lua Editor (FTLE). See https://sites.google.com/site/gpsnmeajp/tools/flashair_tiny_lua_editer
