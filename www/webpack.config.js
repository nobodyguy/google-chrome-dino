const path = require("path");

module.exports = {
  entry: "./index.js",
  output: {
    path: path.resolve(__dirname),
    filename: "output.js",
  },
  mode: "production",
  resolve: {
    // Make it work with webpack 4
    alias: {
      '@hangtime/grip-connect': path.resolve(__dirname, 'node_modules/@hangtime/grip-connect/dist/cjs/index.js')
    }
  }
};
