cd FTF
npm run build
cd ../xmlView
npm run build
cd ../waverly
npm run build
cd ../midian
npm run build
cd ../../
rm -rf distribution
mkdir distribution
cd downrush
cp -R SD_WLAN ../distribution/.
cp -R DR  ../distribution/.
pandoc -f markdown  -t plain --wrap=auto  README.md -o  ../distribution/DR/README.txt
pandoc -f markdown  -t plain --wrap=auto  MANUAL.md -o  ../distribution/DR/MANUAL.txt
#cp -R ../tools  ~/deluge/distribution/.
cd ..
rm  downrush.zip
zip -r downrush.zip distribution
