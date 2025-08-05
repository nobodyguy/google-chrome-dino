import { defineConfig } from "vite";
import babel from "vite-plugin-babel";
import path from "path";

export default defineConfig({
  optimizeDeps: {
    include: ["@hangtime/grip-connect"],
  },
  build: {
    lib: {
      // Output as single JS file like Webpack
      entry: path.resolve(__dirname, "index.js"),
      name: "MyLib",
      fileName: () => "output.js",
      formats: ["iife"], // IIFE = Immediately Invoked Function Expression (for browser)
    },
    rollupOptions: {
      external: [],
    },
    minify: true,
  },

  plugins: [
    babel({
      babelConfig: {
        presets: ["@babel/preset-env"],
        plugins: ["@babel/plugin-proposal-class-properties"],
        babelrc: false,
        configFile: false,
      },
      filter: (id) =>
        id.endsWith(".js") &&
        (id.includes("/@hangtime/grip-connect/") ||
          !id.includes("/node_modules/")),
    }),
  ],
});
