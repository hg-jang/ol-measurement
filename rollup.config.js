import image from "@rollup/plugin-image";
import copy from "rollup-plugin-copy";

/** @type {import('rollup').RollupOptions} */
export default {
  input: "src/index.js",
  output: {
    name: "Measurement",
    exports: "named",
    file: "dist/index.js",
  },
  plugins: [
    image(),
    copy({
      targets: [{ src: "src/style.css", dest: "dist" }],
    }),
  ],
};
