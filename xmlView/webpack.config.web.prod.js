const path = require('path');

module.exports = {
  entry: './src/viewXML.js',
  watch: false,
   devtool:  false,
  output: {
    filename: 'viewXML.js',
	path: path.resolve(__dirname, '../web/xmlView/')
  },
  module: {
      rules: [
      {
        test: /\.(jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      { test: /\.handlebars$/, loader: 'handlebars-loader' }
    ]
  },
};