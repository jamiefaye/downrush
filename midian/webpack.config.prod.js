const path = require('path');

module.exports = {
  entry: './src/midian.js',
  watch: false,
  devtool: false,
  output: {
    filename: 'midian.js',
    path: path.resolve(__dirname, '../DR/midian/')
//      path: "/Volumes/NO NAME/DR/midian"
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
  
  resolve: {
    modules: [
     path.resolve(__dirname, '../xmlView/node_modules'),
     path.resolve(__dirname, 'node_modules'),
     ],
    },
};