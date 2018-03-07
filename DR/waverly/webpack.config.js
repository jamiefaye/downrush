const path = require('path');

module.exports = {
  entry: './src/viewWAV.js',

  watch: true,
  watchOptions: {ignored: 'node_modules/'},
  output: {
    filename: 'waverly.js',
//    path: path.resolve(__dirname, './')
    path: "/Volumes/NO NAME/DR/waverly"
  }
};