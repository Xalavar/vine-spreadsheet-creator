"use strict";

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
module.exports = {
  // other webpack config options...
  plugins: [new BundleAnalyzerPlugin()]
};
const Visualizer = require('webpack-visualizer-plugin');
module.exports = {
  // other webpack config options...
  plugins: [new Visualizer()]
};
module.exports = {
  // other webpack config options...
  stats: 'verbose'
};
//# sourceMappingURL=BundleAnalyzing.js.map