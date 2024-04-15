"use strict";

const path = require('path');
const {
  Visualizer
} = require('webpack-visualizer-plugin');
module.exports = {
  entry: './src/index.js',
  // Entry point of your React application
  output: {
    publicPath: '/',
    path: path.resolve(__dirname, 'dist'),
    // Output directory
    filename: 'bundle.js' // Name of the bundled file
  },
  module: {
    rules: [{
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env', '@babel/preset-react']
        }
      }
    }, {
      test: /\.css$/,
      use: ['style-loader', 'css-loader']
    }, {
      test: /\.(png|jpe?g|gif)$/i,
      use: [{
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: 'images' // Directory to store images in the output directory
        }
      }]
    }
    // Add more rules for handling CSS, images, etc. if needed
    ]
  },
  // Set optimization settings
  optimization: {
    // Enable minimization to remove dead code
    minimize: true,
    // Tell webpack to use ES6 module syntax for output
    moduleIds: 'deterministic',
    // For consistent module IDs
    chunkIds: 'deterministic',
    // For consistent chunk IDs
    mangleExports: 'deterministic',
    // For consistent export names
    usedExports: true,
    // Enable tree-shaking by detecting used exports
    concatenateModules: true // Enable module concatenation for better optimization
  }
};
//# sourceMappingURL=webpack.config.js.map