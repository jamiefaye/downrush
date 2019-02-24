const path = require('path');

module.exports = {
  entry: './src/SongViewLib.js',
  devtool:  false,
  watch: false,
  output: {
    filename: 'SongLib.js',
    path: path.resolve(__dirname, './lib'),
    libraryTarget: 'umd',
    library: 'lib',
    umdNamedDefine: true,
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