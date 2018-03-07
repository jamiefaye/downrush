const path = require('path');

module.exports = {
  entry: './src/List.js',
  watch: true,
  watchOptions: {ignored: 'node_modules/'},
   devtool: 'inline-source-map',
  output: {
    filename: 'List.js',
//	   path: path.resolve(__dirname, './DR/FTF/')
   path: "/Volumes/NO NAME/DR/FTF"
  }
};