import { createRovingFocus, definePrimitive } from "@ui-sdk/core"

const toolGrid = definePrimitive({
  name: "tool-grid",
  options: {
    onActivate: "callback",
  },
  state: () => ({
    focused: null,
    columns: 1,
  }),
  api: (context) => {
    const roving = createRovingFocus(context, {
      slot: "cell",
      key: "focused",
      move: (event, { from, items, rtl }) => {
        const index = items.findIndex((item) => item.key === from.key)
        if (index < 0) return from.key
        const columns = Math.max(1, context.store.get().columns)
        const forward = rtl ? -1 : 1
        if (event.key === "Home") return items[0].key
        if (event.key === "End") return items[items.length - 1].key
        const step = {
          ArrowRight: forward,
          ArrowLeft: -forward,
          ArrowDown: columns,
          ArrowUp: -columns,
        }[event.key]
        if (step == null) return undefined
        let next = index + step
        if (event.key === "ArrowDown" && next >= items.length && index < items.length - 1) {
          next = items.length - 1
        }
        if (next < 0 || next >= items.length) return from.key
        return items[next].key
      },
    })
    return {
      roving,
      setColumns(count) {
        const columns = Math.max(1, count | 0)
        if (context.store.get().columns === columns) return
        context.store.set({ columns })
      },
      focusItem(value) {
        roving.focus(value)
      },
      activate(value, event) {
        context.options().onActivate?.(value, { reason: "item-press", event })
      },
    }
  },
  slots: (slot) => ({
    root: slot({
      attrs: () => ({ role: "grid" }),
      bind: (el, { api }) => {
        const measure = () => {
          const tracks = getComputedStyle(el).gridTemplateColumns.split(" ").filter(Boolean)
          api.setColumns(tracks.length || 1)
        }
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(el)
        return () => observer.disconnect()
      },
    }),
    cell: slot({
      props: { value: "string", index: "number" },
      attrs: (state, part) => {
        const columns = Math.max(1, state.columns || 1)
        const index = part.props.index || 0
        return {
          role: "gridcell",
          tabindex: part.api.roving.tabIndex(state, part),
          "aria-rowindex": Math.floor(index / columns) + 1,
          "aria-colindex": (index % columns) + 1,
        }
      },
      on: {
        keydown: (event, { el, api, props }) => {
          api.roving.keydown(event, el)
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            api.activate(props.value, event)
          }
        },
      },
      press: ({ api, props }, event) => api.activate(props.value, event),
      bind: (el, part) => part.api.roving.bind(el, part),
    }),
  }),
  agent: {
    actions: ["activate", "focusItem"],
    items: (api) => api.roving.items().map((item) => ({
      value: item.key,
      label: item.el.textContent.trim(),
    })),
  },
})

export { toolGrid }
