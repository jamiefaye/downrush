cd /Users/jamie/deluge/downrush/xmlView
npm run build
cd /Users/jamie/deluge/downrush/waverly
npm run build
cd /Users/jamie/deluge
rm -rf master
mkdir master
cd /Users/jamie/deluge/downrush
cp -R SD_WLAN ~/deluge/master/.
cp -R DR  ~/deluge/master/.
#cp -R ../tools  ~/deluge/master/.
cd /Users/jamie/deluge
rm  downrush.zip
zip -r downrush.zip master
