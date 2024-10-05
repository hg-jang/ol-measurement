/** @type {import('rollup').RollupOptions} */
export default {
  input: "src/index.js",
  output: {
    name: "Measurement",
    format: "iife",
    exports: "named",
    file: "dist/index.js",
  },
};
