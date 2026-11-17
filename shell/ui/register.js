import { createAgent } from "@ui-sdk/web/agent"
import "@ui-sdk/web/button"
import "@ui-sdk/web/field"
import "@ui-sdk/web/file-input"
import "@ui-sdk/web/input"
import "@ui-sdk/web/listbox"
import "@ui-sdk/web/segmented-control"
import { createParts } from "@ui-sdk/web"
import { toolGrid } from "./tool-grid.js"

globalThis.__uiSdkCreateAgent = createAgent

createParts(toolGrid, {
  root: { tag: "ui-tool-grid", display: "grid" },
  cell: { tag: "ui-tool-grid-cell", display: "flex" },
})
