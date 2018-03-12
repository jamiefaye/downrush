const path = require('path');

module.exports = {
  entry: './src/viewXML.js',
  devtool: 'inline-source-map',
  watch: true,
  watchOptions: {ignored: 'node_modules/'},
  output: {
    filename: 'viewXML.js',
//    path: path.resolve(__dirname, './')
    path: "/Volumes/NO NAME/DR/xmlView"
  }
};