import { build } from "esbuild"
import path from "node:path"

const root = path.resolve(import.meta.dirname, "..")

await build({
  absWorkingDir: root,
  entryPoints: ["shell/ui/register.js"],
  bundle: true,
  format: "iife",
  platform: "browser",
  outfile: "shell/launcher-ui.js",
  legalComments: "none",
  logLevel: "info",
})
