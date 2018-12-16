const path = require('path');

module.exports = {
  entry: './src/viewWAV.js',
  watch: false,
   devtool:  false,
  output: {
    filename: 'waverly.js',
	 path: path.resolve(__dirname, '../DR/waverly/')
  },
    module: {
      rules: [
      { test: /\.handlebars$/, loader: 'handlebars-loader' }
    ]
  },
};