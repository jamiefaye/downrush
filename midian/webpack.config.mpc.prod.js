const path = require('path');

module.exports = {
  entry: './src/midianmpc.js',
  watch: false,
   devtool:  false,
  output: {
    filename: 'midianmpc.js',
	 path: path.resolve(__dirname, '../web/midianmpc/')
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