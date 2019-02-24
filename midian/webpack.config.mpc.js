const path = require('path');

module.exports = {
  entry: './src/midianmpc.js',
  devtool: 'source-map',
  watch: true,
  watchOptions: {ignored: 'node_modules/'},
  output: {
    filename: 'midianmpc.js',
//    path: path.resolve(__dirname, './')
//	 path: path.resolve(__dirname, '../web/midianmpc/')
	     path: "/Volumes/NO NAME/web/midianmpc"
  },
  module: {
      rules: [
      {
        test: /\.(jsx)$/,
        exclude: /node_modules/,
        loader: "babel-loader",
   		query:
      	{
        	presets:['react']
      	}
      },
      { test: /\.handlebars$/, loader: 'handlebars-loader' }
    ]
  },
};