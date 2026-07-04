import { build } from "esbuild";

const isProd = process.argv.includes("--production");

await build({
  bundle: true,
  entryPoints: ["main.ts"],
  external: ["obsidian"],
  format: "cjs",
  target: "es2022",
  logLevel: "info",
  minify: isProd,
  sourcemap: isProd ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  define: {
    "process.env.NODE_ENV": JSON.stringify(isProd ? "production" : "development"),
  },
});
