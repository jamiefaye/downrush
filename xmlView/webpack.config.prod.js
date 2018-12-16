const path = require('path');

module.exports = {
  entry: './src/viewXML.js',
  watch: false,
   devtool:  'source-map',
  output: {
    filename: 'viewXML.js',
	 path: path.resolve(__dirname, '../DR/xmlView/')
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