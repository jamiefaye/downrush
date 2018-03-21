cd /Users/jamie/deluge/downrush/xmlView
npm run build
cd /Users/jamie/deluge/downrush/waverly
npm run build
cd /Users/jamie/deluge
rm -rf distribution
mkdir distribution
cd /Users/jamie/deluge/downrush
cp -R SD_WLAN ~/deluge/distribution/.
cp -R DR  ~/deluge/distribution/.
cp README.md ~/deluge/distribution/.
cp MANUAL.md ~/deluge/distribution/.
#cp -R ../tools  ~/deluge/distribution/.
cd /Users/jamie/deluge
rm  downrush.zip
zip -r downrush.zip distribution
