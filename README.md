# downrush
Downrush is a simple FlashAir file manager for SynthStrom Deluge music synthesizer. You can use it to download and upload files without removing the card from the synth. This first version is very simple. Expect improvements.

## Installation Instructions
1. Make a backup copy of your Deluge SD card! You will need to use that backup later to populate the FlashAir card.
1. Get a Toshiba FlashAir card. Make sure it is a  W-03 or W-04 (this code appears on the SD card label just below the FlashAir title on the right).
1. Get it running with your computer. Follow the included instructions.
1. Use git clone with github or unpack the .zip file that has the code in it. Remember where this is, I will refer to that place as the distribution directory.
1. Insert the FlashAir card into a computer. You will be changing the contents of a hidden directory, so you may have
to set an option that lets you view hidden files in order to find it. On the Apple Mac, you can enter the following command
line and it will open the finder in the right place:
```
open /Volumes/NO\ NAME/SD_WLAN/
```
1. There is a yet another hidden file called CONFIG. If you are comfortable using vi, you can open it with the following:
```
vi /Volumes/NO\ NAME/SD_WLAN/CONFIG
```
1. Add one line at the bottom that enables the uploading feature:
```
UPLOAD=1
```

1. Copy the files named List.htm and jquery-3.2.1.min.js from the SD_WLAN distribution directory and put them into the SD_WLAN directory on the FlashAir Card.
1. Copy the directory named FTF from the SD_WLAN distribution directory and put it into the SD_WLAN directory on the FlashAir Card.
1. For the next steps, we will copy stuff into the root directory. This is one directory up from the SD_WLAN directory. 
1. Copy the file named Downrush.laua from  the distribution directory and put them into the root directory on the FlashAir Card.
1. Copy the Directory named DR from the distribution directory and put it into the root directory on the FlashAir Card.
1. There is no need to copy LICENSE or README.md.
1. Copy the four directories from your backup copy of the Deluge SD card into the root directory of your FlashAir card. The directory names to copy should be KITS, SAMPLES, SONGS, and SYNTHS.
1. Eject the FlashAir card from your computer and put it into the Deluge and power the Deluge up.
1. Connect to the card in your browser (Chrome recommended) This can present its own set of headaches.
  1. If you are connecting to the card by using it as an access point (AP), then change your computer's wifi
  connection over to flashair and type the following URL into the browser: `http://flashair/` or `http://192.168.0.1/`
  2. If you set the FlashAir up in Station Mode, determine which IP number your wireless router assigned to the FlashAir and use that instead of `192.168.0.1`. (You will want to set this up someday so you can surf the web while connected to the FlashAir).
  3. If you have problems connecting to the FlashAir in the Deluge, you might try connecting to it while it is inserted into your computer. The file browser works in there too.

## Troubleshooting Hints

The FlashAir card comes with a timeout feature which shuts down the WiFi AP functionality after 5 minutes of inactivity. If you want to disable this feature, set the timeout value to 0.
Change the CONFIG line: `APPAUTOTIME=300000` to instead be: `APPAUTOTIME=0` 

More information on the contents of the CONFIG file:
https://flashair-developers.com/en/documents/api/config/


Jamie's CONFIG file is set up to run in station mode on a local WiFi network. Here is what is in it:

```
CIPATH=/DCIM/100__TSB/FA000001.JPG
APPMODE=5
APPSSID=CALICO KATIE_EXT
APPNETWORKKEY=********
APPNAME=synth2
VERSION=F15DBW3BW4.00.02
CID=02544d535731364754d108467b011601
PRODUCT=FlashAir
VENDOR=TOSHIBA
MASTERCODE=***********
UPLOAD=1
LOCK=1
WEBDAV=2
IFMODE=1
DNSMODE=0
TELNET=1
REDIRECT=0
APPINFO=0000000000000000
```
## Credits

Downrush is based on a project by Junichi Kitano called the FlashTools Lua Editor (FTLE). See https://sites.google.com/site/gpsnmeajp/tools/flashair_tiny_lua_editer
