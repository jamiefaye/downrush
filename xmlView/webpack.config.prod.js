const path = require('path');

module.exports = {
  entry: './src/viewXML.js',
  watch: false,
   devtool:  false,
  output: {
    filename: 'viewXML.js',
	 path: path.resolve(__dirname, '../DR/xmlView/')
  }
};