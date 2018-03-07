const path = require('path');

module.exports = {
  entry: './src/List.js',
  watch: false,
   devtool:  false,
  output: {
    filename: 'List.js',
	 path: path.resolve(__dirname, '../DR/FTF/')
  }
};