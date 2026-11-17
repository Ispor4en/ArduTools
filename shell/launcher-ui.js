(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/@ui-sdk/core/dist/foundation/kernel/dev-stub.js
  function emit(_event) {
  }
  function warn(_message, _from, _detail) {
  }
  function note(_message, _from, _detail) {
  }
  function warnMissing(slots, _from) {
    return slots;
  }
  function checkRoles(_slots, _from) {
  }
  function checkRole(_definition, _slot, _own, _role, _from, _live) {
  }
  function checkFocus(_focus, _slot, _el, _from) {
  }
  function expectControlled(_instance, _info, _current) {
  }
  function forgetControlled(_instance) {
  }
  function heardControlled(_instance, _options) {
  }
  function measured(read) {
    read();
  }
  function checkEvent(_reason, _event, _from) {
  }
  function checkPrevented(_name, _prevented, _details, _from) {
  }
  function checkMarks(_elements, _marks) {
  }
  function checkControlled(_from, _keys, _options) {
  }
  var dev, isMeasuring;
  var init_dev_stub = __esm({
    "node_modules/@ui-sdk/core/dist/foundation/kernel/dev-stub.js"() {
      dev = false;
      isMeasuring = () => false;
    }
  });

  // node_modules/@ui-sdk/core/dist/foundation/platform/style.js
  function pageNonce(doc) {
    if (nonces.has(doc)) {
      return nonces.get(doc);
    }
    let meta;
    for (let at = doc; at && !meta; at = at.defaultView?.frameElement?.ownerDocument) {
      meta = at.head?.querySelector('meta[property="csp-nonce"]');
    }
    const nonce = meta ? meta.nonce || meta.getAttribute("nonce") || "" : null;
    nonces.set(doc, nonce);
    return nonce;
  }
  function writeStyle(doc, id, css2) {
    if (!doc.head) {
      return;
    }
    const view2 = doc.defaultView;
    if (pageNonce(doc) === "" && view2 && "adoptedStyleSheets" in doc) {
      adoptStyle(doc, view2, id, css2);
    } else {
      appendStyle(doc, id, css2);
    }
  }
  function appendStyle(doc, id, css2) {
    const existing = doc.getElementById(id);
    if (existing) {
      if (styleText.get(existing) === css2) {
        return;
      }
      if (existing.textContent !== css2) {
        existing.textContent = css2;
      }
      styleText.set(existing, css2);
      return;
    }
    const style = doc.createElement("style");
    style.id = id;
    const nonce = pageNonce(doc);
    if (nonce) {
      style.nonce = nonce;
    }
    style.textContent = css2;
    styleText.set(style, css2);
    const ours = doc.head.querySelectorAll(':scope > style[id^="ui-sdk-"]');
    if (ours.length) {
      ours[ours.length - 1].after(style);
    } else {
      doc.head.prepend(style);
    }
  }
  function adoptStyle(doc, view2, id, css2) {
    let sheets = adopted().get(doc);
    if (!sheets) {
      adopted().set(doc, sheets = /* @__PURE__ */ new Map());
    }
    let entry = sheets.get(id);
    if (!entry) {
      sheets.set(id, entry = { sheet: new view2.CSSStyleSheet(), css: "" });
    }
    if (entry.css !== css2) {
      entry.sheet.replaceSync(css2);
      entry.css = css2;
    }
    if (!doc.adoptedStyleSheets.includes(entry.sheet)) {
      doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, entry.sheet];
    }
  }
  function enforceHidden(doc) {
    writeStyle(
      doc,
      "ui-sdk-hidden",
      '@layer ui-sdk { :where([data-slot][hidden]:not([hidden="until-found"])) { display: none !important } }'
    );
  }
  var adopted, nonces, styleText;
  var init_style = __esm({
    "node_modules/@ui-sdk/core/dist/foundation/platform/style.js"() {
      adopted = () => globalThis[/* @__PURE__ */ Symbol.for("ui-sdk.styles@1")] ??= /* @__PURE__ */ new WeakMap();
      nonces = /* @__PURE__ */ new WeakMap();
      styleText = /* @__PURE__ */ new WeakMap();
    }
  });

  // node_modules/@ui-sdk/core/dist/foundation/kernel/events.js
  function on(target, type, listener, options) {
    target.addEventListener(type, listener, options);
    return () => target.removeEventListener(type, listener, options);
  }
  function isComposing(event) {
    const key = "nativeEvent" in event ? event.nativeEvent : event;
    return key.isComposing === true || key.keyCode === 229;
  }
  var init_events = __esm({
    "node_modules/@ui-sdk/core/dist/foundation/kernel/events.js"() {
    }
  });

  // node_modules/@ui-sdk/core/dist/foundation/kernel/store.js
  function sameValue(a, b) {
    if (Object.is(a, b)) {
      return true;
    }
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    if (changedInPlace.has(a) || changedInPlace.has(b)) {
      return false;
    }
    return a.every((item, index) => Object.is(item, b[index]));
  }
  function createStore(initial, live2) {
    let state = initial;
    let renders2 = 0;
    let writes2 = 0;
    let followed2;
    let merged;
    let reading = false;
    let viewed;
    const listeners2 = /* @__PURE__ */ new Set();
    const skipping = /* @__PURE__ */ new Map();
    let fanout;
    const store = {
      get() {
        return viewed ?? withFollowed();
      },
      // `delivered` marks keys `follow` already delivers, which parts that read
      // them through the framework skip.
      set(patch, delivered = false) {
        if (followed2 && !delivered && !reading) {
          const over = withFollowed();
          if (over !== state) {
            const rest = { ...over };
            for (const key in patch) {
              delete rest[key];
            }
            store.set(rest, true);
          }
        }
        const changed = [];
        for (const key in patch) {
          if (!sameValue(state[key], patch[key])) {
            changed.push(key);
          }
        }
        if (!changed.length) {
          return;
        }
        const previous = state;
        state = { ...state, ...patch };
        const liveOnly = changed.every((key) => live2.includes(key));
        notify2(changed, previous, liveOnly, delivered);
      },
      subscribe(listener) {
        listeners2.add(listener);
        return () => {
          listeners2.delete(listener);
        };
      },
      // The listeners of parts that select values, which `kernel/selects.ts` installs once.
      setFanout(next) {
        fanout = next;
      },
      // Keys `get()` reads from `read` from now on, ahead of `set`, like a
      // framework's props it hands over from an effect. `read` gets the state
      // the store holds.
      follow(read) {
        followed2 = read;
      },
      // Runs `read` with `get()` returning `next`, for state derived from state
      // the store doesn't hold yet, like what the framework is rendering.
      view(next, read) {
        const before = viewed;
        viewed = next;
        try {
          return read();
        } finally {
          viewed = before;
        }
      }
    };
    function withFollowed() {
      if (!followed2 || reading) {
        return state;
      }
      reading = true;
      let over;
      try {
        over = followed2(state);
      } finally {
        reading = false;
      }
      if (!over) {
        return state;
      }
      if (merged?.state === state && merged.over === over) {
        return merged.result;
      }
      let result = state;
      for (const key in over) {
        if (!sameValue(state[key], over[key])) {
          result = { ...state, ...over };
          break;
        }
      }
      merged = { state, over, result };
      return result;
    }
    function notify2(changed, previous, liveOnly, delivered) {
      if (!liveOnly) {
        renders2++;
      }
      if (!delivered) {
        writes2++;
      }
      const run = (listener) => listener(liveOnly, delivered, changed);
      listeners2.forEach(run);
      for (const [skip, group] of skipping) {
        if (!changed.length || changed.some((key) => !Object.hasOwn(skip, key))) {
          group.forEach(run);
        }
      }
      fanout?.(changed, previous, run);
    }
    held.set(store, {
      state: () => state,
      renders: () => renders2,
      writes: () => writes2,
      touch: () => notify2([], state, false, false),
      skipping
    });
    return store;
  }
  function subscribeSkipping(store, skip, listener) {
    return join(held.get(store).skipping, skip, listener);
  }
  function join(groups, group, listener) {
    let members = groups.get(group);
    if (!members) {
      groups.set(group, members = /* @__PURE__ */ new Set());
    }
    members.add(listener);
    return () => {
      members.delete(listener);
      if (!members.size && groups.get(group) === members) {
        groups.delete(group);
      }
    };
  }
  var changedInPlace, held, heldState, renders, standFor, touch;
  var init_store = __esm({
    "node_modules/@ui-sdk/core/dist/foundation/kernel/store.js"() {
      changedInPlace = /* @__PURE__ */ new WeakSet();
      held = /* @__PURE__ */ new WeakMap();
      heldState = (store) => held.get(store).state();
      renders = (store) => held.get(store).renders();
      standFor = (owner4, store) => {
        held.set(owner4, held.get(store));
      };
      touch = (store) => held.get(store).touch();
    }
  });

  // node_modules/@ui-sdk/core/dist/foundation/kernel/selects.js
  function narrowedOf(store) {
    const found2 = narrowedStores.get(store);
    if (found2) {
      return found2;
    }
    const narrowed = {
      selectors: /* @__PURE__ */ new Map(),
      selecting: /* @__PURE__ */ new Map()
    };
    narrowedStores.set(store, narrowed);
    store.setFanout((changed, previous, run) => {
      const state = store.get();
      for (const key of changed) {
        const movers = narrowed.selecting.get(key);
        if (!movers) {
          continue;
        }
        const notify2 = (value) => narrowed.selectors.get(`${String(key)}:${value}`)?.forEach(run);
        const before = previous[key];
        for (const [moved, naming] of movers) {
          if (moved(before, state[key], notify2) === true) {
            naming.forEach(run);
          }
        }
      }
    });
    return narrowed;
  }
  function selects(reads2) {
    const narrowing = Object.entries(reads2).filter(
      ([, values]) => isReader(values) || typeof values === "function" || values.length > 0
    );
    const valuesOf2 = (values, partView) => isReader(values) ? values.values(partView) : typeof values === "function" ? values(partView) : values;
    const selected = (part, props) => {
      const partView = view(part, props);
      return narrowing.map(
        ([key, values]) => [key, valuesOf2(values, partView)]
      );
    };
    return {
      /**
       * The values a part reads each key it lists by, an empty list for a key it
       * never reads. A key it doesn't list, it reads whole.
       */
      reading(part, props) {
        const partView = view(part, props);
        return new Map(
          Object.entries(reads2).flatMap(
            ([key, values]) => isReader(values) ? [] : [[key, valuesOf2(values, partView)]]
          )
        );
      },
      /** The values a part selects on, which it subscribes again for when they change. */
      selection(part, props) {
        const values = selected(part, props);
        return values.length ? JSON.stringify(values) : "";
      },
      /**
       * Runs `listener` when a change can affect the part: a key it selects on
       * took or left one of its values, or any other key changed. Every part of
       * the slot skips the listed keys as one group.
       */
      subscribe(part, listener, props) {
        const cleanups = [subscribeSkipping(part.store, reads2, listener)];
        for (const [key, values] of selected(part, props)) {
          const reader = reads2[key];
          const moved = isReader(reader) ? reader.moved : eachMoved;
          cleanups.push(
            ...values.map(
              (value) => select(part.store, key, value, listener, moved)
            )
          );
          if (moved !== eachMoved) {
            cleanups.push(joinMover(part.store, key, moved, listener));
          }
        }
        return () => cleanups.forEach((cleanup) => cleanup());
      }
    };
  }
  function select(store, key, value, listener, moved = eachMoved) {
    const leaveMover = joinMover(store, key, moved, () => {
    });
    const leave = join(
      narrowedOf(store).selectors,
      `${String(key)}:${value}`,
      listener
    );
    return () => {
      leave();
      leaveMover();
    };
  }
  function joinMover(store, key, moved, listener) {
    const { selecting } = narrowedOf(store);
    let movers = selecting.get(key);
    if (!movers) {
      selecting.set(key, movers = /* @__PURE__ */ new Map());
    }
    const leave = join(movers, moved, listener);
    return () => {
      leave();
      if (!movers.size && selecting.get(key) === movers) {
        selecting.delete(key);
      }
    };
  }
  function eachMoved(before, after, notify2) {
    if (before == null) {
      before = emptyLike(after, before);
    } else if (after == null) {
      after = emptyLike(before, after);
    }
    if (isRecord(before) && isRecord(after)) {
      for (const name in before) {
        if (!Object.hasOwn(after, name) || !Object.is(before[name], after[name])) {
          notify2(name);
        }
      }
      for (const name in after) {
        if (!Object.hasOwn(before, name)) {
          notify2(name);
        }
      }
      return;
    }
    if (!Array.isArray(before) || !Array.isArray(after)) {
      return [before, after].forEach(notify2);
    }
    let start = 0;
    let end = 0;
    while (start < before.length && before[start] === after[start]) {
      start++;
    }
    while (end < before.length - start && end < after.length - start && before[before.length - 1 - end] === after[after.length - 1 - end]) {
      end++;
    }
    for (const values of [before, after]) {
      for (let index = start; index < values.length - end; index++) {
        notify2(values[index]);
      }
    }
  }
  var isReader, narrowedStores, isRecord, noItems, noEntries, emptyLike;
  var init_selects = __esm({
    "node_modules/@ui-sdk/core/dist/foundation/kernel/selects.js"() {
      init_part();
      init_store();
      isReader = (values) => typeof values === "object" && values !== null && !Array.isArray(values);
      narrowedStores = /* @__PURE__ */ new WeakMap();
      isRecord = (value) => !!value && Object.getPrototypeOf(value) === Object.prototype;
      noItems = [];
      noEntries = {};
      emptyLike = (other, missing) => Array.isArray(other) ? noItems : isRecord(other) ? noEntries : missing;
    }
  });

  // node_modules/@ui-sdk/core/dist/foundation/kernel/part.js
  function lease(part) {
    const { parts } = part.owner;
    const mapKey = `${part.slot}:${part.key}`;
    if (!parts.has(mapKey)) {
      parts.set(mapKey, part);
    }
    part.leases++;
    let held22 = true;
    return () => {
      if (!held22) {
        return;
      }
      held22 = false;
      if (--part.leases) {
        return;
      }
      const { owner: owner4 } = part;
      if (!owner4.released.length) {
        queueMicrotask(() => sweep(owner4));
      }
      owner4.released.push(part);
    };
  }
  function provisional(part) {
    const { owner: owner4 } = part;
    if (!owner4.released.length) {
      queueMicrotask(() => sweep(owner4));
    }
    owner4.released.push(part);
  }
  function sweep(owner4) {
    for (const part of owner4.released) {
      const mapKey = `${part.slot}:${part.key}`;
      if (!part.leases && owner4.parts.get(mapKey) === part) {
        owner4.parts.delete(mapKey);
      }
    }
    owner4.released = [];
  }
  function attrs(part, props = part.props, state = part.store.get()) {
    const definition = definitionOf(part);
    const context2 = view(part, props);
    const own = definition.attrs?.(state, context2);
    const declared = definition.role;
    const role = typeof declared === "function" ? declared(state, context2) : declared;
    if (dev) {
      checkRole(
        definition,
        part.slot,
        own,
        role,
        { component: ownerOf(part).label, id: part.id },
        definition.live?.read(state, context2)
      );
    }
    const { name } = ownerOf(part);
    const result = {
      "data-slot": part.slot === "root" ? name : `${name}-${part.slot}`,
      ...declared === void 0 ? void 0 : { role },
      ...own
    };
    if (declared !== void 0) {
      result.role = role;
    }
    return aliased(part, result);
  }
  function partState(part, props = part.props, state = part.store.get()) {
    return definitionOf(part).state?.(state, view(part, props)) ?? {};
  }
  function present(part, props = part.props, state = part.store.get()) {
    return definitionOf(part).present?.(state, view(part, props)) ?? true;
  }
  function conditional(part) {
    return definitionOf(part).present !== void 0;
  }
  function liveAttrs(part, props = part.props) {
    return aliased(
      part,
      definitionOf(part).live?.read(part.store.get(), view(part, props)) ?? {}
    );
  }
  function subscribe(part, listener, props = part.props) {
    const narrowed = definitionOf(part).selects;
    const cleanups = [
      lease(part),
      narrowed ? narrowed.subscribe(part, listener, props) : subscribeSkipping(part.store, skipNone, listener)
    ];
    return () => cleanups.forEach((cleanup) => cleanup());
  }
  function handlers(part) {
    const { on: events, press: activate } = definitionOf(part);
    const result = {};
    for (const type in events) {
      const handler = events[type];
      result[type] = (event) => {
        if (event.defaultPrevented || composing(event)) {
          return;
        }
        ownerOf(part).sleeping?.wake();
        handler(event, context(part));
      };
    }
    if (typeof activate === "function" && !result.click) {
      result.click = (event) => {
        if (!event.defaultPrevented) {
          ownerOf(part).sleeping?.wake();
          activate(context(part), event);
        }
      };
    }
    return result;
  }
  function propsRendered(part) {
    part.propsListeners?.forEach((listener) => listener());
  }
  function onProps(part, listener) {
    const listeners2 = part.propsListeners ??= /* @__PURE__ */ new Set();
    listeners2.add(listener);
    return () => {
      listeners2.delete(listener);
    };
  }
  function canHide(part) {
    const definition = definitionOf(part);
    let hides = hidingSlots.get(definition);
    if (hides === void 0) {
      hides = !!definition.attrs && "hidden" in definition.attrs(part.store.get(), view(part, part.props));
      hidingSlots.set(definition, hides);
    }
    return hides;
  }
  function bind(part, el, host = { by: "core" }) {
    const kept = part;
    const { parts } = kept.owner;
    const mapKey = `${part.slot}:${part.key}`;
    if (!part.el && (parts.get(mapKey) ?? kept) === kept) {
      parts.delete(mapKey);
      parts.set(mapKey, kept);
    }
    if (dev) {
      checkShared(part, part.el, el);
      const { focus } = definitionOf(part);
      checkFocus(
        typeof focus === "function" ? focus(part.store.get(), view(part, part.props)) : focus,
        part.slot,
        el,
        {
          component: ownerOf(part).label,
          id: part.id
        }
      );
    }
    const binding = {};
    part.el = el;
    kept.binding = binding;
    const cleanups = [lease(kept)];
    if (canHide(part)) {
      enforceHidden(el.ownerDocument);
    }
    for (const [type, handler] of Object.entries(handlers(part))) {
      if (host.by === "core" || host.attaches !== "all" && !host.attaches.includes(type)) {
        cleanups.push(on(el, type, handler));
      }
    }
    const definition = definitionOf(part);
    if (definition.live) {
      cleanups.push(definition.live.attach(part, el));
    }
    if (host.by === "framework" && definition.direct) {
      cleanups.push(definition.direct.attach(part, el));
    }
    const early = definition.asleep?.(el, part);
    if (early) {
      cleanups.push(early);
    }
    const late = () => {
      const cleanup = definition.bind?.(el, part);
      if (cleanup) {
        cleanups.push(cleanup);
      }
    };
    const { sleeping } = kept.owner;
    if (sleeping && definition.bind) {
      sleeping.binds.add(late);
      cleanups.push(() => sleeping.binds.delete(late));
    } else {
      late();
    }
    if (definition.attrs && typeof MutationObserver !== "undefined") {
      cleanups.push(followId(kept, el));
    }
    return () => {
      cleanups.forEach((cleanup) => cleanup());
      if (kept.binding !== binding) {
        return;
      }
      part.el = kept.binding = void 0;
      if (kept.own !== void 0) {
        readIdLater(kept);
      }
    };
  }
  function checkShared(part, bound2, el) {
    if (!part.key || !bound2 || bound2 === el) {
      return;
    }
    queueMicrotask(() => {
      if (part.el !== el || !bound2.isConnected || !el.isConnected) {
        return;
      }
      const { parts, label } = ownerOf(part);
      for (const other of parts.values()) {
        if (other.el === bound2) {
          return;
        }
      }
      warn(
        `two "${part.slot}" parts share the key "${part.key}". Give each an id or a unique value.`,
        {
          component: label,
          id: part.id
        }
      );
    });
  }
  function aliased(part, attrs2) {
    const { owner: owner4 } = part;
    if (!owner4.named?.size || !references.some((name) => attrs2[name])) {
      return attrs2;
    }
    const aliases = aliasesOf(owner4, part.store);
    if (!aliases.size) {
      return attrs2;
    }
    const result = { ...attrs2 };
    for (const name of references) {
      const ids = result[name];
      if (ids) {
        result[name] = ids.split(" ").map((id) => aliases.get(id) ?? id).join(" ");
      }
    }
    return result;
  }
  function aliasesOf(owner4, store) {
    const version = renders(store);
    if (owner4.aliases?.version === version) {
      return owner4.aliases.map;
    }
    const map = /* @__PURE__ */ new Map();
    for (const part of owner4.named) {
      const made = madeId(part);
      if (made !== void 0 && made !== part.own) {
        map.set(made, part.own);
      }
    }
    owner4.aliases = { version, map };
    return map;
  }
  function followId(part, el) {
    if (el.hasAttribute("id") || part.own !== void 0) {
      readIdLater(part);
    }
    const observer = new MutationObserver(() => readIdLater(part));
    observer.observe(el, { attributeFilter: ["id"] });
    return () => observer.disconnect();
  }
  function readIdLater(part) {
    const { owner: owner4 } = part;
    if (!owner4.unread) {
      owner4.unread = /* @__PURE__ */ new Set();
      queueMicrotask(() => readIds(owner4, part.store));
    }
    owner4.unread.add(part);
  }
  function readIds(owner4, store) {
    const parts = owner4.unread;
    owner4.unread = void 0;
    let renamed = owner4.renamed === true;
    owner4.renamed = void 0;
    for (const part of parts) {
      renamed = rename(part, part.el && idOf(part.el)) || renamed;
    }
    if (renamed) {
      touch(store);
    }
  }
  function rename(part, id) {
    const made = madeId(part);
    const own = id && id !== made ? id : void 0;
    if (own === part.own) {
      return false;
    }
    const { owner: owner4 } = part;
    part.own = own;
    owner4.named ??= /* @__PURE__ */ new Set();
    if (own === void 0) {
      owner4.named.delete(part);
    } else {
      owner4.named.add(part);
    }
    owner4.aliases = void 0;
    return made !== void 0;
  }
  function composing(event) {
    return (event.type === "keydown" || event.type === "keyup") && isComposing(event);
  }
  var ownerOf, definitionOf, view, context, authorOwned, madeLabel, held2, selectedKeys, skipNone, hidingSlots, connect, references, madeId, idOf;
  var init_part = __esm({
    "node_modules/@ui-sdk/core/dist/foundation/kernel/part.js"() {
      init_dev_stub();
      init_style();
      init_events();
      init_store();
      ownerOf = (part) => part.owner;
      definitionOf = (part) => ownerOf(part).slots[part.slot];
      view = (part, props) => ({
        id: part.id,
        key: part.key,
        props,
        api: part.api
      });
      context = (part, props = part.props) => ({
        el: part.el,
        id: part.id,
        key: part.key,
        props,
        store: part.store,
        api: part.api
      });
      authorOwned = /* @__PURE__ */ new Set([
        "aria-label",
        "aria-labelledby",
        "aria-description",
        "title",
        "autocomplete",
        "autocapitalize",
        "autocorrect",
        "spellcheck",
        "inputmode",
        "enterkeyhint"
      ]);
      madeLabel = (value) => typeof value === "string" && value.split(/\s+/).every((id) => id.startsWith("ui-sdk-"));
      held2 = (part) => part.leases > 0;
      selectedKeys = (part, props = part.props) => definitionOf(part).selects?.selection(part, props) ?? "";
      skipNone = {};
      hidingSlots = /* @__PURE__ */ new WeakMap();
      connect = (part, el) => definitionOf(part).connect?.(el) ?? (() => {
      });
      references = [
        "aria-activedescendant",
        "aria-controls",
        "aria-describedby",
        "aria-details",
        "aria-errormessage",
        "aria-flowto",
        "aria-labelledby",
        "aria-owns",
        "for",
        "headers"
      ];
      madeId = (part) => definitionOf(part).attrs?.(
        part.store.get(),
        view(part, { ...part.props, id: void 0 })
      ).id;
      idOf = (el) => el.localName === "form" ? el.getAttribute("id") : el.id;
    }
  });

  // node_modules/@ui-sdk/core/dist/foundation/platform/env.js
  function isRTL(el) {
    return !!el && isBrowser && getComputedStyle(el).direction === "rtl";
  }
  var isBrowser;
  var init_env = __esm({
    "node_modules/@ui-sdk/core/dist/foundation/platform/env.js"() {
      isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
    }
  });

  // node_modules/@ui-sdk/core/dist/foundation/platform/announce.js
  var announce_exports = {};
  __export(announce_exports, {
    announce: () => announce,
    prepareAnnouncements: () => prepareAnnouncements,
    setAnnouncer: () => setAnnouncer
  });
  function setAnnouncer(announce2) {
    announcer = announce2;
  }
  function regionIn(doc, priority) {
    let found2 = regions.get(doc);
    if (!found2) {
      regions.set(doc, found2 = {});
    }
    const existing = found2[priority];
    if (existing?.isConnected) {
      return existing;
    }
    const region = doc.createElement("div");
    region.setAttribute("role", priority === "assertive" ? "alert" : "status");
    region.setAttribute("aria-live", priority);
    region.setAttribute("aria-atomic", "true");
    region.setAttribute(
      "data-ui-sdk-announcer",
      priority === "assertive" ? "assertive" : ""
    );
    region.style.cssText = "position:fixed;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap";
    doc.body.append(region);
    found2[priority] = region;
    return region;
  }
  function prepareAnnouncements(doc) {
    if (announcer || !doc.body) {
      return;
    }
    regionIn(doc, "polite");
    regionIn(doc, "assertive");
  }
  function announce(text, {
    priority = "polite",
    doc = typeof document === "undefined" ? void 0 : document
  } = {}) {
    if (!text) {
      return;
    }
    if (announcer) {
      return announcer(text, priority);
    }
    if (!doc?.body) {
      return;
    }
    const region = regionIn(doc, priority);
    region.textContent = "";
    clearTimeout(pending[priority]);
    pending[priority] = setTimeout(() => {
      region.textContent = text;
    }, 100);
  }
  var regions, announcer, pending;
  var init_announce = __esm({
    "node_modules/@ui-sdk/core/dist/foundation/platform/announce.js"() {
      regions = /* @__PURE__ */ new WeakMap();
      pending = {};
    }
  });

  // node_modules/@ui-sdk/core/dist/foundation/motion/presence.js
  function animateIn(el, done) {
    pendingResets.get(el)?.();
    const running = el.getAnimations?.({ subtree: true }).filter(isTransition);
    const settled = running?.every((animation) => targetOf(animation) !== el);
    el.setAttribute("data-starting-style", "");
    if (running && settled) {
      for (const animation of el.getAnimations({ subtree: true })) {
        if (isTransition(animation) && !running.some((moving) => continues(animation, moving))) {
          animation.finish();
        }
      }
    }
    let stopWaiting;
    let timer;
    const frame = requestAnimationFrame(
      () => timer = setTimeout(() => {
        el.removeAttribute("data-starting-style");
        if (done) {
          stopWaiting = whenFinished(el, done);
        }
      })
    );
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      stopWaiting?.();
      el.removeAttribute("data-starting-style");
    };
  }
  function seconds(value) {
    return value.split(",").map((part) => {
      const number = parseFloat(part);
      return part.trim().endsWith("ms") ? number / 1e3 : number;
    });
  }
  function longest(el) {
    return Math.max(
      durationOf(getComputedStyle(el)),
      durationOf(getComputedStyle(el, "::backdrop"))
    );
  }
  function durationOf(style) {
    const pairs = (durations, delays, iterations = "1") => {
      const d = seconds(durations);
      const l = seconds(delays);
      const n = iterations.split(",").map((part) => part.trim() === "infinite" ? 1 : parseFloat(part) || 1);
      return d.map(
        (duration, index) => (duration * (n[index % n.length] ?? 1) + (l[index % l.length] ?? 0)) * 1e3
      );
    };
    return Math.max(
      0,
      ...pairs(style.transitionDuration, style.transitionDelay),
      ...pairs(
        style.animationDuration,
        style.animationDelay,
        style.animationIterationCount
      )
    );
  }
  function remaining(animations) {
    let longestLeft = 0;
    for (const animation of animations) {
      const timing = animation.effect?.getComputedTiming();
      const end = Number(timing?.endTime);
      if (!timing || !Number.isFinite(end)) {
        continue;
      }
      longestLeft = Math.max(longestLeft, end - (Number(timing.localTime) || 0));
    }
    return longestLeft;
  }
  function whenFinished(el, done) {
    let finished = false;
    const animations = el.getAnimations({ subtree: true });
    const finish = () => {
      if (finished) {
        return;
      }
      finished = true;
      clearTimeout(timer);
      done();
    };
    const timer = animations.length ? setTimeout(finish, Math.max(longest(el), remaining(animations)) + 50) : void 0;
    if (!animations.length) {
      measured(finish);
    } else {
      Promise.allSettled(animations.map((animation) => animation.finished)).then(
        finish
      );
    }
    return () => {
      finished = true;
      clearTimeout(timer);
    };
  }
  var pendingResets, isTransition, targetOf, continues;
  var init_presence = __esm({
    "node_modules/@ui-sdk/core/dist/foundation/motion/presence.js"() {
      init_dev_stub();
      pendingResets = /* @__PURE__ */ new WeakMap();
      isTransition = (animation) => "transitionProperty" in animation;
      targetOf = (animation) => animation.effect?.target;
      continues = (animation, moving) => targetOf(animation) === targetOf(moving) && animation.transitionProperty === moving.transitionProperty;
    }
  });

  // node_modules/@ui-sdk/core/dist/page/agent/agent.js
  init_dev_stub();

  // node_modules/@ui-sdk/core/dist/foundation/kernel/order.js
  var following = 4;
  var isAfter = (node, later2) => !!(node.compareDocumentPosition(later2) & following);
  var documentOrder = (a, b) => isAfter(a, b) ? -1 : 1;
  var walkFrom = 16;
  var walkPerEntry = 32;
  function inDocumentOrder(entries2) {
    let container = entries2.length < walkFrom ? null : entries2[0].el.parentNode;
    while (container && !entries2.every(({ el }) => container.contains(el))) {
      container = container.parentNode;
    }
    if (container) {
      const byElement = new Map(
        entries2.map((entry) => [entry.el, entry])
      );
      const sorted = [];
      const walker = entries2[0].el.ownerDocument.createTreeWalker(container, 1);
      let budget = entries2.length * walkPerEntry;
      for (let node = container; node && budget--; node = walker.nextNode()) {
        const entry = byElement.get(node);
        if (entry && sorted.push(entry) === entries2.length) {
          return sorted;
        }
      }
    }
    return entries2.sort((a, b) => documentOrder(a.el, b.el));
  }
  function createOrder() {
    const entries2 = /* @__PURE__ */ new Map();
    let order;
    let joined = [];
    let left = false;
    let moves2;
    const watched = /* @__PURE__ */ new Set();
    const current = (entry) => entries2.get(entry.key) === entry;
    function watch2(added, list) {
      moves2 ??= new MutationObserver(() => order = void 0);
      const last = list[list.length - 1]?.el;
      for (const { el } of added) {
        for (let node = el.parentNode; node && !watched.has(node); node = node.parentNode) {
          watched.add(node);
          moves2.observe(node, { childList: true });
          if (node.contains(last)) {
            break;
          }
        }
      }
    }
    function sorted() {
      const all = [...entries2.values()];
      const list = inDocumentOrder(all.filter((entry) => entry.el.isConnected));
      if (list.length < all.length) {
        return list;
      }
      if (typeof MutationObserver !== "undefined") {
        moves2?.disconnect();
        watched.clear();
        watch2(list, list);
      }
      return order = list;
    }
    function updated(kept) {
      const added = joined.filter(current);
      if (added.some((entry) => !entry.el.isConnected)) {
        return;
      }
      const list = kept.filter(current);
      if (added.length * Math.log2(list.length + 2) > list.length) {
        return;
      }
      for (const entry of added) {
        let low = 0;
        let high = list.length;
        while (low < high) {
          const middle = low + high >> 1;
          if (isAfter(list[middle].el, entry.el)) {
            low = middle + 1;
          } else {
            high = middle;
          }
        }
        list.splice(low, 0, entry);
      }
      if (moves2) {
        watch2(added, list);
      }
      return list;
    }
    return {
      /** The entries in the page, in document order. Shared until one is added, removed or moved. */
      list() {
        if (moves2?.takeRecords().length) {
          order = void 0;
        }
        if (order && (joined.length || left)) {
          order = updated(order);
        }
        joined = [];
        left = false;
        return order ?? sorted();
      },
      /** Adds an entry, or replaces the one with its key. Returns its removal. */
      add(entry) {
        if (order && entries2.has(entry.key)) {
          left = true;
        }
        entries2.set(entry.key, entry);
        if (order) {
          joined.push(entry);
        }
        return () => {
          if (!current(entry)) {
            return;
          }
          entries2.delete(entry.key);
          left = true;
          if (!entries2.size) {
            moves2?.disconnect();
            watched.clear();
            order = void 0;
          }
        };
      },
      get: (key) => entries2.get(key),
      size: () => entries2.size
    };
  }

  // node_modules/@ui-sdk/core/dist/foundation/kernel/trusted.js
  var trusted = (event) => event.isTrusted;

  // node_modules/@ui-sdk/core/dist/foundation/forms/value.js
  var watchers = /* @__PURE__ */ new WeakMap();
  function prototypeValue(el) {
    return Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value");
  }
  function afterReset(event, run) {
    setTimeout(() => {
      if (!event.defaultPrevented) {
        run();
      }
    });
  }
  var scriptWrites = /* @__PURE__ */ new Set();
  function writeFromScript(el, write) {
    if (scriptWrites.has(el)) {
      return write();
    }
    scriptWrites.add(el);
    try {
      write();
    } finally {
      scriptWrites.delete(el);
    }
  }
  function writingFromScript(el) {
    for (let node = el; node; node = node.parentElement) {
      if (scriptWrites.has(node)) {
        return true;
      }
    }
    return false;
  }
  function writeValue(el, value, options) {
    if (options?.asUser && !writingFromScript(el)) {
      prototypeValue(el).set.call(el, value);
      el.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    } else if (el.value !== value) {
      el.value = value;
    }
  }
  function notify(el, source) {
    watchers.get(el)?.forEach((listener) => listener(source));
  }
  function watchValue(el, listener) {
    let listeners2 = watchers.get(el);
    if (!listeners2) {
      listeners2 = /* @__PURE__ */ new Set();
      watchers.set(el, listeners2);
      intercept(el);
    }
    listeners2.add(listener);
    return () => {
      listeners2.delete(listener);
      if (listeners2.size) {
        return;
      }
      watchers.delete(el);
      release(el);
    };
  }
  var restores = /* @__PURE__ */ new WeakMap();
  function intercept(el) {
    const own = Object.getOwnPropertyDescriptor(el, "value");
    const base = own ?? prototypeValue(el);
    Object.defineProperty(el, "value", {
      configurable: true,
      enumerable: base.enumerable,
      get() {
        return base.get.call(el);
      },
      set(value) {
        base.set.call(el, value);
        notify(el, "write");
      }
    });
    const onInput = () => notify(el, "input");
    const onReset = (event) => {
      if (event.target === el.form) {
        afterReset(event, () => notify(el, "reset"));
      }
    };
    el.addEventListener("input", onInput);
    el.ownerDocument.addEventListener("reset", onReset, true);
    restores.set(el, () => {
      el.removeEventListener("input", onInput);
      el.ownerDocument.removeEventListener("reset", onReset, true);
      if (own) {
        Object.defineProperty(el, "value", own);
      } else {
        delete el.value;
      }
    });
  }
  function release(el) {
    restores.get(el)?.();
    restores.delete(el);
  }

  // node_modules/@ui-sdk/core/dist/foundation/forms/form.js
  var internalsOf = /* @__PURE__ */ new WeakMap();
  var focusOf = /* @__PURE__ */ new WeakMap();
  function focusWith(el, focus) {
    focusOf.set(el, focus);
    return () => {
      if (focusOf.get(el) === focus) {
        focusOf.delete(el);
      }
    };
  }
  function focusControl(el) {
    const focus = focusOf.get(el);
    if (focus) {
      focus();
    } else {
      el.focus();
    }
  }
  var focusing = /* @__PURE__ */ new WeakSet();
  function claimInvalidFocus(el, form) {
    const owner4 = form ?? el.ownerDocument;
    if (focusing.has(owner4)) {
      return;
    }
    focusing.add(owner4);
    setTimeout(() => focusing.delete(owner4));
    focusControl(el);
  }
  function invalidFocusClaimed(el, form) {
    return focusing.has(form ?? el.ownerDocument);
  }
  function attachFormInternals(el, internals, bind2) {
    internalsOf.set(el, { internals, bind: bind2 });
  }
  function formInternals(el) {
    return el ? internalsOf.get(el)?.internals : void 0;
  }
  var messages = /* @__PURE__ */ new Map();
  function valueMissingMessage(type) {
    if (typeof document === "undefined") {
      return "";
    }
    if (!messages.has(type)) {
      const control = type === "select" ? document.createElement("select") : Object.assign(document.createElement("input"), { type });
      control.name = "message";
      control.required = true;
      messages.set(type, control.validationMessage);
    }
    return messages.get(type);
  }
  var validityListeners = /* @__PURE__ */ new Set();
  function validityChanged(el) {
    validityListeners.forEach((listener) => listener(el));
  }
  function onValidityChange(listener) {
    validityListeners.add(listener);
    return () => {
      validityListeners.delete(listener);
    };
  }
  var blocksImplicitSubmission = /* @__PURE__ */ new Set([
    "text",
    "search",
    "url",
    "tel",
    "email",
    "password",
    "date",
    "month",
    "week",
    "time",
    "datetime-local",
    "number"
  ]);
  function submitImplicitly(form) {
    if (!form) {
      return;
    }
    const elements2 = Array.from(form.elements);
    const button2 = elements2.find(
      (el) => el instanceof HTMLButtonElement && el.type === "submit" || el instanceof HTMLInputElement && (el.type === "submit" || el.type === "image")
    );
    if (button2) {
      if (!button2.disabled) {
        button2.click();
      }
      return;
    }
    const blocking = elements2.filter(
      (el) => el instanceof HTMLInputElement && blocksImplicitSubmission.has(el.type)
    );
    if (blocking.length <= 1) {
      form.requestSubmit();
    }
  }
  function dispatchChange(el, types = ["input", "change"]) {
    if (!el || writingFromScript(el)) {
      return;
    }
    queueMicrotask(() => {
      if (!el.isConnected) {
        return;
      }
      if (types.includes("input")) {
        el.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      }
      if (types.includes("change")) {
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }
  function fieldsetDisabled(el) {
    for (let node = el.parentElement; node; node = node.parentElement) {
      if (!(node instanceof HTMLFieldSetElement) || !node.disabled) {
        continue;
      }
      const legend = node.querySelector(":scope > legend");
      if (!legend?.contains(el)) {
        return true;
      }
    }
    return false;
  }
  var hiddenInputStyle = "position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;opacity:0;pointer-events:none";
  function associate(input2, options) {
    const cleanups = [];
    const onReset = (event) => {
      if (event.target !== input2.form) {
        return;
      }
      afterReset(event, () => {
        options.reset();
        options.write();
      });
    };
    input2.ownerDocument.addEventListener("reset", onReset, true);
    cleanups.push(
      () => input2.ownerDocument.removeEventListener("reset", onReset, true)
    );
    const onFocus = () => options.focus();
    input2.addEventListener("focus", onFocus);
    cleanups.push(() => input2.removeEventListener("focus", onFocus));
    cleanups.push(watchFieldsets(input2, options.disabled));
    return () => cleanups.forEach((cleanup) => cleanup());
  }
  var moves = /* @__PURE__ */ new WeakMap();
  function watchFieldsets(el, onChange) {
    let disabled;
    let observer;
    let active = true;
    const check = () => {
      if (observer) {
        observer.disconnect();
        for (let node = el.parentElement; node?.closest("fieldset"); node = node.parentElement) {
          observer.observe(node, {
            childList: true,
            attributeFilter: ["disabled"]
          });
        }
      }
      const now = fieldsetDisabled(el);
      if (now !== disabled) {
        onChange(disabled = now);
      }
    };
    const watch2 = () => {
      if (!active) {
        return;
      }
      if (typeof MutationObserver !== "undefined") {
        observer = new MutationObserver(check);
      }
      check();
      moves.set(el, check);
    };
    if (el.isConnected) {
      watch2();
    } else {
      queueMicrotask(watch2);
    }
    return () => {
      active = false;
      observer?.disconnect();
      moves.delete(el);
    };
  }
  var elementMoved = (el) => moves.get(el)?.();
  var isDisabled = (state) => state.disabled || state.formDisabled;
  var watchFormDisabled = (el, store) => watchFieldsets(el, (formDisabled) => store.set({ formDisabled }));
  var isDisabledElement = (el) => el.matches(":disabled") || el.getAttribute("aria-disabled") === "true";
  function bindHiddenInput(input2, options) {
    const write = () => {
      const checked2 = options.checked();
      if (input2.checked !== checked2) {
        input2.checked = checked2;
      }
      const indeterminate = options.indeterminate?.() ?? false;
      if (input2.indeterminate !== indeterminate) {
        input2.indeterminate = indeterminate;
      }
    };
    write();
    const cleanups = [
      options.subscribe(write),
      associate(input2, { ...options, write })
    ];
    const onClick = (event) => {
      const control = options.control?.();
      if (!control || isLabelable(control)) {
        return;
      }
      event.preventDefault();
      options.focus();
      options.activate?.(event);
    };
    input2.addEventListener("click", onClick);
    cleanups.push(() => input2.removeEventListener("click", onClick));
    queueMicrotask(() => {
      const control = options.control?.();
      if (control && !isLabelable(control)) {
        cleanups.push(labelledBy(control, () => labelsOf(input2)));
      }
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }
  function bindValueInput(input2, options) {
    const write = () => writeValue(input2, options.value());
    write();
    const onChange = (event) => {
      if (!trusted(event) || input2.value === options.value()) {
        return;
      }
      options.autofill?.(input2.value);
      write();
    };
    input2.addEventListener("change", onChange);
    const cleanups = [
      options.subscribe(write),
      associate(input2, { ...options, write }),
      () => input2.removeEventListener("change", onChange)
    ];
    return () => cleanups.forEach((cleanup) => cleanup());
  }
  function bindInternals(el, options) {
    const attached = internalsOf.get(el);
    return attached ? attached.bind(el, attached.internals, options) : () => {
    };
  }
  var labelCount = 0;
  var fieldControlId = (fieldId) => `${fieldId}-control`;
  function isLabelable(el) {
    return el instanceof HTMLButtonElement || el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement || el instanceof HTMLMeterElement || el instanceof HTMLOutputElement || el instanceof HTMLProgressElement || internalsOf.has(el);
  }
  function nameFromLabels(el, target = el) {
    return formInternals(el) ? labelledBy(target, () => labelsOf(el), el) : () => {
    };
  }
  function labelsOf(el) {
    const labels2 = [];
    const around = el.closest("label");
    if (around?.control === el) {
      labels2.push(around);
    }
    if (el.id) {
      const root = el.getRootNode();
      root.querySelectorAll(`label[for="${CSS.escape(el.id)}"]`).forEach((label) => {
        if (label !== around && label.control === el) {
          labels2.push(label);
        }
      });
    }
    return labels2.sort(documentOrder);
  }
  function labelledBy(el, findLabels, watch2 = el) {
    let written;
    const update = () => {
      const current = el.getAttribute("aria-labelledby");
      if (el.hasAttribute("aria-label") || current !== null && current !== written) {
        return;
      }
      const labels2 = findLabels();
      for (const label of labels2) {
        if (!label.id) {
          label.id = `ui-sdk-label-${++labelCount}`;
        }
      }
      const ids = labels2.map((label) => label.id).join(" ");
      if (!ids) {
        if (written !== void 0) {
          el.removeAttribute("aria-labelledby");
        }
        written = void 0;
        return;
      }
      written = ids;
      if (current !== ids) {
        el.setAttribute("aria-labelledby", ids);
      }
    };
    queueMicrotask(update);
    watch2.addEventListener("focusin", update);
    return () => watch2.removeEventListener("focusin", update);
  }

  // node_modules/@ui-sdk/core/dist/foundation/kernel/details.js
  var programmaticReasons = /* @__PURE__ */ new Set([
    "image-load",
    "image-error",
    "imperative",
    "item-removed",
    "unmount",
    "reset",
    "restore",
    "timeout",
    "resize",
    "page-hide"
  ]);
  var cause;
  function resolveSource(reason, eventSource) {
    if (cause === "agent") {
      return cause;
    }
    if (programmaticReasons.has(reason)) {
      return "programmatic";
    }
    if (eventSource) {
      const source = eventSource();
      return source === "programmatic" && cause ? cause : source;
    }
    return cause ?? "programmatic";
  }
  function withSource(source, run) {
    const outer = cause;
    cause = source;
    try {
      return run();
    } finally {
      cause = outer;
    }
  }
  function createDetails(given, source, cancelable = true) {
    if (!cancelable) {
      return { ...given, source };
    }
    let canceled = false;
    return {
      ...given,
      source,
      cancel: () => {
        canceled = true;
      },
      get canceled() {
        return canceled;
      }
    };
  }

  // node_modules/@ui-sdk/core/dist/page/agent/agent.js
  init_part();

  // node_modules/@ui-sdk/core/dist/foundation/text/accessible-name.js
  var implicitRoles = [
    ["button", "button"],
    ["a[href]", "link"],
    ["input[type=checkbox][switch]", "switch"],
    ["input[type=checkbox]", "checkbox"],
    ["input[type=radio]", "radio"],
    ["input[type=range]", "slider"],
    ["dialog", "dialog"],
    ["h1, h2, h3, h4, h5, h6", "heading"]
  ];
  var namedByContent = /* @__PURE__ */ new Set([
    "button",
    "cell",
    "checkbox",
    "columnheader",
    "gridcell",
    "heading",
    "link",
    "menuitem",
    "menuitemcheckbox",
    "menuitemradio",
    "option",
    "radio",
    "row",
    "rowheader",
    "switch",
    "tab",
    "treeitem"
  ]);
  function roleOf(el) {
    const explicit = el.getAttribute("role")?.trim().split(/\s+/)[0];
    if (explicit) {
      return explicit;
    }
    return implicitRoles.find(([selector]) => el.matches(selector))?.[1] ?? "";
  }
  function isHidden(el) {
    if (el.hasAttribute("hidden") || el.getAttribute("aria-hidden") === "true") {
      return true;
    }
    const style = el.ownerDocument.defaultView?.getComputedStyle(el);
    return style?.display === "none" || style?.visibility === "hidden";
  }
  function byId(el, id) {
    const root = el.getRootNode();
    return root.getElementById?.(id) ?? null;
  }
  function labelledByOf(el) {
    return (el.getAttribute("aria-labelledby") ?? "").split(/\s+/).map((id) => id && byId(el, id)).filter((label) => !!label).map((label) => label.getAttribute("aria-label") ?? contentOf(label, true)).join(" ");
  }
  function embeddedName(el) {
    if (el.localName === "img") {
      return el.getAttribute("alt") ?? "";
    }
    if (el.localName !== "svg") {
      return "";
    }
    return [...el.children].find((child) => child.localName === "title")?.textContent ?? "";
  }
  function nameWithin(el, labelling, hidden) {
    if (el.matches("input, select, textarea")) {
      return "";
    }
    const own = !labelling && labelledByOf(el) || el.getAttribute("aria-label")?.trim() || embeddedName(el);
    if (own) {
      return ` ${own} `;
    }
    if (el.localName === "svg") {
      return "";
    }
    const content = contentOf(el, labelling, hidden);
    const title = el.getAttribute("title");
    return content || (title ? ` ${title} ` : "");
  }
  function contentOf(el, labelling = false, hidden = isHidden(el)) {
    let text = "";
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.nodeValue;
      } else if (node.nodeType === Node.ELEMENT_NODE && (hidden || !isHidden(node))) {
        text += nameWithin(node, labelling, hidden);
      }
    }
    return text;
  }
  var collapse = (text) => text.replace(/\s+/g, " ").trim();
  var labelsOf2 = (el) => [...el.labels ?? []].map((label) => contentOf(label)).join(" ");
  var nameSources = [
    labelledByOf,
    (el) => el.getAttribute("aria-label") ?? "",
    labelsOf2,
    embeddedName,
    (el) => namedByContent.has(roleOf(el)) ? contentOf(el) : "",
    (el) => el.getAttribute("title") ?? ""
  ];
  var labelsLast = [
    ...nameSources.filter((source) => source !== labelsOf2),
    labelsOf2
  ];
  function firstName(el, sources) {
    for (const source of sources) {
      const name = collapse(source(el));
      if (name) {
        return name;
      }
    }
    return "";
  }
  function accessibleName(el) {
    return firstName(el, nameSources);
  }

  // node_modules/@ui-sdk/core/dist/foundation/text/locale.js
  function toLocale(tag) {
    try {
      return Intl.getCanonicalLocales(
        tag ? tag.split(/[.@]/)[0].replaceAll("_", "-") : []
      )[0];
    } catch {
    }
  }
  function userLocale() {
    if (typeof navigator === "undefined") {
      return void 0;
    }
    return toLocale(navigator.languages?.[0] ?? navigator.language);
  }

  // node_modules/@ui-sdk/core/dist/foundation/text/match.js
  var latinLetters = "abcdefghijklmnopqrstuvwxyz";
  var diacritics = /\p{Diacritic}/gu;
  var latin = /\p{Script=Latin}/u;
  var ascii = /^[\u0000-\u007f]*$/;
  var specialCase = /^(tr|az|lt)\b/i;
  function createFolder(locale) {
    const collator = new Intl.Collator(locale, {
      sensitivity: "base",
      usage: "search"
    });
    const lower = specialCase.test(locale ?? "") ? (text) => text.toLocaleLowerCase(locale) : (text) => text.toLowerCase();
    const chars = /* @__PURE__ */ new Map();
    const texts = /* @__PURE__ */ new Map();
    function foldChar(char) {
      let folded = chars.get(char);
      if (folded !== void 0) {
        return folded;
      }
      const lowered = lower(char);
      if (char < "\x80") {
        chars.set(char, lowered);
        return lowered;
      }
      const stripped = lower(char.normalize("NFD").replace(diacritics, ""));
      if (stripped.length === char.length && stripped !== lowered && collator.compare(char, stripped) === 0) {
        folded = stripped;
      } else if (latin.test(char)) {
        folded = [...latinLetters].find(
          (letter) => collator.compare(char, letter) === 0
        );
      }
      folded ??= lowered.length === char.length ? lowered : char;
      chars.set(char, folded);
      return folded;
    }
    function fold2(text) {
      let folded = texts.get(text);
      if (folded !== void 0) {
        return folded;
      }
      if (ascii.test(text)) {
        folded = lower(text);
      } else {
        folded = "";
        for (const char of text) {
          folded += foldChar(char);
        }
      }
      if (texts.size > 5e4) {
        texts.clear();
      }
      texts.set(text, folded);
      return folded;
    }
    return { locale, fold: fold2 };
  }
  var folder;
  var watching = false;
  function userFolder() {
    if (folder) {
      return folder;
    }
    if (!watching && typeof window !== "undefined") {
      watching = true;
      window.addEventListener("languagechange", () => folder = void 0);
    }
    return folder = createFolder(userLocale());
  }
  var foldText = (text) => userFolder().fold(text);

  // node_modules/@ui-sdk/core/dist/page/observe/marks.js
  init_dev_stub();

  // node_modules/@ui-sdk/core/dist/foundation/platform/platform.js
  init_env();
  function supportsTopLayer() {
    return isBrowser && typeof HTMLElement.prototype.showPopover === "function";
  }
  function portalTarget(container) {
    if (container) {
      return container;
    }
    if (isBrowser && !supportsTopLayer()) {
      return document.body;
    }
    return null;
  }
  function composedHops(node) {
    const hops = [node];
    let at = node;
    while (at) {
      const next = at.assignedSlot ?? at.parentNode ?? at.host;
      if (next && next !== at.parentNode) {
        hops.push(next);
      }
      at = next;
    }
    return hops;
  }
  function composedClosest(node, selector) {
    for (const hop of composedHops(node)) {
      const found2 = hop.closest?.(selector);
      if (found2) {
        return found2;
      }
    }
    return null;
  }
  var platformOverride;
  var apple;
  function isApple() {
    if (platformOverride) {
      return platformOverride === "apple";
    }
    return apple ??= isBrowser && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
  }

  // node_modules/@ui-sdk/core/dist/page/observe/marks.js
  var marks = ["data-agent-confirm", "data-agent-hidden", "data-agent-secret"];
  function confirmOf(elements2) {
    for (const el of elements2) {
      const text = composedClosest(el, "[data-agent-confirm]")?.getAttribute(
        "data-agent-confirm"
      );
      if (text != null) {
        return text.trim().slice(0, 200) || "This needs a person.";
      }
    }
  }
  var isOffLimits = (elements2) => elements2.some((el) => composedClosest(el, "[data-agent-hidden]"));
  var isSecret = (elements2) => elements2.some((el) => composedClosest(el, "[data-agent-secret]"));
  function textOf(el, skip = []) {
    let text = "";
    const walk = (node) => {
      for (const child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          text += child.textContent;
        } else if (child instanceof Element && !skip.includes(child) && !child.hasAttribute("data-agent-hidden") && child.getAttribute("aria-hidden") !== "true") {
          walk(child);
        }
      }
    };
    walk(el);
    return text.replace(/\s+/g, " ").trim();
  }
  var checkMarks2 = (elements2) => checkMarks(elements2, marks);

  // node_modules/@ui-sdk/core/dist/page/agent/guard.js
  var guardedActions = /* @__PURE__ */ new WeakMap();

  // node_modules/@ui-sdk/core/dist/foundation/kernel/keep.js
  init_dev_stub();
  var lifecycles = /* @__PURE__ */ new WeakMap();
  var making;
  var deferring = false;
  var destroying = 0;
  function whileDestroying(run) {
    destroying++;
    try {
      run();
    } finally {
      destroying--;
    }
  }
  function withLifecycle(make) {
    const outer = making;
    const lifecycle = { starts: [] };
    making = lifecycle;
    let instance;
    try {
      instance = make();
    } finally {
      making = outer;
    }
    lifecycles.set(instance, lifecycle);
    if (outer) {
      outer.starts.push(() => {
        keep(instance);
        return () => release2(instance);
      });
    } else if (!deferring && typeof document !== "undefined") {
      keep(instance);
    }
    return instance;
  }
  function whenKept(start) {
    if (making) {
      making.starts.push(start);
    } else if (dev) {
      warn(
        "`whenKept` runs only while an instance is made, so this work never starts."
      );
    }
  }
  function extendLifecycle(instance, run) {
    const outer = making;
    const added = { starts: [] };
    making = added;
    try {
      run();
    } finally {
      making = outer;
    }
    const lifecycle = lifecycles.get(instance);
    if (!lifecycle) {
      return;
    }
    lifecycle.starts.push(...added.starts);
    for (const start of lifecycle.stops ? added.starts : []) {
      const stop = start();
      if (stop) {
        lifecycle.stops.push(stop);
      }
    }
  }
  function keep(instance) {
    const lifecycle = lifecycles.get(instance);
    if (!lifecycle || lifecycle.stops) {
      return;
    }
    const stops = lifecycle.stops = [];
    for (const start of lifecycle.starts) {
      const stop = start();
      if (stop) {
        stops.push(stop);
      }
    }
  }
  function release2(instance) {
    const lifecycle = lifecycles.get(instance);
    const stops = lifecycle?.stops;
    if (!stops) {
      return;
    }
    lifecycle.stops = void 0;
    stops.forEach((stop) => stop());
  }
  function discard(instance) {
    release2(instance);
    lifecycles.delete(instance);
  }

  // node_modules/@ui-sdk/core/dist/foundation/kernel/watchers.js
  var watchers2 = {};
  var earlier = /* @__PURE__ */ new Set();
  var watchLater = /* @__PURE__ */ new WeakMap();
  function watchWhileKept(instance, parts, definition) {
    let unwatch;
    let waiting;
    const untrack = () => {
      unwatch?.();
      unwatch = void 0;
      if (waiting) {
        earlier.delete(waiting);
      }
      waiting = void 0;
    };
    whenKept(() => {
      if (watchers2.add) {
        unwatch = watchers2.add(instance, parts, definition);
      } else if (typeof document !== "undefined") {
        earlier.add(waiting = new WeakRef(instance));
        watchLater.set(
          instance,
          () => unwatch = watchers2.add?.(instance, parts, definition)
        );
        if (earlier.size % 1e3 === 0) {
          for (const old of earlier) {
            if (!old.deref()) {
              earlier.delete(old);
            }
          }
        }
      }
      return untrack;
    });
  }
  function watchEarlier() {
    for (const ref2 of earlier) {
      earlier.delete(ref2);
      const instance = ref2.deref();
      if (instance) {
        watchLater.get(instance)?.();
      }
    }
  }

  // node_modules/@ui-sdk/core/dist/page/observe/registry.js
  var entries = /* @__PURE__ */ new Map();
  var byId2 = /* @__PURE__ */ new Map();
  var retired = /* @__PURE__ */ new Map();
  var retiredLimit = 500;
  var offPage = /* @__PURE__ */ new Map();
  var partsOf = /* @__PURE__ */ new WeakMap();
  var count = 0;
  var listeners = /* @__PURE__ */ new Map();
  function watch(instance, parts, {
    controlled,
    commits,
    agent,
    options
  }) {
    const entry = {
      ref: `c${++count}`,
      id: instance.id,
      component: instance.name,
      agent,
      options,
      controlled,
      commits,
      started: /* @__PURE__ */ new Map(),
      instance: new WeakRef(instance),
      secret: agent?.secret
    };
    entries.set(entry.ref, entry);
    byId2.set(entry.id, entry);
    partsOf.set(instance, parts);
    return () => retire(entry);
  }
  function retire(entry) {
    if (entries.get(entry.ref) !== entry) {
      return;
    }
    entries.delete(entry.ref);
    if (byId2.get(entry.id) === entry) {
      byId2.delete(entry.id);
    }
    if (!entry.key || entry.secret || entry.offLimits) {
      return;
    }
    const queued2 = retired.get(entry.key);
    if (queued2?.at === count) {
      queued2.refs.push(entry.ref);
    } else {
      retired.delete(entry.key);
      retired.set(entry.key, { at: count, refs: [entry.ref] });
      if (retired.size > retiredLimit) {
        retired.delete(retired.keys().next().value);
      }
    }
    const state = entry.instance.deref()?.get();
    const keys = stateKeys(entry, state ?? {}).filter((key) => key !== "open");
    if (!state || !keys.length) {
      return;
    }
    const last = {
      ref: entry.ref,
      component: entry.component,
      offPage: true,
      actions: []
    };
    if (entry.label) {
      last.label = entry.label;
    }
    if (entry.row) {
      last.row = entry.row;
    }
    for (const key of keys) {
      if (key === "value" || state[key] !== "") {
        last[key] = state[key] ?? null;
      }
    }
    offPage.delete(entry.ref);
    offPage.set(entry.ref, last);
    if (offPage.size > 50) {
      offPage.delete(offPage.keys().next().value);
    }
  }
  var secret = /\b(password|current-password|new-password|one-time-code|cc-[a-z-]+)\b/i;
  var stateKeys = (entry, state) => entry.controlled ?? ["open", "value", "checked"].filter((key) => key in state);
  function remember(entry, parts) {
    const first = !entry.key;
    const elements2 = parts.map((part) => part.el);
    checkMarks2(elements2);
    entry.label = componentLabel(parts);
    entry.row = rowOf(parts);
    entry.secret ||= isSecret(elements2) || parts.some(
      ({ el }) => secret.test(
        `${el.getAttribute("type")} ${el.getAttribute("autocomplete")}`
      )
    );
    entry.offLimits = isOffLimits(elements2) || elements2.every((el) => el.type === "hidden");
    entry.key = `${entry.component}|${entry.label}|${entry.row}`;
    if (!first) {
      return;
    }
    const queue = retired.get(entry.key)?.refs;
    const ref2 = queue?.shift();
    if (!ref2) {
      return;
    }
    if (!queue.length) {
      retired.delete(entry.key);
    }
    offPage.delete(ref2);
    entries.delete(entry.ref);
    entry.ref = ref2;
    entries.set(ref2, entry);
  }
  function bound(instance) {
    return [...partsOf.get(instance)?.values() ?? []].filter(
      (part) => part.el?.isConnected
    );
  }
  function componentLabel(parts) {
    const keyless = (slot) => parts.find((part) => part.slot === slot && !part.key)?.el;
    const first = (slot) => {
      const found2 = parts.filter((part) => part.slot === slot);
      return new Set(found2.map((part) => part.key)).size === 1 ? found2[0].el : found2.find((part) => !part.key)?.el;
    };
    const text = (el) => el && textOf(el).slice(0, 80) || void 0;
    const label = text(first("label"));
    if (label) {
      return label;
    }
    const group = keyless("group") ?? keyless("root");
    const name = group && accessibleName(group);
    if (name) {
      return name;
    }
    const input2 = parts.find(
      (part) => part.slot === "input" || part.slot === "control" && part.el.matches("input, textarea")
    )?.el;
    const popup = parts.find((part) => part.slot === "content")?.el;
    const field2 = input2 && !popup?.contains(input2) && accessibleName(input2);
    if (field2) {
      return field2;
    }
    const root = keyless("root");
    const button2 = root && (root.tagName === "BUTTON" || root.getAttribute("role") === "button") ? root : void 0;
    const named = (el) => el && accessibleName(el) || text(el);
    const shown2 = named(first("title")) ?? named(first("heading")) ?? named(first("trigger")) ?? named(button2);
    if (shown2) {
      return shown2;
    }
    const keys = new Set(parts.map((part) => part.key).filter(Boolean));
    const keyed = keys.size === 1 ? parts.filter((part) => part.key) : [];
    for (const part of [...parts.filter((part2) => !part2.key), ...keyed]) {
      const name2 = accessibleName(part.el);
      if (name2) {
        return name2;
      }
    }
  }
  function rowOf(parts) {
    const el = (parts.find((part) => part.slot === "trigger" || part.slot === "root") ?? parts[0])?.el;
    const row = el?.closest("li, tr, [role=row], [role=listitem]");
    if (!row || parts.some((part) => part.el.contains(row))) {
      return;
    }
    const own = parts.flatMap(({ el: el2 }) => [
      el2,
      ...el2.labels ?? []
    ]);
    const words = [];
    const walker = row.ownerDocument.createTreeWalker(row, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!own.some((el2) => el2.contains(node)) && !isOffLimits([node.parentElement]) && node.textContent?.trim()) {
        words.push(node.textContent.trim());
      }
    }
    return words.join(" ").slice(0, 80) || void 0;
  }
  function report(id, key, value, details, previous) {
    const entry = byId2.get(id);
    if (!listeners.size || !entry) {
      return;
    }
    const { source } = details;
    const held3 = !!entry.commits?.includes(key) && source !== "programmatic" && source !== "agent";
    if (entry.started.has(key) !== held3) {
      entry.started.set(key, held3 ? previous : value);
    }
    send(entry, key, value, details, previous, held3 || void 0);
  }
  function settle(id, key, value, details) {
    const entry = byId2.get(id);
    if (!listeners.size || !entry?.started.has(key)) {
      return;
    }
    send(entry, key, value, details, entry.started.get(key), false);
    entry.started.delete(key);
  }
  function send(entry, key, value, details, previous, live2) {
    const instance = entry.instance.deref();
    if (!instance) {
      return;
    }
    const parts = bound(instance);
    if (parts.length) {
      remember(entry, parts);
    }
    const change = {
      ref: entry.ref,
      component: entry.component,
      id: entry.id,
      key,
      value: entry.secret ? "[redacted]" : value,
      previous: entry.secret ? "[redacted]" : previous,
      reason: details.reason,
      source: details.source
    };
    if (entry.label) {
      change.label = entry.label;
    }
    if (entry.row) {
      change.row = entry.row;
    }
    listeners.forEach(
      (hearsSteps, listener) => (live2 ?? hearsSteps) === hearsSteps && listener(change, parts)
    );
  }
  function install() {
    if (typeof document === "undefined") {
      return;
    }
    if (watchers2.add) {
      return;
    }
    watchers2.add = watch;
    watchers2.change = report;
    watchers2.commit = settle;
    watchEarlier();
  }
  function listen(listener, live2 = false) {
    install();
    listeners.set(listener, live2);
    return () => {
      listeners.delete(listener);
    };
  }

  // node_modules/@ui-sdk/core/dist/page/agent/agent.js
  var verbs = /^(set[A-Z]|(open|close|toggle|select|clear|next|previous|first|last|play|pause|show|hide|expand|collapse|increment|decrement|reset|submit|add|remove|insert)([A-Z]|$))/;
  var synonyms = {
    open: ["setOpen"],
    close: ["setOpen"],
    show: ["setOpen"],
    hide: ["setOpen"],
    toggle: ["setOpen", "setChecked", "setPressed"],
    select: ["setValue"]
  };
  var shown = [
    "min",
    "max",
    "step",
    "placeholder",
    "query",
    "multiple",
    "required",
    "errors"
  ];
  var frames = () => new Promise((resolve) => {
    if (document.hidden) {
      setTimeout(resolve, 32);
    } else {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    }
  });
  var keyOf = (value) => value !== null && typeof value === "object" ? JSON.stringify(value) : String(value);
  var internalOf = (instance) => instance.api.internal;
  var keyFor = (instance) => internalOf(instance)?.keyOf ?? keyOf;
  function fromData(items, disabled, key = keyOf, known) {
    if (!Array.isArray(items)) {
      return;
    }
    const out = [];
    const listed = new Set(known);
    const push = (value, label) => {
      if (!listed.has(key(value))) {
        out.push({ value: String(value), label });
        known?.add(key(value));
      }
    };
    const add = (item) => {
      if (typeof item === "string") {
        push(item, item);
      } else if (item && typeof item === "object") {
        const entry = item;
        if (entry.type === "group") {
          entry.items?.forEach(add);
        } else if (entry.type !== "separator") {
          push(entry.value, entry.label ?? "");
          if (entry.disabled === true) {
            disabled?.add(key(entry.value));
          }
          entry.children?.forEach(add);
        }
      }
    };
    items.forEach(add);
    return out;
  }
  function dataOf(entry, instance, disabled, known = /* @__PURE__ */ new Set()) {
    const key = keyFor(instance);
    const items = fromData(
      entry.agent?.items?.(instance.api) ?? instance.get().items,
      disabled,
      key,
      known
    );
    const empty = items && fromData(internalOf(instance)?.options?.().emptyItems, disabled, key, known);
    return empty ? [...items, ...empty] : items;
  }
  function disabledItems(entry, instance) {
    const disabled = /* @__PURE__ */ new Set();
    dataOf(entry, instance, disabled);
    const parts = bound(instance);
    const items = new Set(renderedItems(parts).map((item) => item.value));
    for (const part of parts) {
      if (items.has(part.key) && (part.props?.disabled === true || part.el.matches(":disabled") || part.el.getAttribute("aria-disabled") === "true")) {
        disabled.add(
          keyFor(instance)(
            part.props?.value ?? part.key
          )
        );
      }
    }
    return disabled;
  }
  function actionsOf(entry, api) {
    const declared = entry.agent?.actions;
    return Object.keys(api).filter(
      (name) => typeof api[name] === "function" && (declared ? declared.includes(name) : verbs.test(name) && !synonyms[name]?.some((of) => of in api))
    );
  }
  function can(entry, instance, action) {
    if (action === "press") {
      return true;
    }
    return typeof instance.api[action] === "function" && takes(entry, action);
  }
  function takes(entry, action) {
    const declared = entry.agent?.actions;
    if (!declared) {
      return verbs.test(action);
    }
    return declared.includes(action) || !!synonyms[action]?.some((of) => declared.includes(of));
  }
  function valueFor(entry, action, value) {
    const spec = entry.options?.[action[3].toLowerCase() + action.slice(4)];
    const refuse = (expected) => {
      const given = JSON.stringify(value) ?? "nothing";
      throw new Error(
        `${action} on ${entry.label ?? entry.component} (${entry.ref}) takes ${expected ? `${expected}, not` : "no"} ${given}.`
      );
    };
    if (spec === "boolean") {
      return typeof value === "boolean" ? value : refuse("true or false");
    }
    if (spec === "number") {
      const number = typeof value === "string" && value.trim() ? Number(value) : value;
      return typeof number === "number" && !Number.isNaN(number) ? number : refuse("a number");
    }
    if (typeof spec !== "function") {
      return value;
    }
    const parsed = spec(String(value));
    if (typeof parsed === "boolean" && typeof value !== "boolean") {
      return refuse("true or false");
    }
    if (typeof value !== "string") {
      return value;
    }
    return parsed == null || Number.isNaN(parsed) ? refuse() : parsed;
  }
  var textOrName = (el) => textOf(el) || (el.querySelector("[data-agent-hidden]") ? "" : accessibleName(el));
  function renderedItems(parts) {
    const items = parts.filter(
      (part) => part.key && (part.slot === "item" || part.slot === "tab" || part.slot === "root" && part.el.getAttribute("role") === "radio")
    );
    const nested = items.map((part) => part.el);
    return items.map((part) => {
      const el = parts.find((other) => other.slot === "trigger" && other.key === part.key)?.el ?? part.el;
      return { value: part.key, label: textOf(el, nested) || accessibleName(el) };
    });
  }
  var isShown = (el) => (el.checkVisibility?.() ?? !el.closest("[hidden]")) && !el.closest('[aria-hidden="true"]');
  var toastButtons = (parts) => parts.filter(
    (part) => (part.slot === "action" || part.slot === "close") && part.props.toast
  ).map((part) => part.el);
  function buttonsOf(parts) {
    const inside = parts.flatMap((part) => [
      ...part.el.querySelectorAll(
        "button, [role=button], [role^=menuitem]"
      )
    ]);
    return [.../* @__PURE__ */ new Set([...toastButtons(parts), ...inside])].filter(
      (el) => el.checkVisibility?.() !== false && !el.closest("[inert], [data-agent-hidden]")
    );
  }
  var rootOf = (parts) => parts.find((part) => part.slot === "root" && !part.key)?.el;
  function ownButton(parts) {
    const root = rootOf(parts);
    if (root?.matches('button, [role="button"], a[href]')) {
      return root;
    }
  }
  function triggersOf(parts) {
    const triggers = parts.filter(
      (part) => part.slot === "trigger" && isShown(part.el)
    );
    return triggers.length > 1 ? triggers.map((part) => part.el) : [];
  }
  function soleTrigger(parts) {
    const triggers = parts.filter((part) => part.slot === "trigger");
    return triggers.length === 1 ? triggers[0].el : void 0;
  }
  function rootState(parts) {
    const root = parts.find(
      (part) => /^(root|group|set)$/.test(part.slot) && !part.key
    );
    return root ? partState(root) : {};
  }
  function isComponentDisabled(state, parts) {
    if (state.disabled === true || state.formDisabled === true || state.readOnly === true) {
      return true;
    }
    const root = rootState(parts);
    if (root.disabled === true || root.readOnly === true) {
      return true;
    }
    const button2 = ownButton(parts);
    if (button2 && isDisabledElement(button2)) {
      return true;
    }
    const fields = parts.filter(
      (part) => part.el.matches("input, textarea, select")
    );
    return !!rootOf(parts)?.matches(":disabled") || fields.length > 0 && fields.every((part) => part.el.matches(":disabled"));
  }
  var differs = (was, now) => !Object.is(was, now) && JSON.stringify(was) !== JSON.stringify(now);
  var fieldKey = (keys) => keys.includes("checked") ? "checked" : keys.includes("value") ? "value" : void 0;
  var messageOf = (error) => error instanceof Error ? error.message : String(error);
  var limit = 100;
  var moreOf = (more) => {
    const entry = {
      ref: "more",
      component: "more",
      more,
      use: "query",
      actions: []
    };
    return entry;
  };
  var fold = (text) => foldText(text.replace(/[ßẞ]/g, "ss"));
  var wordsOf = (text) => ` ${fold(text)} `.replace(/[^\p{L}\p{N}]+/gu, " ");
  var described = (entry) => [entry.ref, entry.label, entry.row && `(${entry.row})`].filter(Boolean).join(" ");
  var redact = (entry, value) => entry.secret && value !== "" && value != null ? "[redacted]" : value;
  function sourceOf(parts) {
    for (const { el } of parts) {
      for (let node = el; node; node = node.parentElement) {
        const stamped = node.getAttribute("data-review-loc");
        if (stamped) {
          return stamped;
        }
        const loc = node.__svelte_meta?.loc;
        if (loc) {
          return `${loc.file}:${loc.line}`;
        }
      }
    }
  }
  function describe(entry, instance, parts) {
    const state = instance.get();
    const api = instance.api;
    const out = {
      ref: entry.ref,
      component: entry.component,
      actions: []
    };
    const label = componentLabel(parts);
    if (label) {
      out.label = label;
    }
    const row = rowOf(parts);
    if (row) {
      out.row = row;
    }
    const source = dev ? sourceOf(parts) : void 0;
    if (source) {
      out.source = source;
    }
    for (const key of stateKeys(entry, state)) {
      if (key in state) {
        out[key] = redact(entry, state[key] ?? null);
      }
    }
    if (!("value" in out) && "value" in state && typeof api.setValue !== "function") {
      out.value = redact(entry, state.value ?? null);
    }
    const root = rootState(parts);
    for (const key of shown) {
      const value = state[key] ?? root[key];
      const empty = value === "" || value == null || value === false;
      if (empty || typeof value === "object" && !Object.keys(value).length) {
        continue;
      }
      if (entry.secret && key === "query") {
        out[key] = "[redacted]";
      } else if (entry.secret && key === "errors" && Array.isArray(value)) {
        out[key] = value.map(() => "[redacted]");
      } else {
        out[key] = value;
      }
    }
    if (state.pending === true) {
      out.pending = true;
    }
    if (state.error != null) {
      out.error = entry.secret ? "[redacted]" : messageOf(state.error);
    }
    const opens = typeof api.setOpen === "function";
    if (typeof api.setValue === "function" || entry.agent?.items) {
      const rendered = opens ? [] : renderedItems(parts);
      const data = rendered.length ? void 0 : dataOf(entry, instance);
      const items = data ? data.length <= 10 ? data : [] : rendered;
      if (items.length) {
        out.items = items;
      }
    }
    const text = parts.filter((part) => /title|description|error/.test(part.slot)).map(
      (part) => entry.secret && /error/.test(part.slot) ? "[redacted]" : textOf(part.el)
    ).filter(Boolean);
    if (text.length) {
      out.text = text;
    }
    const confirm = confirmOf(
      parts.filter((part) => !part.key).map((part) => part.el)
    );
    if (confirm) {
      out.confirm = confirm;
    }
    const buttons = state.open === true || parts.some((part) => part.slot === "button") || toastButtons(parts).length ? buttonsOf(parts).map(textOrName) : [];
    if (buttons.length) {
      out.buttons = buttons;
    }
    const triggers = state.open === true ? [] : triggersOf(parts);
    if (triggers.length) {
      out.buttons = triggers.map(textOrName);
    }
    if (isComponentDisabled(state, parts)) {
      out.disabled = true;
    } else {
      out.actions = actionsOf(entry, api);
      const presses = opens && typeof api.setValue !== "function";
      if (buttons.length || presses || !out.actions.length && ownButton(parts)) {
        out.actions.push("press");
      }
    }
    return out;
  }
  function createAgent(options = {}) {
    install();
    const scan = () => {
      const found2 = [];
      for (const entry of [...entries.values()]) {
        const instance = entry.instance.deref();
        if (!instance) {
          retire(entry);
          continue;
        }
        const parts = bound(instance);
        if (parts.length) {
          remember(entry, parts);
        }
        if (parts.length && !entry.offLimits && (entry.agent?.shown?.(instance.get()) ?? true) && parts.some((part) => isShown(part.el))) {
          found2.push({ entry, instance, parts });
        }
      }
      return found2;
    };
    let scanned;
    const live2 = () => {
      if (!scanned) {
        scanned = scan();
        queueMicrotask(() => scanned = void 0);
      }
      return scanned;
    };
    const asAgent = (call) => {
      try {
        return withSource("agent", call);
      } finally {
        scanned = void 0;
      }
    };
    const find = (ref2, action, text) => {
      const shown2 = live2();
      const byRef = shown2.find(({ entry }) => entry.ref === ref2);
      if (byRef) {
        return byRef;
      }
      const needle = fold(ref2);
      const words = wordsOf(ref2);
      const tiers = [
        shown2.filter(
          ({ entry }) => entry.label && fold(entry.label) === needle || words.trim() && wordsOf(`${entry.label ?? ""} ${entry.row ?? ""}`).includes(words)
        ),
        // Then by an item it offers, like the accordion with an Email section.
        shown2.filter(
          ({ entry, instance, parts }) => describe(entry, instance, parts).items?.some(
            (item) => fold(item.label) === needle
          )
        ),
        // Then by its kind, when the page has one, like "slider", or "dialog" for an alert dialog.
        shown2.filter(({ entry }) => {
          const kind = fold(entry.component);
          return kind === needle || kind.endsWith(`-${needle}`);
        })
      ];
      for (const near of tiers) {
        if (near.length === 1) {
          return near[0];
        }
        const able = action ? near.filter(({ entry, instance }) => can(entry, instance, action)) : [];
        const meant = able.length ? able : near;
        if (meant.length === 1) {
          return meant[0];
        }
        const open = meant.filter(
          ({ instance }) => instance.get().open === true
        );
        if (open.length === 1) {
          return open[0];
        }
        const [own, ...others] = meant.filter(({ parts }) => ownButton(parts));
        if (action === "press" && own && !others.length) {
          const el = ownButton(own.parts);
          const popups = meant.filter((found2) => found2 !== own);
          if (popups.every(({ parts }) => soleTrigger(parts) === el)) {
            if (text === void 0 || fold(textOrName(el)) === fold(text)) {
              return own;
            }
            if (popups.length === 1) {
              return popups[0];
            }
          }
        }
        if (near.length > 1) {
          throw new Error(
            `"${ref2}" names ${near.length} components: ${near.map(({ entry }) => described(entry)).join(", ")}. Use a ref.`
          );
        }
      }
      const offLimits = [...entries.values()].some(
        (entry) => entry.offLimits && (fold(entry.label ?? "") === needle || words.trim() && wordsOf(`${entry.label ?? ""} ${entry.row ?? ""}`).includes(words))
      );
      if (offLimits) {
        throw new Error(
          `"${ref2}" isn't available to agents here. Ask the person.`
        );
      }
      const labels2 = shown2.map(({ entry }) => entry.label).filter(Boolean);
      const closed = shown2.flatMap(({ entry, instance, parts }) => {
        const { items } = describe(entry, instance, parts);
        const value = instance.get().value;
        const open = Array.isArray(value) ? value : [value];
        const shut = items?.filter((item) => !open.includes(item.value)).map((item) => item.label) ?? [];
        return shut.length && entry.agent?.reveals ? [
          `${entry.label ?? entry.component} (${entry.ref}): ${shut.join(", ")}`
        ] : [];
      });
      throw new Error(
        `No component "${ref2}" on the page. Its labels: ${[...new Set(labels2)].slice(0, 30).join(", ") || "none"}.${closed.length ? ` It may be behind one of these, which a step can open first: ${closed.join("; ")}.` : ""}`
      );
    };
    const capture = () => {
      const found2 = live2();
      const shown2 = new Set(found2.map(({ entry }) => entry.ref));
      const names = new Map(
        found2.map(({ entry }) => [
          entry.ref,
          { component: entry.component, label: entry.label, row: entry.row }
        ])
      );
      const states = /* @__PURE__ */ new Map();
      for (const entry of entries.values()) {
        const instance = entry.instance.deref();
        if (instance) {
          states.set(entry.ref, instance.get());
        }
      }
      return { shown: shown2, states, names };
    };
    const named = (before, refs) => refs.length > 10 ? refs : refs.map((ref2) => {
      const name = before.names.get(ref2);
      const label = [name?.label, name?.row].filter(Boolean).join(", ");
      return label ? `${ref2} ${label}` : ref2;
    });
    const values = (before, touched2) => {
      const fields = [];
      for (const { entry, instance } of live2()) {
        const state = instance.get();
        const key = fieldKey(
          stateKeys(entry, state).filter((key2) => key2 in state)
        );
        if (!key || state.open) {
          continue;
        }
        const was = before.states.get(entry.ref);
        fields.push({
          name: `${entry.ref} ${entry.label ?? entry.component}`,
          value: redact(entry, state[key] ?? null),
          first: touched2.has(entry.ref) || !was || differs(was[key], state[key])
        });
      }
      for (const component of offPage.values()) {
        const key = fieldKey(Object.keys(component));
        if (key) {
          fields.push({
            name: `${component.ref} ${component.label ?? component.component}`,
            value: component[key],
            first: touched2.has(component.ref)
          });
        }
      }
      const kept = new Set(fields.filter((field2) => field2.first));
      for (const field2 of fields) {
        if (kept.size < limit) {
          kept.add(field2);
        }
      }
      const out = {};
      for (const field2 of fields) {
        if (kept.has(field2)) {
          out[field2.name] = field2.value;
        }
      }
      if (fields.length > kept.size) {
        out.more = fields.length - kept.size;
      }
      return out;
    };
    function since(before, skip, listAppeared = true) {
      const changes = [];
      const after = live2();
      for (const { entry, instance } of after) {
        const was = before.states.get(entry.ref);
        if (!was) {
          continue;
        }
        const state = instance.get();
        for (const key of stateKeys(entry, state)) {
          if (differs(was[key], state[key])) {
            changes.push({
              component: entry.component,
              label: entry.label,
              key,
              value: redact(entry, state[key])
            });
          }
        }
        if (before.shown.has(entry.ref) && entry.row !== before.names.get(entry.ref)?.row) {
          changes.push({
            component: entry.component,
            label: entry.label,
            key: "row",
            value: entry.row
          });
        }
      }
      const shownAfter = new Set(after.map(({ entry }) => entry.ref));
      for (const ref2 of before.shown) {
        if (shownAfter.has(ref2)) {
          continue;
        }
        const was = before.states.get(ref2);
        const name = before.names.get(ref2);
        if (was?.open === true && name) {
          changes.push({
            component: name.component,
            label: name.label,
            key: "open",
            value: false
          });
        }
        const last = offPage.get(ref2);
        if (!last || !was) {
          continue;
        }
        for (const key of Object.keys(was)) {
          if (key in last && differs(was[key], last[key])) {
            changes.push({
              component: last.component,
              label: last.label,
              key,
              value: last[key]
            });
          }
        }
      }
      return {
        after,
        changes,
        appeared: listAppeared ? after.filter(
          (found2) => found2.entry.ref !== skip && !before.shown.has(found2.entry.ref)
        ).map((found2) => describe(found2.entry, found2.instance, found2.parts)) : [],
        gone: named(
          before,
          [...before.shown].filter((ref2) => !shownAfter.has(ref2))
        )
      };
    }
    async function pressing(entry, instance, text, beforeOpen) {
      const api = instance.api;
      const match = () => {
        const parts = bound(instance);
        const open = instance.get().open === true;
        const buttons2 = [...buttonsOf(parts), ...open ? [] : triggersOf(parts)];
        if (text === void 0) {
          return {
            buttons: buttons2,
            button: ownButton(parts) ?? (api.setOpen ? soleTrigger(parts) : void 0)
          };
        }
        const own = ownButton(parts);
        const all = own && !buttons2.includes(own) ? [own, ...buttons2] : buttons2;
        const needle = fold(text);
        const words = wordsOf(text);
        const exact = all.filter((el) => fold(textOrName(el)) === needle);
        const near = all.filter(
          (el) => words.trim() && wordsOf(textOrName(el)).includes(words)
        );
        const matches = exact.length ? exact : near;
        if (matches.length > 1) {
          throw new Error(
            `"${text}" names ${matches.length} buttons in ${entry.ref}. Use the whole text of one.`
          );
        }
        return { buttons: all, button: matches[0] };
      };
      let found2 = match();
      let opened = false;
      const closed = new Set(bound(instance).map((part) => part.el));
      const close = async () => {
        asAgent(() => api.setOpen?.(false));
        for (let tries = 0; tries < 60 && bound(instance).some((part) => !closed.has(part.el)); tries++) {
          await frames();
        }
      };
      if (!found2.button && text !== void 0 && api.setOpen && !instance.get().open) {
        await beforeOpen();
        opened = true;
        asAgent(() => api.setOpen(true));
        try {
          for (let tries = 0; tries < 60 && !(found2 = match()).button; tries++) {
            await frames();
          }
        } finally {
          if (!found2.button) {
            asAgent(() => api.setOpen(false));
          }
        }
      }
      const { buttons, button: button2 } = found2;
      if (!button2) {
        throw new Error(
          `No button "${text}" in ${entry.ref}. Buttons: ${buttons.map(textOrName).join(", ") || "none"}.`
        );
      }
      const refuseDisabled = async () => {
        if (!button2.matches(":disabled") && button2.getAttribute("aria-disabled") !== "true") {
          return;
        }
        if (opened) {
          await close();
        }
        throw new Error(
          `"${textOrName(button2)}" in ${entry.ref} is disabled now.`
        );
      };
      await refuseDisabled();
      const pressed = `Pressed "${textOrName(button2)}"`;
      return {
        click: () => button2.click(),
        button: button2,
        pressed,
        opened,
        close,
        refuseDisabled
      };
    }
    function pressable(instance) {
      const texts = buttonsOf(bound(instance)).map(textOrName).filter(Boolean);
      if (texts.length) {
        return ` press takes a button's text: ${texts.join(", ")}.`;
      }
      const opens = typeof instance.api.setOpen === "function";
      return opens ? " press takes the text of a button inside it, and opens it first to find the button." : "";
    }
    const shows = (ref2, action, text) => {
      try {
        find(ref2, action, text);
        return true;
      } catch {
        return false;
      }
    };
    async function reveal(ref2, action, text) {
      try {
        return find(ref2, action, text);
      } catch (missing) {
        const holders = [];
        for (const { instance, entry, parts } of live2()) {
          const api = instance.api;
          const value = instance.get().value;
          if (typeof api.open !== "function" || typeof api.setValue !== "function" || !Array.isArray(value)) {
            continue;
          }
          const shut = describe(entry, instance, parts).items?.filter(
            (item) => !value.includes(item.value)
          ) ?? [];
          for (const item of shut) {
            const step = {
              ref: entry.ref,
              component: entry.component,
              label: entry.label,
              action: "open",
              args: [item.value]
            };
            if (!await allowed(step)) {
              continue;
            }
            const open = () => asAgent(() => api.open(item.value));
            open();
            await frames();
            if (shows(ref2, action, text)) {
              holders.push({ entry, open, section: item.label });
            }
            asAgent(() => api.setValue(value));
            await frames();
          }
        }
        if (holders.length === 1) {
          holders[0].open();
          await frames();
          return find(ref2, action, text);
        }
        if (holders.length > 1) {
          const [{ entry, section }] = holders;
          throw new Error(
            `"${ref2}" is in ${holders.length} closed sections: ${holders.map((holder) => holder.section).join(", ")}. Open one first, like { "ref": "${entry.ref}", "action": "open", "args": ["${section}"] }.`
          );
        }
        throw missing;
      }
    }
    async function settle2(instance) {
      const pending2 = () => instance?.get()?.pending === true;
      for (let waited = 0; pending2() && waited < 15e3; waited += 50) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      const { error } = instance?.get() ?? {};
      return { pending: pending2(), error };
    }
    let callerAllow;
    let callerSignal;
    let refusedBy;
    async function allowed(step) {
      const checks = [options.allow, callerAllow].filter((check) => !!check);
      if (!checks.length) {
        return true;
      }
      const controller = new AbortController();
      const wait = options.timeout ?? 3e5;
      let timer;
      const late = new Promise(
        (resolve) => timer = setTimeout(() => resolve("late"), wait)
      );
      const cancelled = new Promise((resolve) => {
        if (callerSignal?.aborted) {
          resolve("cancelled");
        }
        callerSignal?.addEventListener("abort", () => resolve("cancelled"), {
          once: true
        });
      });
      const answer = async () => {
        for (const check of checks) {
          if (controller.signal.aborted) {
            return false;
          }
          if (!await check(step, { signal: controller.signal })) {
            refusedBy = check;
            return false;
          }
        }
        return true;
      };
      try {
        const ok = await Promise.race([answer(), late, cancelled]);
        if (typeof ok === "boolean") {
          return ok;
        }
        controller.abort();
        throw new Error(
          ok === "cancelled" ? `${step.action} on ${step.ref} was cancelled.` : `No answer to ${step.action} on ${step.ref} in ${Math.round(wait / 1e3)} seconds.`
        );
      } finally {
        clearTimeout(timer);
      }
    }
    async function perform(ref2, action, args, guard) {
      if (typeof ref2 !== "string" || !ref2.trim()) {
        throw new Error(
          "A step needs a ref: a component's ref from snapshot, or its label."
        );
      }
      if (typeof action !== "string" || !action) {
        throw new Error(`A step on "${ref2}" needs an action, like "press".`);
      }
      const { entry, instance, parts } = await reveal(
        ref2,
        action,
        action === "press" && typeof args[0] === "string" ? args[0] : void 0
      );
      const { actions, disabled } = describe(entry, instance, parts);
      const asked = /* @__PURE__ */ new Set();
      const ask = async (stepArgs, targets2, what) => {
        const confirm = confirmOf(targets2);
        const key = JSON.stringify([stepArgs, confirm]);
        if (asked.has(key)) {
          return false;
        }
        const step = {
          ref: entry.ref,
          component: entry.component,
          label: entry.label,
          action,
          args: stepArgs
        };
        if (confirm) {
          step.confirm = confirm;
        }
        if (confirm && !options.allow && !callerAllow) {
          throw new Error(
            `Needs a person: "${confirm}". Ask them to ${what} themselves.`
          );
        }
        if (!await allowed(step)) {
          throw new Error(
            confirm && refusedBy === options.allow ? `The person said no to "${confirm}".` : `The app refused ${action} on ${entry.ref}.`
          );
        }
        asked.add(key);
        return true;
      };
      let openParts = [];
      const targetsOf = (item) => {
        const keys = new Set(
          (Array.isArray(item) ? item : [item]).map(
            (value) => value !== null && typeof value === "object" ? keyFor(instance)(value) : String(value)
          )
        );
        const every = /All$/.test(action);
        const elements2 = [...parts, ...bound(instance), ...openParts].filter((part) => part.el && (!part.key || every || keys.has(part.key))).map((part) => part.el);
        for (const key of keys) {
          const el = internalOf(instance)?.elementOf?.(key);
          if (el) {
            elements2.push(el);
          }
        }
        return [...new Set(elements2)];
      };
      let refuseBlocked;
      let run;
      let press2;
      if (action === "press") {
        if (!actions.includes("press")) {
          throw new Error(
            `${entry.component} ${entry.ref} has nothing to press now.`
          );
        }
        const text = args[0];
        press2 = await pressing(
          entry,
          instance,
          text,
          () => ask(args, targetsOf(), `press "${text}"`)
        );
        run = press2.click;
      } else {
        const fn = instance.api[action];
        if (typeof fn !== "function" || disabled || !takes(entry, action)) {
          throw new Error(
            `${entry.component} ${entry.ref} takes no ${action} now. It takes: ${actions.join(", ") || "nothing"}.${actions.includes("press") ? pressable(instance) : ""}`
          );
        }
        const closed2 = entry.agent?.closed && !internalOf(instance)?.allowCustomValue?.();
        const opens = "setOpen" in instance.api;
        const state = instance.get();
        const key = keyFor(instance);
        const holds2 = (value) => [state.value].flat().some((held3) => held3 != null && key(held3) === key(value));
        const numeric = typeof state.min === "number" || typeof state.max === "number" || typeof state.value === "number";
        if (action === "setValue" && numeric && typeof args[0] === "string") {
          const number = Number.parseFloat(args[0]);
          const rest = args[0].trim().replace(/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?/i, "");
          if (Number.isNaN(number) || /^[\s,.']*\d/.test(rest)) {
            throw new Error(`${entry.component} ${entry.ref} takes a number.`);
          }
          args = [
            Array.isArray(state.value) ? [number] : number,
            ...args.slice(1)
          ];
        }
        if (action === "setValue" && Array.isArray(state.value) && typeof args[0] === "string" && typeof entry.options?.value !== "function") {
          args = [[args[0]], ...args.slice(1)];
        }
        let whileOpen;
        const seeOpen = (found2, open) => {
          whileOpen = found2;
          openParts = open.map(({ key: key2, el }) => ({ key: key2, el }));
        };
        const askToOpen = () => ask(args, targetsOf(args[0]), "make this change");
        let named2 = false;
        const label = typeof args[0] === "string" && fold(args[0]);
        if (label) {
          const data = dataOf(entry, instance);
          const items = action === "setValue" ? await listItems(entry, instance, askToOpen, seeOpen) : data?.length ? data : renderedItems(bound(instance));
          if (!items.some((item) => item.value === args[0])) {
            const name = `${entry.label ?? entry.component} (${entry.ref})`;
            const found2 = items.filter((item) => fold(item.label) === label);
            if (found2.length > 1) {
              throw new Error(
                `"${args[0]}" names ${found2.length} items in ${name}: ${found2.map((item) => item.value).join(", ")}. Use a value.`
              );
            }
            if (found2.length === 1) {
              args = [found2[0].value, ...args.slice(1)];
              named2 = true;
            } else if ((items.length || data || opens) && closed2 && action !== "setQuery" && !holds2(args[0])) {
              throw new Error(
                `No item "${args[0]}" in ${name}. Its items: ${items.slice(0, 20).map((item) => item.label).join(", ") || "none"}${items.length > 20 ? ", \u2026" : ""}.`
              );
            }
          }
        }
        if (action === "setValue" && Array.isArray(args[0]) && args[0].some((value) => typeof value === "string")) {
          const items = await listItems(entry, instance, askToOpen, seeOpen);
          const name = `${entry.label ?? entry.component} (${entry.ref})`;
          const values2 = args[0].map((value) => {
            if (typeof value !== "string" || items.some((item) => item.value === value)) {
              return value;
            }
            const found2 = items.filter((item) => fold(item.label) === fold(value));
            if (found2.length > 1) {
              throw new Error(
                `"${value}" names ${found2.length} items in ${name}: ${found2.map((item) => item.value).join(", ")}. Use a value.`
              );
            }
            return found2.length ? found2[0].value : value;
          });
          args = [values2, ...args.slice(1)];
        }
        const elementOf = internalOf(instance)?.elementOf;
        if (action === "setValue" && closed2 && args[0] != null && typeof args[0] !== "string") {
          const known = /* @__PURE__ */ new Set();
          const data = dataOf(entry, instance, void 0, known);
          const items = await listItems(entry, instance, askToOpen, seeOpen);
          for (const item of items) {
            known.add(item.value);
          }
          const unknown = (Array.isArray(args[0]) ? args[0] : [args[0]]).find(
            (value) => !known.has(key(value)) && !holds2(value) && !elementOf?.(key(value))
          );
          if ((items.length || elementOf || data || opens) && unknown !== void 0) {
            throw new Error(
              `No item ${JSON.stringify(unknown)} in ${entry.label ?? entry.component} (${entry.ref}).`
            );
          }
        }
        if (/^set[A-Z]/.test(action)) {
          args = [valueFor(entry, action, args[0]), ...args.slice(1)];
        }
        if (entry.component !== "autocomplete" && args[0] !== void 0 && ["setValue", "setChecked", "select", "open", "toggle"].includes(action)) {
          const value = instance.get()[action === "setChecked" ? "checked" : "value"];
          const held3 = (Array.isArray(value) ? value : [value]).map(key);
          const chosen = named2 ? [args[0]] : (Array.isArray(args[0]) ? args[0] : [args[0]]).map(key);
          if (!whileOpen && (action === "setValue" || action === "select")) {
            await listItems(
              entry,
              instance,
              askToOpen,
              seeOpen,
              chosen.filter((item) => !held3.includes(item))
            );
          }
          refuseBlocked = () => {
            const disabled2 = /* @__PURE__ */ new Set([
              ...whileOpen ?? [],
              ...disabledItems(entry, instance)
            ]);
            const blocked = chosen.find((item) => {
              const el = elementOf?.(item);
              return !held3.includes(item) && (disabled2.has(item) || !!el && isDisabledElement(el));
            });
            if (blocked === void 0) {
              return;
            }
            const items = dataOf(entry, instance) ?? renderedItems(bound(instance));
            const label2 = items.find((item) => item.value === blocked)?.label || blocked;
            throw new Error(
              `"${label2}" in ${entry.label ?? entry.component} (${entry.ref}) is disabled now.`
            );
          };
          refuseBlocked();
        }
        run = () => fn(...args);
      }
      const targets = () => press2 ? [press2.button, ...targetsOf()] : targetsOf(args[0]);
      const askToRun = () => press2 ? ask(args, [press2.button], `press "${textOrName(press2.button)}"`) : ask(args, targets(), "make this change");
      try {
        let asking = await askToRun();
        for (let asked2 = 1; asking; asked2++) {
          if (asked2 === 3) {
            throw new Error(
              `${entry.ref} kept changing while it was being approved.`
            );
          }
          asking = await askToRun();
        }
        if (isOffLimits(targets())) {
          throw new Error(`${entry.ref} isn't available to agents now.`);
        }
        if (!press2 && isComponentDisabled(
          instance.get(),
          bound(instance)
        )) {
          throw new Error(`${entry.component} ${entry.ref} is disabled now.`);
        }
        refuseBlocked?.();
      } catch (refused) {
        if (press2?.opened) {
          await press2.close();
        }
        throw refused;
      }
      await press2?.refuseDisabled();
      if (guard && !guard()) {
        throw new Error(
          `The restoration of ${entry.ref} was superseded by a newer change.`
        );
      }
      const secret2 = entry.secret || !!press2 && isSecret([press2.button]);
      const failure = (error) => secret2 ? "[redacted]" : messageOf(error);
      let result;
      try {
        result = asAgent(run);
      } catch (error) {
        if (!secret2) {
          throw error;
        }
        throw new Error(
          `${action} on ${entry.label ?? entry.component} (${entry.ref}) failed: [redacted]`
        );
      }
      let rejected;
      let ended = false;
      if (result && typeof result.then === "function") {
        ;
        result.then(void 0, (error) => {
          if (ended) {
            throw error;
          }
          rejected = { error };
        });
        result = "pending";
      } else if (secret2 && typeof result !== "boolean") {
        result = redact(entry, result);
      }
      await frames();
      if (!press2) {
        const settled2 = await settle2(instance);
        ended = true;
        const failed = rejected ?? (settled2.error != null ? { error: settled2.error } : void 0);
        if (failed) {
          throw new Error(
            `${action} on ${entry.label ?? entry.component} (${entry.ref}) failed: ${failure(failed.error)}`
          );
        }
        if (settled2.pending) {
          return { ref: entry.ref, result: `${action} is still running.` };
        }
        return { ref: entry.ref, result: result ?? null };
      }
      const pressed = press2.opened ? `${press2.pressed}, after opening ${entry.ref}` : press2.pressed;
      const settled = await settle2(
        [...entries.values()].map((entry2) => entry2.instance.deref()).find(
          (found2) => found2 && bound(found2).some(
            (part) => part.slot === "root" && part.el === press2.button
          )
        )
      );
      ended = true;
      if (settled.error != null) {
        throw new Error(
          `${pressed}, and its action failed: ${failure(settled.error)}`
        );
      }
      if (settled.pending) {
        return {
          ref: entry.ref,
          result: `${pressed}. Its action is still running.`
        };
      }
      await frames();
      const closed = instance.get().open === false;
      return {
        ref: entry.ref,
        result: result ?? `${pressed}${closed ? `. ${entry.ref} is closed now.` : "."}`
      };
    }
    async function listItems(entry, instance, beforeOpen, whileOpen, chosen = []) {
      const state = instance.get();
      const api = instance.api;
      const known = /* @__PURE__ */ new Set();
      const data = dataOf(entry, instance, void 0, known);
      let items = data ?? renderedItems(bound(instance));
      const elementOf = internalOf(instance)?.elementOf;
      const unseen = () => chosen.some(
        (item) => known.has(item) && !elementOf?.(item) && !bound(instance).some((part) => part.key === item)
      );
      if ((!data && !items.length || unseen()) && !entry.agent?.items && beforeOpen && api.setOpen && !state.open) {
        await beforeOpen();
        asAgent(() => api.setOpen(true));
        let shown2 = renderedItems(bound(instance));
        for (let tries = 0; tries < (data ? 4 : 60) && !shown2.length; tries++) {
          await frames();
          shown2 = renderedItems(bound(instance));
        }
        if (shown2.length) {
          whileOpen?.(disabledItems(entry, instance), bound(instance));
        }
        items = data ?? shown2;
        asAgent(() => api.setOpen(false));
        await frames();
      }
      return items;
    }
    async function act(steps, guard) {
      const before = capture();
      const log2 = [];
      const touched2 = /* @__PURE__ */ new Set();
      let error;
      for (const [index, step] of steps.entries()) {
        try {
          const prior = capture();
          const { ref: ref2, result } = await perform(
            step.ref,
            step.action,
            step.args ?? [],
            guard
          );
          touched2.add(ref2);
          const { changes, gone } = since(prior, ref2, false);
          log2.push({
            step: index,
            ref: ref2,
            ...result !== null && result !== true && { result },
            ...changes.length && { changes },
            ...gone.length && { gone }
          });
        } catch (thrown) {
          error = { step: index, message: messageOf(thrown) };
          break;
        }
      }
      const { after, appeared } = since(before);
      const open = after.filter(
        ({ entry, instance }) => touched2.has(entry.ref) && instance.get().open === true
      ).map((found2) => describe(found2.entry, found2.instance, found2.parts));
      return {
        ok: !error,
        ...error && { error },
        steps: log2,
        ...open.length ? { open } : {},
        appeared,
        values: values(before, touched2)
      };
    }
    const capped = (found2) => found2.length > limit ? [...found2.slice(0, limit), moreOf(found2.length - limit)] : found2;
    const matching = (items, text) => {
      const needle = text && fold(text);
      return needle ? items.filter(
        (item) => fold(item.label).includes(needle) || fold(item.value).includes(needle)
      ) : items;
    };
    const withItems = (component, items) => ({
      ...component,
      items: items.slice(0, 50),
      ...items.length > 50 && { more: items.length - 50 }
    });
    async function query({
      text,
      within,
      kind
    }) {
      if (!text && !within && !kind) {
        return {
          error: "query takes text, within or kind. snapshot lists everything."
        };
      }
      if (within) {
        try {
          const { entry, instance, parts } = find(within);
          const items = await listItems(entry, instance);
          const component = withItems(
            describe(entry, instance, parts),
            matching(items, text)
          );
          const api = instance.api;
          const closed = !items.length && !instance.get().open;
          if (closed && typeof api.setOpen === "function" && typeof api.setValue === "function") {
            component.note = `Its items show while it's open. act's setValue takes an item's label and opens ${entry.ref} to find it.`;
          }
          return [component];
        } catch (missing) {
          return { error: messageOf(missing) };
        }
      }
      const words = text ? wordsOf(text) : void 0;
      const ofKind = (component) => !kind || component.component === kind || component.component.endsWith(`-${kind}`);
      const named2 = (component) => !words || !!words.trim() && wordsOf(`${component.label ?? ""} ${component.row ?? ""}`).includes(
        words
      );
      const found2 = [];
      for (const { entry, instance, parts } of live2()) {
        const component = describe(entry, instance, parts);
        if (!ofKind(component)) {
          continue;
        }
        if (named2(component)) {
          found2.push(component);
        } else if (text) {
          const items = matching(
            dataOf(entry, instance) ?? renderedItems(parts),
            text
          );
          if (items.length) {
            found2.push(withItems(component, items));
          }
        }
      }
      for (const component of offPage.values()) {
        if (ofKind(component) && named2(component)) {
          found2.push(component);
        }
      }
      return capped(found2);
    }
    let queue = Promise.resolve();
    const inTurn = (run) => {
      const next = queue.then(run);
      queue = next.catch(() => {
      });
      return next;
    };
    const agent = {
      /**
       * Every component on the page, as an agent sees it, then the ones that
       * left it with `offPage: true` and the state they had, like a closed
       * tab's fields. A long page stops after 100, open popups kept since
       * they're in front of the person, and ends with `{ ref: "more",
       * component: "more", more, use: "query" }`, how many were left out.
       */
      snapshot: () => {
        const shown2 = scan().map(
          ({ entry, instance, parts }) => describe(entry, instance, parts)
        );
        const all = [...shown2, ...offPage.values()];
        if (all.length <= limit) {
          return all;
        }
        const open = new Set(shown2.filter((component) => component.open === true));
        const rest = all.filter((component) => !open.has(component)).slice(0, limit - open.size);
        const kept = /* @__PURE__ */ new Set([...open, ...rest]);
        return [
          ...all.filter((component) => kept.has(component)),
          moreOf(all.length - kept.size)
        ];
      },
      /**
       * Runs steps in order, as the agent, and reports what they changed
       * together. A step names its component by ref, or by its label or row
       * text, whole words regardless of case and accents, so it can reach one
       * an earlier step brought onto the page. Stops at the first step that
       * fails, and says which.
       */
      act: (input2) => inTurn(() => act(input2.steps ?? [])),
      /**
       * Finds components without listing the page. `text` matches a
       * component's label or row text by whole words, and a list's items, which
       * come back under it; `within` names one list and returns its items,
       * matching `text`, 50 at most, read from its data or the page, with a
       * `note` when they show only while it's open, since a query never opens
       * anything; `kind` keeps one kind, like `"select"`.
       */
      query: (input2) => inTurn(() => query(input2 ?? {})),
      /**
       * Calls `listener` with every change to a component, from a person or an
       * agent, with its ref, label, reason, source and value before, until the
       * returned function runs. The same as `observe`: a change an interaction
       * commits, like a slider's drag, comes once, when it commits.
       */
      subscribe: (listener) => listen((change) => {
        if (!entries.get(change.ref)?.offLimits) {
          listener(change);
        }
      })
    };
    guardedActions.set(
      agent.act,
      (steps, guard) => inTurn(() => act(steps, guard))
    );
    allowing.set(
      agent,
      (input2, allow, signal) => inTurn(async () => {
        callerAllow = allow;
        callerSignal = signal;
        try {
          return await act(input2.steps ?? []);
        } finally {
          callerAllow = void 0;
          callerSignal = void 0;
        }
      })
    );
    return agent;
  }
  var allowing = /* @__PURE__ */ new WeakMap();

  // node_modules/@ui-sdk/core/dist/foundation/kernel/action.js
  init_dev_stub();
  var DEFAULT_PENDING_ANNOUNCEMENT = "Loading";
  var PENDING_ANNOUNCE_DELAY = 1e3;
  var popupResults = /* @__PURE__ */ new WeakSet();
  var isPromise = (value) => !!value && typeof value.then === "function" && !popupResults.has(value);
  var canceledAction = /* @__PURE__ */ Symbol("canceled action");
  function runAction(action, source, handlers2) {
    const failed = (error) => {
      note(
        "an action failed. The error is in its part's `error` state.",
        void 0,
        error
      );
      handlers2.failed(error);
    };
    const done = () => withSource(source, handlers2.done);
    let result;
    try {
      result = action({ source });
    } catch (error) {
      return failed(error);
    }
    if (result === canceledAction) {
      return;
    }
    if (!isPromise(result)) {
      return done();
    }
    handlers2.pending(true);
    result.then(
      () => {
        handlers2.pending(false);
        done();
      },
      (error) => {
        handlers2.pending(false);
        failed(error);
      }
    );
  }
  function announcePending(context2, isPending) {
    const say = () => {
      const text = context2.options().pendingAnnouncement ?? DEFAULT_PENDING_ANNOUNCEMENT;
      Promise.resolve().then(() => (init_announce(), announce_exports)).then(
        ({ announce: announce2 }) => wasPending && announce2(text),
        () => {
        }
      );
    };
    let timer;
    let wasPending = false;
    const unsubscribe = context2.store.subscribe(() => {
      const pending2 = isPending();
      if (pending2 === wasPending) {
        return;
      }
      wasPending = pending2;
      clearTimeout(timer);
      if (pending2) {
        timer = setTimeout(say, PENDING_ANNOUNCE_DELAY);
      }
    });
    context2.onDestroy(() => {
      wasPending = false;
      clearTimeout(timer);
      unsubscribe();
    });
  }

  // node_modules/@ui-sdk/core/dist/foundation/platform/button.js
  function buttonElement(el) {
    if (el.tagName === "BUTTON") {
      return "button";
    }
    if (el.matches("a[href]")) {
      return "link";
    }
    return "other";
  }
  function buttonRole(elementOf) {
    return {
      role: (state, context2) => elementOf(state, context2) === "other" ? "button" : void 0,
      roles: ["button"]
    };
  }
  function buttonElementAttrs(element2, options) {
    const native = element2 === "button";
    const unknown = element2 === "unknown";
    const mayBeNative = native || unknown;
    const unfocusable = options.disabled && !options.focusable;
    const leavesTabOrder = unfocusable && !mayBeNative;
    const defaultTabindex = leavesTabOrder ? "-1" : element2 === "other" ? "0" : void 0;
    return {
      type: mayBeNative ? options.type : void 0,
      disabled: mayBeNative && unfocusable ? "" : void 0,
      "aria-disabled": options.disabled && (unknown || !(native && unfocusable)) ? "true" : void 0,
      tabindex: options.tabindex ?? defaultTabindex
    };
  }
  function keyClick(event, el) {
    if (trusted(event)) {
      withSource("keyboard", () => el.click());
    } else {
      el.click();
    }
  }
  function buttonKeydown(event, el) {
    if (event.target !== el || buttonElement(el) !== "other") {
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (!event.repeat) {
        keyClick(event, el);
      }
    } else if (event.key === " ") {
      event.preventDefault();
    }
  }
  function buttonKeyup(event, el) {
    if (event.target === el && event.key === " " && buttonElement(el) === "other") {
      keyClick(event, el);
    }
  }

  // node_modules/@ui-sdk/core/dist/foundation/kernel/primitive.js
  init_dev_stub();

  // node_modules/@ui-sdk/core/dist/foundation/kernel/controller.js
  var attach = /* @__PURE__ */ Symbol.for("ui-sdk.controller.attach");
  var detach = /* @__PURE__ */ Symbol.for("ui-sdk.controller.detach");
  function attachController(controller, api) {
    ;
    controller?.[attach]?.(api);
  }
  function detachController(controller, api) {
    ;
    controller?.[detach]?.(api);
  }
  function connectController(context2, api) {
    let current = context2.options().controller;
    let kept = false;
    whenKept(() => {
      kept = true;
      attachController(current, api);
      return () => {
        kept = false;
        detachController(current, api);
      };
    });
    context2.onOptions(({ controller }) => {
      if (controller === current) {
        return;
      }
      detachController(current, api);
      current = controller;
      if (kept) {
        attachController(controller, api);
      }
    });
  }

  // node_modules/@ui-sdk/core/dist/foundation/kernel/derive.js
  var derivations = /* @__PURE__ */ new WeakMap();
  function register(store, derivation) {
    let list = derivations.get(store);
    if (!list) {
      derivations.set(store, list = []);
    }
    list.push(derivation);
  }
  function deriveFromOptions(context2, keys, derive) {
    register(context2.store, {
      from: "options",
      keys,
      derive
    });
  }
  function withDerived(store, options, synced, state) {
    const list = derivations.get(store);
    if (!list) {
      return synced;
    }
    let result = synced ?? {};
    for (const derivation of list) {
      if (!synced && derivation.from === "state") {
        continue;
      }
      const next = { ...state, ...result };
      const derived = derivation.from === "state" ? store.view(next, () => derivation.derive(next)) : derivation.derive(result, state, options);
      result = { ...result };
      for (const key of derivation.keys) {
        if (derived && key in derived) {
          result[key] = derived[key];
        } else if (derivation.from === "state") {
          result[key] = next[key];
        }
      }
    }
    return synced || Object.keys(result).length ? result : void 0;
  }

  // node_modules/@ui-sdk/core/dist/foundation/kernel/primitive.js
  init_part();
  init_store();
  function definePrimitive(definition) {
    const slots = definition.slots((slot) => slot);
    const name = definition.name;
    const label = definition.label ?? name;
    if (dev) {
      checkRoles(slots, { component: label });
    }
    const make = (initialOptions) => {
      let options = initialOptions;
      const id = initialOptions.id;
      const store = createStore(
        { ...definition.state(options), ...definition.sync?.(options) },
        definition.live ?? []
      );
      const destroys = [];
      const optionsListeners = [];
      const from = { component: label, id };
      const controlled = dev ? (definition.controlled ?? ["open", "value", "checked"]).filter(
        (key) => key in store.get()
      ) : [];
      if (dev) {
        checkControlled(from, controlled, options);
      }
      const own = Object.create(
        dev ? warnMissing(slots, from) : slots
      );
      const used = /* @__PURE__ */ new Set();
      function use(feature) {
        if (used.has(feature)) {
          return;
        }
        used.add(feature);
        Object.assign(own, feature.slots);
        wake();
        feature.extend?.(api);
      }
      const owner4 = {
        name,
        label,
        slots: own,
        parts: /* @__PURE__ */ new Map(),
        released: []
      };
      const { parts } = owner4;
      function keyOf2(props = {}) {
        return props.id ?? (props.value == null ? "" : String(props.value));
      }
      let viewedParts;
      function part(slot, props = {}, rendering = false) {
        const key = keyOf2(props);
        const mapKey = `${slot}:${key}`;
        let found2 = parts.get(mapKey);
        if (!found2) {
          parts.set(
            mapKey,
            found2 = {
              slot,
              key,
              id,
              // Read when used, since an asleep instance builds its api later.
              get api() {
                return api;
              },
              store,
              props,
              el: void 0,
              owner: owner4,
              leases: 0
            }
          );
          if (rendering) {
            provisional(found2);
          }
        } else if (rendering) {
          return found2;
        }
        found2.props = props;
        propsRendered(found2);
        return found2;
      }
      function element2(slot, key) {
        if (key === void 0) {
          for (const part2 of parts.values()) {
            if (part2.slot === slot && part2.el?.isConnected) {
              return part2.el;
            }
          }
          return;
        }
        const el = parts.get(`${slot}:${key}`)?.el;
        return el?.isConnected ? el : void 0;
      }
      const context2 = {
        id,
        label,
        store,
        options: () => options,
        onOptions: (listener) => optionsListeners.push(listener),
        onDestroy: (cleanup) => destroys.push(cleanup),
        parts: () => parts.values(),
        element: element2,
        props: (slot, key = "") => {
          const shown2 = viewedParts?.[slot];
          return shown2 && keyOf2(shown2) === key ? shown2 : parts.get(`${slot}:${key}`)?.props;
        }
      };
      let api = void 0;
      function build() {
        api = definition.api(context2);
        connectController(context2, api);
        if (dev) {
          for (const action of definition.agent?.actions ?? []) {
            if (typeof api[action] !== "function") {
              warn(
                `lists \`${action}\` in \`agent.actions\`, but its api has no such method.`,
                from
              );
            }
          }
        }
      }
      function wake() {
        const { sleeping } = owner4;
        if (!sleeping) {
          return;
        }
        owner4.sleeping = void 0;
        extendLifecycle(instance, build);
        for (const bind2 of [...sleeping.binds]) {
          bind2();
        }
      }
      if (definition.asleep?.(options)) {
        owner4.sleeping = { wake, binds: /* @__PURE__ */ new Set() };
      } else {
        build();
      }
      let handing = false;
      let following2 = false;
      let destroyed = false;
      const syncFrom = (options2, state) => withDerived(store, options2, definition.sync?.(options2), state);
      const instance = {
        // Type-only. Lets adapters read slot props, state and api types.
        types: void 0,
        name,
        id,
        get: store.get,
        subscribe: store.subscribe,
        get api() {
          wake();
          return api;
        },
        part,
        use,
        // The state `next` would make, or undefined when it makes none new, so
        // a framework can render a controlled value before it commits it.
        preview(next) {
          const synced = syncFrom({ ...next, id }, store.get());
          const current = store.get();
          for (const key in synced) {
            if (!sameValue(current[key], synced[key])) {
              return { ...current, ...synced };
            }
          }
        },
        // Runs `read` with `get()` returning `state`, and the api reading the
        // parts in `around` with the props given there, so a framework that
        // renders a preview reads the api, like a list's items or a radio
        // group's value, from it too.
        view(state, read, around) {
          const outer = viewedParts;
          viewedParts = around;
          try {
            return store.view(state, read);
          } finally {
            viewedParts = outer;
          }
        },
        setOptions(next) {
          const held3 = heldState(store);
          const arriving = next.id === id ? next : { ...next, id };
          const shown2 = dev && following2 ? syncFrom(arriving, held3) : void 0;
          options = arriving;
          if (dev) {
            checkControlled(from, controlled, options);
          }
          if (owner4.sleeping && !definition.asleep(options)) {
            wake();
          }
          const synced = syncFrom(options, held3);
          if (dev && shown2) {
            const torn = tornKeys(shown2, synced);
            if (torn.length) {
              emit({ type: "relay", ...from, keys: torn });
            }
          }
          let source;
          handing = true;
          try {
            for (const listener of optionsListeners) {
              source = listener(options, synced) ?? source;
            }
            const landing = heldState(store) === held3 ? synced : syncFrom(options, heldState(store));
            if (landing) {
              withSource(source, () => store.set(landing, true));
            }
          } finally {
            handing = false;
          }
        },
        // The state a new instance with `next` would start at. The web adapter
        // reads a form reset's defaults from it when properties set before
        // connecting started an element elsewhere.
        startState: (next) => definition.state({ ...next, id }),
        // Reads the keys `sync` makes from `current`, a framework's props, from
        // now on: state has them the moment the props change, before
        // `setOptions` hands them over from an effect, and parts the framework
        // renders read them through it rather than hear the store. Pass the same
        // object while the props stay the same. Returns a read of what `sync`
        // makes of them. Given the options an earlier read had as `before`, it
        // reads what those make of the same state, so a framework tells what
        // the props changed from what state did.
        follow(current) {
          following2 = true;
          let last;
          let synced;
          const read = (state = heldState(store), before) => {
            if (before) {
              return syncFrom({ ...before, id }, state);
            }
            if (destroyed) {
              return synced;
            }
            const options2 = current();
            if (last?.options !== options2 || last.state !== state) {
              last = { options: options2, state };
              synced = syncFrom({ ...options2, id }, state);
            }
            return synced;
          };
          store.follow(read);
          if (dev) {
            store.subscribe((_, delivered, keys) => {
              if (handing && !delivered && !isMeasuring()) {
                emit({ type: "relay", ...from, keys: [...keys] });
              }
            });
          }
          return read;
        },
        // The instance left the page. Stops what it started outside itself for
        // good, then runs its `onDestroy` callbacks, which settle what waits on
        // it, like a popup's pending `open()`. Adapters call it once the
        // component unmounts, and a second call does nothing.
        destroy() {
          if (destroyed) {
            return;
          }
          destroyed = true;
          discard(instance);
          whileDestroying(() => destroys.forEach((cleanup) => cleanup()));
          if (dev) {
            emit({ type: "instance", action: "destroy", ...from, controlled });
          }
        }
      };
      standFor(instance, store);
      watchWhileKept(instance, parts, definition);
      if (dev) {
        emit({ type: "instance", action: "create", ...from, controlled });
      }
      return instance;
    };
    const create = (initialOptions) => withLifecycle(() => make(initialOptions));
    Object.defineProperty(create, "name", { value: name });
    return Object.assign(create, {
      options: definition.options,
      slots
    });
  }
  function tornKeys(shown2, landed) {
    const before = shown2;
    const after = landed ?? {};
    const keys = /* @__PURE__ */ new Set([...Object.keys(before), ...Object.keys(after)]);
    return [...keys].filter((key) => !sameValue(before[key], after[key]));
  }
  var schemas = /* @__PURE__ */ new WeakMap();
  function schemaOf(primitive) {
    let schema = schemas.get(primitive);
    if (!schema) {
      const { options, slots = {} } = primitive;
      schema = {
        options: { debug: "boolean", ...options },
        slots: Object.fromEntries(
          Object.entries(slots).map(([slot, def]) => [
            slot,
            def.props ?? {}
          ])
        )
      };
      schemas.set(primitive, schema);
    }
    return schema;
  }
  var renderVersion = (instance) => renders(instance);

  // node_modules/@ui-sdk/core/dist/foundation/kernel/change.js
  init_dev_stub();

  // node_modules/@ui-sdk/core/dist/foundation/kernel/option-names.js
  var capitalized = (key) => `${key[0].toUpperCase()}${key.slice(1)}`;
  var callbackName = (key, kind) => `on${capitalized(key)}${kind}`;

  // node_modules/@ui-sdk/core/dist/foundation/kernel/change.js
  init_store();
  function debug(context2, key, value, reason, source) {
    if (dev && context2.options().debug) {
      console.debug(
        `[ui-sdk] ${context2.label}#${context2.id} ${key}: ${String(value)} (${reason}, ${source})`
      );
    }
  }
  function changeFrom(context2, source) {
    const { store, options } = context2;
    const requested = /* @__PURE__ */ new Map();
    const asked = /* @__PURE__ */ new Map();
    const changing = /* @__PURE__ */ new Map();
    context2.onOptions((next, synced) => {
      if (dev) {
        heardControlled(requested, next);
      }
      if (!synced) {
        return;
      }
      let source2;
      for (const [key, entry] of requested) {
        if (!(key in synced)) {
          continue;
        }
        if (sameValue(synced[key], entry.value)) {
          source2 = entry.source;
        }
        requested.delete(key);
      }
      return source2;
    });
    if (dev) {
      context2.onDestroy(() => forgetControlled(requested));
    }
    return (key, value, details) => {
      if (changing.has(key) && sameValue(changing.get(key), value)) {
        return false;
      }
      const ask = (asked.get(key) ?? 0) + 1;
      asked.set(key, ask);
      const previous = store.get()[key];
      if (sameValue(previous, value)) {
        return false;
      }
      const { reason, event } = details;
      const callbackDetails = createDetails(
        details,
        details.source ?? source(reason, event)
      );
      if (dev) {
        checkEvent(reason, event, { component: context2.label, id: context2.id });
      }
      debug(context2, key, value, reason, callbackDetails.source);
      const current = options();
      const isControlled = current[key] !== void 0;
      const outer = changing.has(key);
      const outerValue = changing.get(key);
      changing.set(key, value);
      try {
        withSource(callbackDetails.source, () => {
          const name = callbackName(key, "Change");
          const callback = current[name];
          if (typeof callback === "function") {
            const prevented = dev && !!event?.defaultPrevented;
            callback(value, callbackDetails);
            if (dev) {
              checkPrevented(name, prevented, callbackDetails, {
                component: context2.label,
                id: context2.id
              });
            }
          }
          const askedInside = asked.get(key) !== ask;
          if (!callbackDetails.canceled && !isControlled && !askedInside) {
            store.set({ [key]: value });
          }
        });
      } finally {
        if (outer) {
          changing.set(key, outerValue);
        } else {
          changing.delete(key);
        }
      }
      if (dev) {
        emit({
          type: "change",
          component: context2.label,
          id: context2.id,
          key,
          value,
          reason,
          source: callbackDetails.source,
          canceled: callbackDetails.canceled,
          controlled: isControlled
        });
      }
      if (callbackDetails.canceled) {
        return false;
      }
      watchers2.change?.(context2.id, key, value, callbackDetails, previous);
      if (isControlled) {
        requested.set(key, { value, source: callbackDetails.source });
        if (dev) {
          expectControlled(
            requested,
            {
              component: context2.label,
              id: context2.id,
              key,
              value,
              reason,
              source: callbackDetails.source
            },
            () => options()[key]
          );
        }
      }
      return true;
    };
  }
  function log(context2, key, value, details) {
    const source = details.source ?? resolveSource(details.reason);
    if (dev) {
      emit({
        type: "change",
        component: context2.label,
        id: context2.id,
        key,
        value,
        reason: details.reason,
        source,
        canceled: false,
        controlled: false
      });
    }
    debug(context2, key, value, details.reason, source);
  }

  // node_modules/@ui-sdk/core/dist/foundation/kernel/modality.js
  var modality = "pointer";
  var installed = false;
  var scheduled = false;
  var windowLeft = false;
  var lastPointer = "mouse";
  var pointerPressed = false;
  var forgetPointerPress = () => pointerPressed = false;
  var keyTarget = null;
  var forgetKeyTarget = () => keyTarget = null;
  function noteKey(event) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    keyTarget = event.target;
    setTimeout(forgetKeyTarget);
  }
  function noteKeydown(event) {
    noteKey(event);
    windowLeft = false;
    const modifierOnly = event.metaKey || event.ctrlKey || event.altKey || /^(Meta|Control|Alt|Shift)$/.test(event.key);
    if (event.key === "Tab" || !modifierOnly) {
      modality = "keyboard";
    }
  }
  function notePress(event) {
    modality = "pointer";
    windowLeft = false;
    if (!("pointerType" in event)) {
      if (!pointerPressed) {
        lastPointer = "touch";
      }
      return;
    }
    pointerPressed = true;
    setTimeout(forgetPointerPress);
    const type = event.pointerType;
    lastPointer = isSyntheticPointer(event) ? "virtual" : type === "touch" || type === "pen" ? type : "mouse";
  }
  function install2() {
    if (installed || typeof document === "undefined") {
      return;
    }
    installed = true;
    document.addEventListener("keydown", noteKeydown, true);
    document.addEventListener("keyup", noteKey, true);
    document.addEventListener("pointerdown", notePress, true);
    document.addEventListener("touchstart", notePress, {
      capture: true,
      passive: true
    });
    window.addEventListener("blur", (event) => {
      if (event.target === window) {
        windowLeft = true;
      }
    });
  }
  function trackInput() {
    if (installed || scheduled) {
      return;
    }
    scheduled = true;
    queueMicrotask(install2);
  }
  function isSyntheticPointer(event) {
    if (event.type === "pointermove") {
      return false;
    }
    if (event.width === 0 && event.height === 0 && event.pressure === 0) {
      return true;
    }
    return event.pointerType === "mouse" && event.width === 1 && event.height === 1 && event.pressure === 0 && event.detail === 0;
  }
  function clickSource(event) {
    if (event.detail > 0) {
      return lastPointer;
    }
    const fromKey = !!keyTarget && keyTarget.contains(event.target);
    return fromKey ? "keyboard" : "virtual";
  }
  var currentSource = () => modality === "keyboard" ? "keyboard" : lastPointer;
  function sourceOf2(event) {
    install2();
    if (!event) {
      return currentSource();
    }
    if (!trusted(event)) {
      return "programmatic";
    }
    if (event.type.startsWith("key")) {
      return "keyboard";
    }
    if (event.type.startsWith("touch")) {
      return "touch";
    }
    if (event.type === "click") {
      return clickSource(event);
    }
    const pointerType = event.pointerType;
    if (pointerType === "mouse" || pointerType === "touch" || pointerType === "pen") {
      return isSyntheticPointer(event) ? "virtual" : pointerType;
    }
    if ("button" in event) {
      return lastPointer;
    }
    return currentSource();
  }

  // node_modules/@ui-sdk/core/dist/foundation/kernel/input-source.js
  var changeSource = (reason, event) => resolveSource(reason, event && (() => sourceOf2(event)));
  function inputSource() {
    trackInput();
    return changeSource;
  }
  function createChange(context2, source = inputSource()) {
    return changeFrom(context2, source);
  }

  // node_modules/@ui-sdk/core/dist/components/button/button.js
  init_store();
  function buttonApiBody(context2) {
    const { store, options } = context2;
    const changeSource2 = inputSource();
    const write = (key, value, source) => {
      if (sameValue(store.get()[key], value)) {
        return;
      }
      store.set({ [key]: value });
      log(context2, key, value, { reason: "action", source });
    };
    announcePending(context2, () => store.get().pending);
    return {
      internal: {
        // A press runs the action, unless the button is disabled or still pending,
        // when the press is refused: preventing the click stops a second submit
        // and a disabled link from navigating. A returned Promise makes the
        // button pending until it settles. Adapters whose framework hands the
        // handler its own event, like React, pass `action` themselves.
        press(event, action = (details) => options().action?.(event, details)) {
          const state = store.get();
          if (isDisabled(state) || state.pending) {
            return event?.preventDefault();
          }
          const source = changeSource2("action", event);
          write("error", void 0, source);
          runAction(action, source, {
            pending: (pending2) => write("pending", pending2, source),
            done: () => {
            },
            failed: (error) => write("error", error, source)
          });
        }
      }
    };
  }
  var buttonApi = buttonApiBody;
  var buttonPrimitive = /* @__PURE__ */ definePrimitive({
    name: "button",
    options: {
      disabled: "boolean",
      focusableWhenDisabled: "boolean",
      type: "string",
      pendingAnnouncement: "string",
      // Internal: passed by renderers.
      action: "action"
    },
    state: (options) => ({
      disabled: !!options.disabled,
      formDisabled: false,
      focusableWhenDisabled: !!options.focusableWhenDisabled,
      type: options.type ?? "button",
      element: "unknown",
      pending: false,
      error: void 0
    }),
    sync: (options) => ({
      disabled: !!options.disabled,
      focusableWhenDisabled: !!options.focusableWhenDisabled,
      type: options.type ?? "button"
    }),
    api: (context2) => buttonApi(context2),
    slots: (slot) => ({
      root: slot({
        ...buttonRole((state) => state.element),
        focus: "tab-stop",
        state: (state) => ({
          disabled: isDisabled(state),
          pending: state.pending,
          error: state.error
        }),
        attrs: (state) => ({
          ...buttonElementAttrs(state.element, {
            type: state.type,
            disabled: isDisabled(state),
            focusable: state.focusableWhenDisabled
          }),
          // Presses do nothing while it's pending, so screen readers hear it's
          // unavailable. Not the native attribute, which would drop focus.
          ...state.pending && !isDisabled(state) && { "aria-disabled": "true" },
          "aria-busy": state.pending ? "true" : void 0,
          "data-disabled": isDisabled(state) ? "" : void 0,
          "data-pending": state.pending ? "" : void 0
        }),
        press: ({ api }, event) => api.internal.press(event),
        on: {
          keydown: (event, { el }) => buttonKeydown(event, el),
          keyup: (event, { el }) => buttonKeyup(event, el)
        },
        bind(el, { store }) {
          store.set({ element: buttonElement(el) });
          return watchFormDisabled(el, store);
        }
      })
    })
  });
  var button = buttonPrimitive;

  // node_modules/@ui-sdk/core/dist/renderer.js
  init_dev_stub();

  // node_modules/@ui-sdk/core/dist/foundation/text/typeahead.js
  var normalize = (text) => foldText(text).trim();
  function isTypeaheadKey(event) {
    return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
  }
  function textOf2(el) {
    let text = "";
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const hidden = node.parentElement?.closest('[aria-hidden="true"], [hidden]');
      if (hidden && el.contains(hidden) && (hidden !== el || hidden.getAttribute("aria-hidden") === "true")) {
        continue;
      }
      text += node.textContent;
    }
    return text;
  }
  function labelOf(el) {
    const text = textOf2(el).replace(/\s+/g, " ").trim();
    return text || (el.getAttribute("aria-label") ?? "");
  }
  function searchStart(current, query) {
    return query.length === 1 ? current + 1 : Math.max(current, 0);
  }
  function createTypeahead(timeout = 500) {
    let query = "";
    let lastKey = "";
    let stepping = false;
    let timer;
    function reset() {
      query = "";
      lastKey = "";
      stepping = false;
      clearTimeout(timer);
    }
    function scan(labels2, prefix, start) {
      const count3 = labels2.length;
      for (let step = 0; step < count3; step++) {
        const index = ((start + step) % count3 + count3) % count3;
        if (normalize(labels2[index]).startsWith(prefix)) {
          return index;
        }
      }
      return -1;
    }
    function search(key, labels2, current) {
      if (key.length !== 1 || key === " " && !query) {
        return -1;
      }
      clearTimeout(timer);
      timer = setTimeout(reset, timeout);
      const char = normalize(key) || key;
      stepping = char === lastKey && (stepping || query.length === 1);
      lastKey = char;
      query += char;
      if (stepping) {
        const whole = scan(labels2, query, Math.max(current, 0));
        return whole !== -1 ? whole : scan(labels2, char, searchStart(current, char));
      }
      return scan(labels2, query, searchStart(current, query));
    }
    return Object.assign(search, { reset, active: () => query.length > 0 });
  }

  // node_modules/@ui-sdk/core/dist/foundation/lists/listbox-engine.js
  init_dev_stub();

  // node_modules/@ui-sdk/core/dist/foundation/focus/collection.js
  var orientationOf = (value, fallback) => value === "horizontal" || value === "vertical" ? value : fallback;
  function stepFor(key, orientation2, rtl) {
    if (orientation2 === "both") {
      return radioStep(key, rtl) ?? (key === "Home" ? "first" : key === "End" ? "last" : void 0);
    }
    const forward = orientation2 === "vertical" ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
    const backward = orientation2 === "vertical" ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
    if (key === forward) {
      return 1;
    }
    if (key === backward) {
      return -1;
    }
    if (key === "Home") {
      return "first";
    }
    if (key === "End") {
      return "last";
    }
  }
  function radioStep(key, rtl) {
    if (key === "ArrowDown" || key === (rtl ? "ArrowLeft" : "ArrowRight")) {
      return 1;
    }
    if (key === "ArrowUp" || key === (rtl ? "ArrowRight" : "ArrowLeft")) {
      return -1;
    }
  }
  function rovingStop(items, remembered = null) {
    const focusable = items.filter((item) => item.focusable);
    if (remembered !== null && focusable.some((item) => item.key === remembered)) {
      return remembered;
    }
    const enabled = focusable.filter((item) => !item.disabled);
    return (enabled.find((item) => item.preferred) ?? enabled[0] ?? focusable[0])?.key ?? null;
  }
  function moveIndex(index, step, count3, loop) {
    if (step === "first") {
      return 0;
    }
    if (step === "last") {
      return count3 - 1;
    }
    const next = index + step;
    if (loop) {
      return (next % count3 + count3) % count3;
    }
    return Math.max(0, Math.min(count3 - 1, next));
  }
  function scrollToShow(scroll, viewport, start, size, before = 0, after = 0) {
    if (start - before < scroll) {
      return Math.max(0, start - before);
    }
    if (start + size + after > scroll + viewport) {
      return Math.max(0, start + size + after - viewport);
    }
    return scroll;
  }

  // node_modules/@ui-sdk/core/dist/foundation/lists/listbox-engine.js
  function itemKey(value, itemToValue) {
    if (value === null || value === void 0) {
      return "";
    }
    if (itemToValue) {
      return itemToValue(value);
    }
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "object") {
      const own = value.value ?? value.id;
      if (own !== void 0 && own !== null && typeof own !== "object") {
        return String(own);
      }
    }
    return String(value);
  }
  function toListItem(entry) {
    return typeof entry === "string" ? { value: entry, label: entry } : entry;
  }
  var isGroup = (entry) => typeof entry === "object" && "type" in entry && entry.type === "group";
  var isSeparator = (entry) => typeof entry === "object" && "type" in entry && entry.type === "separator";
  function flattenData(data, toKey) {
    const entries2 = [];
    data.forEach((entry, index) => {
      if (isSeparator(entry)) {
        return;
      }
      if (isGroup(entry)) {
        for (const child of entry.items) {
          entries2.push(entryOf(toListItem(child), toKey, `group-${index}`));
        }
        return;
      }
      entries2.push(entryOf(toListItem(entry), toKey));
    });
    return entries2;
  }
  function entryOf(item, toKey, group) {
    return {
      key: toKey(item.value),
      value: item.value,
      label: item.label,
      keywords: item.keywords,
      disabled: !!item.disabled,
      group
    };
  }
  function revealInList(el, stop) {
    for (let node = el.parentElement; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) {
        const top = el.getBoundingClientRect().top - node.getBoundingClientRect().top - node.clientTop + node.scrollTop;
        const before = parseFloat(style.scrollPaddingTop) || 0;
        const after = parseFloat(style.scrollPaddingBottom) || 0;
        const shown2 = scrollToShow(
          node.scrollTop,
          node.clientHeight,
          top,
          el.offsetHeight,
          before,
          after
        );
        const scrollTop = Math.min(shown2, node.scrollHeight - node.clientHeight);
        if (scrollTop !== node.scrollTop) {
          node.scrollTop = scrollTop;
        }
        return;
      }
      if (node === stop) {
        return;
      }
    }
  }
  function createListboxEngine(config, filtering) {
    const { store } = config;
    const focusMode = typeof config.focus === "function" ? config.focus : () => config.focus;
    const registry = createOrder();
    const known = /* @__PURE__ */ new Map();
    const typeahead = createTypeahead();
    const pinned = /* @__PURE__ */ new Set();
    let dataMemo;
    let emptyMemo;
    let visibleMemo;
    let composedMemo;
    let labelsVersion = 0;
    let mountsVersion = 0;
    const memoOf = (items, memo) => {
      if (memo?.data === items) {
        return memo;
      }
      const flat = flattenData(items, config.toKey);
      return {
        data: items,
        flat,
        byKey: new Map(flat.map((entry) => [entry.key, entry]))
      };
    };
    function data() {
      const items = config.items();
      if (!items) {
        return void 0;
      }
      return dataMemo = memoOf(items, dataMemo);
    }
    function emptySource() {
      const items = config.emptyItems?.();
      return items && (emptyMemo = memoOf(items, emptyMemo));
    }
    function emptyData() {
      if (!config.items() || !(config.showEmpty?.() ?? !config.query().trim())) {
        return void 0;
      }
      return emptySource();
    }
    function dataEntry(key) {
      return data()?.byKey.get(key) ?? emptySource()?.byKey.get(key);
    }
    function visibleData() {
      const source = emptyData() ?? data();
      if (!source) {
        return void 0;
      }
      const query = config.query();
      const filter = config.filter();
      const rank = config.rank?.() ?? false;
      if (visibleMemo?.data !== source.data || visibleMemo.query !== query || visibleMemo.filter !== filter || visibleMemo.rank !== rank) {
        const list = filtering.data(source.data, query, filter, { rank });
        visibleMemo = {
          data: source.data,
          query,
          filter,
          rank,
          list,
          flat: flattenData(list, config.toKey)
        };
      }
      return visibleMemo;
    }
    function warnIfShared(key, el) {
      const other = registry.get(key)?.el;
      if (!other || other === el || !other.isConnected) {
        return;
      }
      const slot = el.getAttribute("data-slot") ?? "";
      warn(
        `Two items have the value "${key}". Give each item its own value, or arrow keys skip one and choosing it picks the other.`,
        { component: slot.replace(/-item$/, "") || "listbox" }
      );
    }
    function liveLabel(key, registered2) {
      const meta = registered2.meta();
      const label = meta.label ?? labelOf(registered2.el);
      if (meta.pinned) {
        return label;
      }
      const previous = known.get(key);
      if (previous?.label !== label) {
        known.set(key, { ...previous, label, value: meta.value });
        labelsVersion++;
      }
      return label;
    }
    function registeredEntry(key, registered2) {
      const meta = registered2.meta();
      return {
        key,
        value: meta.value,
        label: liveLabel(key, registered2),
        keywords: meta.keywords,
        // Read live, since the list is cached while an item's props change.
        get disabled() {
          return !!registered2.meta().disabled;
        },
        group: meta.group,
        pinned: meta.pinned
      };
    }
    const asked = /* @__PURE__ */ new Map();
    const shows = (key, meta) => !!data() || composedMatches(key, meta);
    function matches(key, meta) {
      asked.set(key, meta);
      return shows(key, meta);
    }
    function composedMatches(key, meta) {
      const registered2 = registry.get(key);
      const label = meta.label ?? (registered2 ? liveLabel(key, registered2) : known.get(key)?.label) ?? (typeof meta.value === "string" ? meta.value : "");
      return filtering.matches(
        { value: meta.value, label, keywords: meta.keywords },
        config.query(),
        config.filter()
      );
    }
    function dataEntries(flat) {
      if (!pinned.size) {
        return flat;
      }
      const first = flat.length ? registry.get(flat[0].key)?.el : void 0;
      const before = [];
      const after = [];
      for (const key of pinned) {
        const registered2 = registry.get(key);
        if (!registered2?.el.isConnected) {
          continue;
        }
        const precedes = !!first?.isConnected && isAfter(registered2.el, first);
        (precedes ? before : after).push(registeredEntry(key, registered2));
      }
      return before.length || after.length ? [...before, ...flat, ...after] : flat;
    }
    function composedEntries() {
      const list = registry.list();
      const query = config.query();
      const filter = config.filter();
      if (composedMemo?.order === list && composedMemo.query === query && composedMemo.filter === filter && composedMemo.version === labelsVersion) {
        return composedMemo.list;
      }
      const result = list.map((registered2) => registeredEntry(registered2.key, registered2)).filter(
        (entry, index) => list[index].meta().pinned || composedMatches(entry.key, entry)
      );
      composedMemo = {
        order: list,
        query,
        filter,
        version: labelsVersion,
        list: result
      };
      return result;
    }
    function entries2() {
      const visible = visibleData();
      if (visible) {
        return dataEntries(visible.flat);
      }
      return composedEntries();
    }
    const disabled = (entry) => entry.disabled || !!config.blocked?.(entry);
    function find(key) {
      if (key === null) {
        return void 0;
      }
      const fromData2 = dataEntry(key);
      if (fromData2) {
        return fromData2;
      }
      const registered2 = registry.get(key);
      if (registered2) {
        return registeredEntry(key, registered2);
      }
      const remembered = known.get(key);
      if (remembered) {
        return {
          key,
          value: remembered.value,
          label: remembered.label,
          disabled: false
        };
      }
    }
    function reveal(el, focus) {
      if (focusMode() === "real" && focus && config.active()) {
        el.focus({ preventScroll: true });
      }
      if (config.keepInView?.() !== false) {
        revealInList(el, (config.scrollRoot ?? config.container)?.());
      }
    }
    function highlight(key, { focus = true, event } = {}) {
      store.set({ highlighted: key });
      const list = entries2();
      const index = key === null ? -1 : list.findIndex((entry) => entry.key === key);
      config.onHighlight?.(key, index, event);
      let last = list.length - 1;
      if (config.skipDisabled) {
        while (last > 0 && list[last].disabled) {
          last--;
        }
      }
      if (index !== -1 && index === last) {
        config.onLastReached?.();
      }
      if (key === null) {
        return;
      }
      const el = registry.get(key)?.el;
      if (el?.isConnected) {
        reveal(el, focus);
      }
    }
    function stepKey(step, { loop = config.loop() } = {}) {
      const all = entries2();
      const list = config.skipDisabled ? all.filter((entry) => !entry.disabled) : all;
      if (!list.length) {
        return void 0;
      }
      const current = store.get().highlighted;
      const index = list.findIndex((entry) => entry.key === current);
      if (index !== -1 || typeof step !== "number") {
        return list[moveIndex(index, step, list.length, loop)].key;
      }
      const skipped = all.findIndex((entry) => entry.key === current);
      if (skipped !== -1) {
        const before = all.slice(0, skipped).filter((entry) => !entry.disabled).length;
        return list[moveIndex(step > 0 ? before - 1 : before, step, list.length, loop)].key;
      }
      return list[step > 0 ? 0 : list.length - 1].key;
    }
    function move(step, event) {
      const key = stepKey(step);
      if (key !== void 0) {
        highlight(key, { event });
      }
    }
    function search(char, from) {
      const list = entries2().filter((entry) => !entry.pinned);
      const found2 = typeahead(
        char,
        list.map((entry) => disabled(entry) ? "" : entry.label),
        list.findIndex((entry) => entry.key === from)
      );
      return found2 === -1 ? void 0 : list[found2];
    }
    function focusLost(el) {
      const doc = el.ownerDocument;
      return !doc.activeElement || doc.activeElement === doc.body;
    }
    const moves2 = typeof MutationObserver === "undefined" ? void 0 : new MutationObserver(moved);
    function moved() {
      const key = store.get().highlighted;
      const el = key === null ? void 0 : registry.get(key)?.el;
      if (el?.isConnected && focusLost(el)) {
        reveal(el, true);
      }
    }
    function focusWhenMounted(key, el) {
      const shouldFocus = () => store.get().highlighted === key && config.active();
      if (focusMode() !== "real" || !shouldFocus() || el.ownerDocument.activeElement === el) {
        return;
      }
      queueMicrotask(() => {
        if (shouldFocus() && el.isConnected) {
          reveal(el, true);
        }
      });
    }
    function register2(key, el, meta) {
      mountsVersion++;
      if (dev) {
        warnIfShared(key, el);
      }
      const entry = { key, el, meta };
      const remove = registry.add(entry);
      const current = meta();
      if (current.pinned) {
        pinned.add(key);
      } else {
        const previous = known.get(key);
        if (current.label !== void 0 && previous?.label !== current.label) {
          labelsVersion++;
        }
        known.set(key, {
          ...previous,
          label: current.label ?? previous?.label ?? "",
          value: current.value,
          keywords: current.keywords,
          group: current.group
        });
      }
      queueMicrotask(() => {
        if (registry.get(key) !== entry || !entry.el.isConnected) {
          return;
        }
        liveLabel(key, entry);
        if (entry.el.parentNode) {
          moves2?.observe(entry.el.parentNode, { childList: true });
        }
      });
      config.onRegister?.(key);
      focusWhenMounted(key, el);
      return () => {
        if (registry.get(key) !== entry) {
          return;
        }
        remove();
        mountsVersion++;
        pinned.delete(key);
        if (!registry.size()) {
          moves2?.disconnect();
        }
        config.onRegister?.(key);
        queueMicrotask(() => left(key, el));
      };
    }
    function left(key, el) {
      if (registry.get(key) || dataEntry(key) || store.get().highlighted !== key) {
        return;
      }
      store.set({ highlighted: null });
      if (focusMode() === "real" && config.active() && focusLost(el)) {
        config.container?.()?.focus({ preventScroll: true });
      }
    }
    return {
      entries: entries2,
      visibleData,
      // Every data item, whatever the query. Undefined for composed items.
      dataItems: () => data()?.flat,
      find,
      disabled,
      // Whether an item is disabled by itself, which keys and the pointer pass
      // over. A `blocked` item can't be chosen but stays reachable.
      isItemDisabled: (key) => !!find(key)?.disabled,
      highlight,
      move,
      stepKey,
      // The first item that can be chosen, for highlighting the best match.
      firstEnabled: () => entries2().find((entry) => !entry.pinned && !disabled(entry))?.key,
      search,
      register: register2,
      typing: () => typeahead.active(),
      resetTyping: () => typeahead.reset(),
      // The label of an item, from data, a mounted item, or one that was mounted before.
      labelOf(key) {
        const fromData2 = dataEntry(key);
        if (fromData2) {
          return fromData2.label;
        }
        const registered2 = registry.get(key);
        if (registered2) {
          return liveLabel(key, registered2);
        }
        return known.get(key)?.label;
      },
      valueOf(key) {
        const fromData2 = dataEntry(key);
        if (fromData2) {
          return fromData2.value;
        }
        return registry.get(key)?.meta().value ?? known.get(key)?.value;
      },
      matches,
      // What each item shows from the list as a whole, by key, as a short
      // string: "-" while the query hides it, then the list's size for an item
      // placed by `index`, then what `more` adds, like "s" while it's selected.
      // Every item that rendered, mounted or was remembered, and every data
      // item, has an entry. See listbox-listing.ts.
      listing(more) {
        const listing = {};
        let size;
        const filtering2 = !data() && !!config.query().trim();
        const shown2 = filtering2 ? new Set(composedEntries().map((entry) => entry.key)) : void 0;
        const add = (key, item, latest) => {
          if (typeof listing[key] === "string") {
            return;
          }
          const registered2 = registry.get(key);
          const meta = latest ? item : registered2?.meta() ?? item;
          const matched = !shown2 || shown2.has(key) || !registered2?.el.isConnected && composedMatches(key, meta);
          let entry = matched ? "" : "-";
          if (meta.index !== void 0) {
            entry += size ??= entries2().length;
          }
          if (more) {
            entry += more(key, meta.value);
          }
          listing[key] = entry;
        };
        for (const [key, item] of asked) {
          add(key, item, true);
        }
        for (const [key, item] of known) {
          add(key, item, false);
        }
        for (const entry of data()?.flat ?? []) {
          add(entry.key, entry, false);
        }
        for (const entry of emptySource()?.flat ?? []) {
          add(entry.key, entry, false);
        }
        return listing;
      },
      // Everything the listing depends on besides a component's own state, like
      // the selected value. The listing changes only when one of these does. A
      // data list's entries don't depend on which items are mounted or on their
      // labels, only on its pinned items, which count toward its size. So rows
      // scrolling into a virtualized list don't make it list every item again.
      listingInputs: () => [
        config.items() ? pinned.size : mountsVersion,
        config.items() ? 0 : labelsVersion,
        config.query(),
        config.filter(),
        config.items(),
        config.emptyItems?.(),
        config.showEmpty?.(),
        config.rank?.()
      ],
      // The keys of the items that match and can be chosen, in one group or in
      // all, leaving out pinned entries. For selecting all of them at once.
      selectable(group) {
        const keys = [];
        for (const entry of entries2()) {
          if (entry.pinned || entry.disabled) {
            continue;
          }
          if (group !== void 0 && (registry.get(entry.key)?.meta().group ?? entry.group) !== group) {
            continue;
          }
          keys.push(entry.key);
        }
        return keys;
      },
      // How many items match, leaving out pinned entries like a create option.
      count() {
        let count3 = 0;
        for (const entry of entries2()) {
          if (!entry.pinned) {
            count3++;
          }
        }
        return count3;
      },
      // Whether any item of a composed group matches.
      groupMatches(group) {
        if (data()) {
          return true;
        }
        return registry.list().some(
          (registered2) => registered2.meta().group === group && composedMatches(registered2.key, registered2.meta())
        );
      },
      element: (key) => registry.get(key)?.el,
      // Counts every label change, so a part showing a label can re-render.
      labelsVersion: () => labelsVersion,
      // Remembers a label, like the one an item had when it was chosen.
      remember(key, label, value, keywords) {
        const current = known.get(key);
        const words = current?.keywords;
        const sameText = current?.label === label && (!keywords || words?.length === keywords.length && keywords.every((word, index) => word === words[index]));
        if (current && sameText) {
          if (current.value !== value) {
            known.set(key, { ...current, value });
          }
          return;
        }
        known.set(key, {
          ...current,
          label,
          value,
          ...keywords && { keywords }
        });
        labelsVersion++;
      }
    };
  }

  // node_modules/@ui-sdk/core/dist/foundation/kernel/attrs.js
  function idPart(value) {
    return value.replace(/[\s%]/g, encodeURIComponent);
  }

  // node_modules/@ui-sdk/core/dist/foundation/lists/listbox-value.js
  init_store();
  function listOf(value) {
    return Array.isArray(value) ? value : value === null || value === void 0 ? [] : [value];
  }
  var holds = (memo, value) => Array.isArray(value) ? sameValue(memo.values, value) : memo.value === value;
  function createValueSelection(config) {
    const { store, options, listbox: listbox2, toKey, onDestroy } = config;
    let keysMemo;
    let labelsQueued = false;
    let learned = false;
    let lastLabels = [];
    let restoring;
    let stopWaiting;
    let filling = false;
    onDestroy(stopRestoring);
    deriveFromOptions(
      { store },
      ["value", "initial"],
      (synced, state, next) => {
        if (synced.multiple === void 0 || synced.multiple === state.multiple) {
          return;
        }
        const shaped = (value) => synced.multiple ? listOf(value) : Array.isArray(value) ? value[0] ?? null : value;
        return {
          initial: shaped(state.initial),
          ...next.value === void 0 && { value: shaped(state.value) }
        };
      }
    );
    function memoFor(value) {
      const given = options();
      const { itemToValue } = given;
      const waiting = restoring?.value === value ? restoring : void 0;
      const memo = keysMemo?.restoring === waiting ? keysMemo : void 0;
      if (memo && memo.value === value && memo.options === given) {
        return memo;
      }
      if (memo && memo.itemToValue === itemToValue && holds(memo, value)) {
        memo.value = value;
        memo.options = given;
        return memo;
      }
      const values2 = [...listOf(value)];
      const keys2 = values2.map(
        (item, index) => waiting?.keys.get(index) ?? toKey(item)
      );
      return keysMemo = {
        value,
        options: given,
        itemToValue,
        values: values2,
        keys: keys2,
        set: new Set(keys2),
        restoring: waiting
      };
    }
    function stopRestoring() {
      stopWaiting?.();
      stopWaiting = restoring = void 0;
    }
    function fillArrived() {
      const current = restoring;
      if (!current) {
        return;
      }
      if (store.get().value !== current.value) {
        return stopRestoring();
      }
      const values2 = [...listOf(current.value)];
      const keys2 = new Map(current.keys);
      for (const [index, key] of current.keys) {
        const value2 = listbox2.valueOf(key);
        if (value2 === void 0) {
          continue;
        }
        values2[index] = value2;
        keys2.delete(index);
      }
      if (keys2.size === current.keys.size) {
        return;
      }
      const value = Array.isArray(current.value) ? values2 : values2[0];
      if (keys2.size) {
        restoring = { value, keys: keys2 };
      } else {
        stopRestoring();
      }
      filling = true;
      try {
        store.set({ value });
      } finally {
        filling = false;
      }
    }
    const values = () => memoFor(store.get().value).values;
    const keys = () => memoFor(store.get().value).keys;
    function isSelected(key, itemValue) {
      const equal = options().isItemEqualToValue;
      if (equal && itemValue !== void 0) {
        return values().some((value) => equal(itemValue, value));
      }
      return memoFor(store.get().value).set.has(key);
    }
    function labelOf2(value) {
      const itemToLabel = options().itemToLabel;
      if (itemToLabel) {
        return itemToLabel(value);
      }
      const label = listbox2.labelOf(toKey(value));
      if (label !== void 0) {
        return label;
      }
      return typeof value === "string" ? value : toKey(value);
    }
    const unlabeled = () => keys().filter((key) => listbox2.labelOf(key) === void 0);
    return {
      values,
      keys,
      // The keys of a value, for attributes that render from a state snapshot.
      keysOf: (value) => memoFor(value).keys,
      isSelected,
      labelOf: labelOf2,
      // Each value's label, the same list while nothing changed, so a part that reads it doesn't re-render.
      labels() {
        const next = values().map(labelOf2);
        if (next.length !== lastLabels.length || next.some((label, index) => label !== lastLabels[index])) {
          lastLabels = next;
        }
        return lastLabels;
      },
      // A label learned from an item that's selected shows in the value. Batched,
      // since a long list registers all at once.
      queueLabels() {
        if (labelsQueued) {
          return;
        }
        labelsQueued = true;
        queueMicrotask(() => {
          labelsQueued = false;
          store.set({ labels: listbox2.labelsVersion() });
        });
      },
      // Learns the labels of values whose items haven't mounted, like on the
      // server. `find` answers for the keys with none, from the items among an
      // adapter's children. Only the first call looks, since it's for the
      // render before the items mount. Returns whether it found any.
      learn(find) {
        if (learned || options().itemToLabel) {
          return false;
        }
        learned = true;
        const unknown = new Set(unlabeled());
        if (!unknown.size) {
          return false;
        }
        const found2 = find(unknown);
        for (const { value, label } of found2) {
          listbox2.remember(toKey(value), label, value);
        }
        return found2.length > 0;
      },
      // Whether a closed list must mount its items hidden for the value: for a
      // label only its item knows, or for a value icon in the page, which copies
      // its item's icon. Not for a label the root found among its children.
      needsItems: (hasValueIcon) => unlabeled().length > 0 || hasValueIcon && keys().length > 0,
      // The value with an item added, or removed when it's there, for `multiple`.
      toggled(key, itemValue) {
        if (!isSelected(key, itemValue)) {
          return [...values(), itemValue];
        }
        return values().filter((value) => toKey(value) !== key);
      },
      // The value without one item's key, for removing a chip.
      without: (key) => values().filter((value) => toKey(value) !== key),
      // What selecting nothing is: `null`, or an empty list with `multiple`.
      empty: () => store.get().multiple ? [] : null,
      // Sets the value a browser restored, from the keys it saved, through
      // `write`. Keys whose items haven't arrived hold their place until they
      // do, unless something sets the value first.
      restore(saved, write) {
        stopRestoring();
        let keys2 = [];
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            keys2 = parsed;
          }
        } catch {
        }
        const { multiple } = store.get();
        if (!multiple) {
          keys2 = keys2.slice(0, 1);
        }
        const waiting = /* @__PURE__ */ new Map();
        const found2 = keys2.map((key, index) => {
          const value2 = listbox2.valueOf(key);
          if (value2 === void 0) {
            waiting.set(index, key);
          }
          return value2 ?? key;
        });
        const value = multiple ? found2 : found2[0] ?? null;
        if (!waiting.size) {
          return write(value);
        }
        const request = { value, keys: waiting };
        restoring = request;
        write(value);
        if (restoring !== request) {
          return;
        }
        const held3 = store.get().value;
        if (!sameValue(held3, value)) {
          return stopRestoring();
        }
        restoring = { value: held3, keys: waiting };
        stopWaiting = store.subscribe(fillArrived);
      },
      stopRestoring,
      // Whether the value changing now is a restore's late items taking their slots.
      isFilling: () => filling
    };
  }

  // node_modules/@ui-sdk/core/dist/foundation/kernel/elements.js
  function elements(context2, slot) {
    const bound2 = [...context2.parts()].filter(
      (part) => part.slot === slot && !!part.el?.isConnected
    );
    return inDocumentOrder(bound2).map(({ el, key, props }) => ({
      el,
      key,
      props
    }));
  }

  // node_modules/@ui-sdk/core/dist/foundation/lists/listbox-parts.js
  init_dev_stub();

  // node_modules/@ui-sdk/core/dist/foundation/kernel/bound-keys.js
  var queued = /* @__PURE__ */ new WeakMap();
  function later(store, edit) {
    const waiting = queued.get(store);
    if (waiting) {
      return void waiting.push(edit);
    }
    const edits = [edit];
    queued.set(store, edits);
    queueMicrotask(() => {
      queued.delete(store);
      const draft = {};
      for (const run of edits) {
        run(draft);
      }
      store.set(draft);
    });
  }
  function keyWhileBound(store, field2, key) {
    const edit = (change) => later(store, (draft) => {
      draft[field2] = change(
        draft[field2] ?? store.get()[field2]
      );
    });
    let bound2 = true;
    let added = false;
    edit((keys) => {
      if (!bound2) {
        return keys;
      }
      added = true;
      return [...keys, key];
    });
    return () => {
      bound2 = false;
      edit((keys) => {
        if (!added) {
          return keys;
        }
        const index = keys.indexOf(key);
        return index === -1 ? keys : keys.filter((_, at) => at !== index);
      });
    };
  }

  // node_modules/@ui-sdk/core/dist/foundation/lists/listbox-parts.js
  init_env();
  init_presence();
  var noItems2 = [];
  var formAttrs = (state) => ({
    "data-disabled": isDisabled(state) ? "" : void 0,
    "data-readonly": state.readOnly ? "" : void 0,
    "data-required": state.required ? "" : void 0
  });
  function warnIfUnnamed(el, message, from, named = () => false) {
    if (!isBrowser) {
      return;
    }
    setTimeout(() => {
      if (!el.isConnected || named() || el.getAttribute("aria-labelledby") || el.getAttribute("aria-label") || labelsOf(el).length) {
        return;
      }
      warn(message, from);
    }, 300);
  }
  function positionAttrs(index, listbox2) {
    if (index === void 0) {
      return {};
    }
    return {
      "aria-posinset": String(index + 1),
      "aria-setsize": String(listbox2.entries().length)
    };
  }
  function registerItem(el, {
    api,
    key,
    props
  }) {
    return api.internal.listbox.register(key, el, () => {
      const latest = api.internal.itemProps(key) ?? props;
      return {
        value: latest.value,
        label: latest.label,
        keywords: latest.keywords,
        disabled: latest.disabled,
        group: latest.group,
        index: latest.index
      };
    });
  }
  var groupLabelledBy = (state, id, group) => state.groupLabels.includes(group) ? `${id}-group-${idPart(group)}` : void 0;
  function bindFormRoot(el, { api, store }, { focusOnSelfClick }) {
    const { selection } = api.internal;
    const unbind = bindInternals(el, {
      value: () => {
        const keys = selection.keys();
        return store.get().multiple ? keys : keys[0] ?? null;
      },
      name: () => store.get().name,
      state: () => JSON.stringify(selection.keys()),
      restore: api.internal.restore,
      valueMissing: () => store.get().required && selection.keys().length === 0,
      message: () => valueMissingMessage("select"),
      anchor: api.internal.controlElement,
      focus: api.focus,
      reset: api.internal.reset,
      disabled: api.internal.setFormDisabled,
      subscribe: store.subscribe
    });
    let unname = () => {
    };
    queueMicrotask(() => {
      const control = api.internal.controlElement();
      if (control) {
        unname = nameFromLabels(el, control);
      }
    });
    const onClick = (event) => {
      if (event.target === el) {
        api.focus();
      }
    };
    if (focusOnSelfClick) {
      el.addEventListener("click", onClick);
    }
    return () => {
      unbind();
      unname();
      el.removeEventListener("click", onClick);
    };
  }
  function hiddenInputPart(slot) {
    return {
      attrs: (state, { id, api }) => {
        const keys = api.internal.selection.keysOf(state.value);
        return {
          id: `${id}-${slot}`,
          type: "text",
          name: state.multiple ? void 0 : state.name,
          value: state.multiple ? keys.join(",") : keys[0] ?? "",
          form: state.form,
          autocomplete: state.autoComplete,
          required: state.required ? "" : void 0,
          disabled: state.disabled ? "" : void 0,
          "aria-hidden": "true",
          tabindex: "-1",
          style: hiddenInputStyle
        };
      },
      bind: (el, { api, store }) => bindValueInput(el, {
        value: () => {
          const keys = api.internal.selection.keys();
          return store.get().multiple ? keys.join(",") : keys[0] ?? "";
        },
        subscribe: store.subscribe,
        focus: api.focus,
        autofill: api.internal.autofill,
        reset: api.internal.reset,
        disabled: api.internal.setFormDisabled
      })
    };
  }
  function valueInputPart() {
    return {
      props: { value: "string" },
      attrs: (state, { props }) => ({
        type: "hidden",
        name: state.name,
        value: props.value,
        form: state.form,
        disabled: isDisabled(state) ? "" : void 0
      })
    };
  }
  function itemIndicatorPart() {
    return {
      // Its id is made for it, and its item is the one it's inside, which every
      // renderer fills in, so `item` is set by the time it's read.
      props: {
        item: { kind: "string", from: "item.value", required: true },
        keepMounted: "boolean",
        id: "id"
      },
      present: (state, { props, api }) => !!props.keepMounted || api.internal.selection.isSelected(props.item),
      state: (state, { props, api }) => ({
        selected: api.internal.selection.isSelected(props.item)
      }),
      attrs: (state, { props, api }) => ({
        "aria-hidden": "true",
        "data-selected": api.internal.selection.isSelected(props.item) ? "" : void 0
      }),
      bind: (el, { api, props }) => api.internal.selection.isSelected(props.item) ? animateIn(el) : void 0
    };
  }
  function groupLabelPart() {
    return {
      // Its group is the one it's inside, which every renderer fills in. The
      // group's id keys it too, so labels of two groups are two parts.
      props: {
        id: { kind: "string", from: "group.id", required: true },
        group: { kind: "string", from: "group.id", required: true }
      },
      attrs: (state, { id, props }) => ({
        id: `${id}-group-${idPart(props.group)}`
      }),
      bind: (el, { store, props }) => keyWhileBound(store, "groupLabels", props.group)
    };
  }

  // node_modules/@ui-sdk/core/dist/foundation/lists/item-icon.js
  init_dev_stub();

  // node_modules/@ui-sdk/core/dist/foundation/text/name-check-stub.js
  function checkName(_el, _part, _from) {
  }

  // node_modules/@ui-sdk/core/dist/foundation/lists/item-icon.js
  init_style();
  var marks2 = /* @__PURE__ */ new WeakMap();
  function mark(el, attribute) {
    let counts = marks2.get(el);
    if (!counts) {
      marks2.set(el, counts = {});
    }
    counts[attribute] = (counts[attribute] ?? 0) + 1;
    if (counts[attribute] === 1) {
      el.setAttribute(attribute, "");
    }
    return () => {
      counts[attribute]--;
      if (counts[attribute] === 0) {
        el.removeAttribute(attribute);
      }
    };
  }
  function addMirrorRule(doc) {
    writeStyle(
      doc,
      "ui-sdk-mirror",
      "@layer ui-sdk{:where([data-mirror][aria-hidden]){display:inline-block}:where([data-mirror][aria-hidden]:dir(rtl)){scale:-1 1}}"
    );
  }
  function placeIcon(el, placement, subscribe2, found2) {
    let unmarkItem;
    let unmarkList;
    let unsubscribe;
    let active = true;
    const place = () => {
      const item = el.parentElement?.closest(placement.item);
      if (!item) {
        return false;
      }
      if (!unmarkItem) {
        unmarkItem = mark(item, "data-has-icon");
        found2(item);
      }
      if (!placement.list) {
        return true;
      }
      const list = item.parentElement?.closest(placement.list);
      if (list) {
        unmarkList = mark(list, "data-has-icons");
      }
      return !!list;
    };
    const placeOnChange = () => {
      if (!place()) {
        return;
      }
      unsubscribe?.();
      unsubscribe = void 0;
    };
    if (!place()) {
      queueMicrotask(() => {
        if (active && !place()) {
          unsubscribe = subscribe2(placeOnChange);
        }
      });
    }
    return () => {
      active = false;
      unsubscribe?.();
      unmarkItem?.();
      unmarkList?.();
    };
  }
  function itemIconPart(placement) {
    return {
      // An icon's id is made for it, and its item is the one it's inside.
      props: {
        mirror: "boolean",
        id: "id",
        item: { kind: "string", from: "item.value" }
      },
      state: (state, { props }) => ({ mirror: !!props.mirror }),
      attrs: (state, { props }) => ({
        "aria-hidden": "true",
        "data-mirror": props.mirror ? "" : void 0
      }),
      bind(el, { api, props, id, store }) {
        addMirrorRule(el.ownerDocument);
        const found2 = (item) => dev && queueMicrotask(() => {
          if (item.isConnected) {
            checkName(item, "An item with only an icon", {
              component: placement.component,
              id
            });
          }
        });
        const unplace = placeIcon(el, placement, store.subscribe, found2);
        const unregister = placement.register?.(el, { api, props });
        return () => {
          unplace();
          unregister?.();
        };
      }
    };
  }
  function createItemIcons(store) {
    const icons = /* @__PURE__ */ new Map();
    let queued2 = false;
    const changed = () => {
      if (queued2) {
        return;
      }
      queued2 = true;
      queueMicrotask(() => {
        queued2 = false;
        store.set({ icons: store.get().icons + 1 });
      });
    };
    return {
      /** The icon element of an item. */
      get: (key) => icons.get(key),
      /** Remembers an item's icon until another replaces it. `keep` copies it when it leaves. */
      register(key, icon, keep2) {
        icons.set(key, icon);
        changed();
        return () => {
          if (icons.get(key) === icon && keep2) {
            icons.set(key, keep2(icon));
          }
        };
      }
    };
  }
  var optionIcon = { item: '[role="option"]', list: '[role="listbox"]' };

  // node_modules/@ui-sdk/core/dist/foundation/kernel/live.js
  init_part();
  function live(read) {
    return {
      read,
      /**
       * Writes the attributes to `el` now and on every change the part hears.
       * Returns the cleanup, which removes them again.
       */
      attach(part, el) {
        const channel = `live:${part.id}`;
        const write = () => applyAttrs(el, liveAttrs(part), channel);
        write();
        const unsubscribe = subscribe(part, write);
        return () => {
          unsubscribe();
          applyAttrs(el, {}, channel);
        };
      }
    };
  }
  var applied = /* @__PURE__ */ new WeakMap();
  var found = /* @__PURE__ */ new WeakMap();
  var writing;
  function applyAttrs(el, attrs2, channel = "render") {
    writeAttrs(el, attrs2, channel, false);
  }
  function releaseAttrs(el, channel) {
    writeAttrs(el, {}, channel, true);
  }
  function markAuthored(el, name) {
    if (el === writing) {
      return;
    }
    for (const written of Object.values(applied.get(el) ?? {})) {
      written.delete(name);
    }
    for (const values of Object.values(found.get(el) ?? {})) {
      values.delete(name);
    }
  }
  function writeAttrs(el, attrs2, channel, release3) {
    const outer = writing;
    writing = el;
    try {
      writeChannel(el, attrs2, channel, release3);
    } finally {
      writing = outer;
    }
  }
  function writeChannel(el, attrs2, channel, release3) {
    const channels = applied.get(el) ?? {};
    const previous = channels[channel] ?? /* @__PURE__ */ new Map();
    const written = /* @__PURE__ */ new Map();
    const styles = attrs2.style === void 0 ? [] : styleDeclarations(attrs2.style);
    for (const [property, value] of styles) {
      written.set(`style:${property}`, value);
    }
    for (const [name, value] of Object.entries(attrs2)) {
      if (value !== void 0 && name !== "style") {
        written.set(name, value);
      }
    }
    const id = written.has("id") || previous.has("id") ? el.getAttribute("id") : null;
    const keeps = keepsId(id, channels, channel);
    if (keeps) {
      written.delete("id");
    }
    const authors = /* @__PURE__ */ new Set();
    const read = /* @__PURE__ */ new Map();
    for (const name of /* @__PURE__ */ new Set([...written.keys(), ...previous.keys()])) {
      if (!authorOwned.has(name)) {
        continue;
      }
      const current = el.getAttribute(name);
      read.set(name, current);
      if (current === null || current === written.get(name) || name === "aria-labelledby" && madeLabel(current)) {
        continue;
      }
      if (!Object.values(channels).some((wrote) => wrote.get(name) === current)) {
        authors.add(name);
      }
    }
    for (const name of authors) {
      written.delete(name);
    }
    for (const name of previous.keys()) {
      if (written.has(name) || authors.has(name) || name === "id" && keeps) {
        continue;
      }
      if (name.startsWith("style:")) {
        el.style.removeProperty(name.slice(6));
        continue;
      }
      if (!release3) {
        el.removeAttribute(name);
        keepFound(el, channel, name, null);
        continue;
      }
      const current = el.getAttribute(name);
      if (current !== previous.get(name)) {
        continue;
      }
      const original = found.get(el)?.[channel]?.get(name);
      if (original === void 0) {
        el.removeAttribute(name);
      } else if (current !== original) {
        el.setAttribute(name, original);
      }
    }
    for (const [property, value] of styles) {
      if (el.style.getPropertyValue(property) !== value) {
        el.style.setProperty(property, value);
      }
    }
    for (const [name, value] of Object.entries(attrs2)) {
      if (value === void 0 || !written.has(name)) {
        continue;
      }
      const current = name === "id" ? id : read.has(name) ? read.get(name) : el.getAttribute(name);
      if (current !== (previous.get(name) ?? null)) {
        keepFound(el, channel, name, current);
      }
      if (current === value) {
        continue;
      }
      if (name === "value" && isTextField(el) && el.value !== value) {
        el.value = value;
      }
      el.setAttribute(name, value);
    }
    channels[channel] = written;
    applied.set(el, channels);
    if (release3) {
      delete found.get(el)?.[channel];
    }
  }
  function keepFound(el, channel, name, value) {
    const kept = value == null || name === "id" ? void 0 : references.includes(name) ? authoredIds(value) : value;
    if (kept === void 0) {
      return void found.get(el)?.[channel]?.delete(name);
    }
    let channels = found.get(el);
    if (!channels) {
      found.set(el, channels = {});
    }
    ;
    (channels[channel] ??= /* @__PURE__ */ new Map()).set(name, kept);
  }
  var authoredIds = (ids) => ids.split(/\s+/).filter((id) => id && !id.startsWith("ui-sdk-")).join(" ") || void 0;
  function keepsId(id, channels, channel) {
    if (id === null || id === channels[channel]?.get("id")) {
      return false;
    }
    return !id.startsWith("ui-sdk-") || Object.values(channels).some((written) => written.get("id") === id);
  }
  var isTextField = (el) => el.localName === "textarea" || el.localName === "input" && el.type !== "file";
  function styleDeclarations(css2) {
    const declarations = [];
    for (const declaration of css2.split(";")) {
      const index = declaration.indexOf(":");
      if (index > 0) {
        declarations.push([
          declaration.slice(0, index).trim(),
          declaration.slice(index + 1).trim()
        ]);
      }
    }
    return declarations;
  }

  // node_modules/@ui-sdk/core/dist/components/field/field-outside.js
  init_dev_stub();
  var fieldOutsideAttrs = (slot) => ({
    "data-slot": `field-${slot}`
  });
  var fieldOutsideErrorShown = (props) => props.match === true;
  var labelWait = 1e3;
  var checked = /* @__PURE__ */ new WeakSet();
  var labels = (el) => el instanceof HTMLLabelElement ? !!el.control || el.htmlFor !== "" : false;
  var quote = (el) => {
    const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    return text.length > 40 ? `${text.slice(0, 40)}\u2026` : text;
  };
  function watchLabel(el, fix) {
    const observer = new MutationObserver(() => {
      if (labels(el)) {
        done();
      }
    });
    observer.observe(el, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["for"]
    });
    let timer;
    const done = () => {
      observer.disconnect();
      clearTimeout(timer);
    };
    let waits = 0;
    const wait = () => {
      timer = setTimeout(() => {
        if (labels(el)) {
          return done();
        }
        if (!el.isConnected) {
          return ++waits < 10 ? wait() : done();
        }
        done();
        warn(
          `A FieldLabel outside a Field labels nothing ("${quote(el)}"). ${fix}`,
          { component: "field" }
        );
      }, labelWait);
    };
    wait();
  }
  function checkFieldOutside(el, slot, fix = "Put the control inside it, or point its `for` at the control.") {
    if (!dev || !el || checked.has(el) || typeof MutationObserver === "undefined") {
      return;
    }
    checked.add(el);
    if (slot === "control") {
      return checkName(el, "A FieldControl outside a Field", {
        component: "field"
      });
    }
    if (slot === "label" && !labels(el)) {
      watchLabel(el, fix);
    }
  }

  // node_modules/@ui-sdk/core/dist/components/file-input/file-input-api.js
  init_dev_stub();
  init_announce();
  init_env();

  // node_modules/@ui-sdk/core/dist/foundation/forms/files.js
  function parseAccept(accept) {
    if (!accept) {
      return [];
    }
    const list = typeof accept === "string" ? accept.split(",") : accept;
    return list.map((token) => token.trim().toLowerCase()).filter(Boolean);
  }
  var isExtension = (token) => token.startsWith(".");
  var isAny = (token) => token === "*" || token === "*/*";
  var essence = (type) => type.split(";")[0].trim().toLowerCase();
  function matchesType(type, token) {
    if (isAny(token)) {
      return true;
    }
    if (!type) {
      return false;
    }
    if (token.endsWith("/*")) {
      return type.startsWith(token.slice(0, -1));
    }
    return type === token;
  }
  function acceptsFile(file, tokens) {
    if (!tokens.length) {
      return true;
    }
    const name = file.name.toLowerCase();
    const type = essence(file.type);
    return tokens.some(
      (token) => isExtension(token) ? name.endsWith(token) : matchesType(type, token)
    );
  }
  var extensionTypes = {
    ".pdf": ["application/pdf"],
    ".png": ["image/png"],
    ".jpg": ["image/jpeg"],
    ".jpeg": ["image/jpeg"],
    ".gif": ["image/gif"],
    ".webp": ["image/webp"],
    ".svg": ["image/svg+xml"],
    ".txt": ["text/plain"],
    ".md": ["text/markdown", "text/x-markdown"],
    ".csv": ["text/csv", "application/vnd.ms-excel"],
    ".json": ["application/json"],
    ".zip": ["application/zip", "application/x-zip-compressed"],
    ".mp4": ["video/mp4"],
    ".mp3": ["audio/mpeg"]
  };
  function acceptsType(type, tokens) {
    if (!tokens.length) {
      return true;
    }
    const mime = essence(type);
    if (!mime) {
      return void 0;
    }
    const matches = tokens.some(
      (token) => isExtension(token) ? extensionTypes[token]?.includes(mime) : matchesType(mime, token)
    );
    if (matches) {
      return true;
    }
    return tokens.some((token) => isExtension(token) && !extensionTypes[token]) ? void 0 : false;
  }
  function fileLimit(rules2) {
    if (rules2.multiple === false) {
      return Math.min(1, rules2.maxFiles ?? 1);
    }
    return rules2.maxFiles ?? Infinity;
  }
  function validateFiles(files, rules2) {
    const tokens = parseAccept(rules2.accept);
    const limit2 = fileLimit(rules2);
    const accepted = [];
    const rejected = [];
    for (const file of files) {
      const reasons = [];
      if (!acceptsFile(file, tokens)) {
        reasons.push("file-type");
      }
      if (rules2.maxSize !== void 0 && file.size > rules2.maxSize) {
        reasons.push("file-too-large");
      }
      if (rules2.minSize !== void 0 && file.size < rules2.minSize) {
        reasons.push("file-too-small");
      }
      const custom = reasons.length ? void 0 : rules2.validate?.(file);
      if (custom) {
        reasons.push(custom);
      }
      if (!reasons.length && accepted.length >= limit2) {
        reasons.push("too-many-files");
      }
      if (reasons.length) {
        rejected.push({ file, reasons });
      } else {
        accepted.push(file);
      }
    }
    return { accepted, rejected };
  }
  function dragStatus(types, rules2) {
    if (types.length > fileLimit(rules2)) {
      return "reject";
    }
    const tokens = parseAccept(rules2.accept);
    return types.some((type) => acceptsType(type, tokens) === false) ? "reject" : "accept";
  }
  var sizeUnits = [
    "byte",
    "kilobyte",
    "megabyte",
    "gigabyte",
    "terabyte"
  ];
  function formatFileSize(bytes, locale) {
    let value = bytes;
    let unit = 0;
    while (Math.round(value) >= 1e3 && unit < sizeUnits.length - 1) {
      value /= 1e3;
      unit++;
    }
    return new Intl.NumberFormat(locale, {
      style: "unit",
      unit: sizeUnits[unit],
      // The short form of a byte is the word in the singular, like "70 byte".
      unitDisplay: unit ? "short" : "long",
      maximumFractionDigits: value < 10 && unit > 0 ? 1 : 0
    }).format(value);
  }
  var paths = /* @__PURE__ */ new WeakMap();
  function setRelativePath(file, path) {
    paths.set(file, path);
  }
  function relativePath(file) {
    return paths.get(file) || file.webkitRelativePath || file.name;
  }

  // node_modules/@ui-sdk/core/dist/components/file-input/file-input-api.js
  init_events();
  init_store();
  var noFiles = [];
  var noRejections = [];
  function settings(options) {
    const accept = parseAccept(options.accept).join(",");
    return {
      disabled: !!options.disabled,
      required: !!options.required,
      name: options.name,
      form: options.form,
      accept: accept || void 0,
      multiple: !!options.multiple || !!options.directory,
      directory: !!options.directory,
      capture: options.capture || void 0
    };
  }
  var fileKeys = /* @__PURE__ */ new WeakMap();
  var fileCount = 0;
  function fileKey(file) {
    let key = fileKeys.get(file);
    if (!key) {
      fileKeys.set(file, key = `file-${++fileCount}`);
    }
    return key;
  }
  function setInputFiles(input2, files) {
    const current = Array.from(input2.files ?? []);
    if (current.length === files.length && current.every((file, index) => file === files[index])) {
      return;
    }
    if (typeof DataTransfer !== "function") {
      return;
    }
    const transfer = new DataTransfer();
    for (const file of files) {
      transfer.items.add(file);
    }
    input2.files = transfer.files;
  }
  var noFile = () => new File([], "", { type: "application/octet-stream" });
  var plural = (count3) => `${count3} ${count3 === 1 ? "file" : "files"}`;
  function describeChange(details) {
    if (details.reason === "reset") {
      return null;
    }
    const parts = [];
    if (details.added.length) {
      parts.push(`${plural(details.added.length)} accepted.`);
    }
    if (details.rejected.length) {
      parts.push(`${plural(details.rejected.length)} rejected.`);
    }
    if (details.removed.length && !details.added.length) {
      parts.push(
        details.removed.length === 1 ? `${details.removed[0].name} removed.` : `${plural(details.removed.length)} removed.`
      );
    }
    return parts.length ? parts.join(" ") : null;
  }
  function fileInputApiBody(context2) {
    const { id, store, options, element: element2 } = context2;
    const change = createChange(context2);
    const rules2 = () => {
      const { accept, maxFiles, maxSize, minSize, validate } = options();
      const { multiple, value } = store.get();
      const room = maxFiles !== void 0 && multiple ? Math.max(0, maxFiles - value.length) : maxFiles;
      return { accept, multiple, maxFiles: room, maxSize, minSize, validate };
    };
    const keepsFiles = () => {
      const { associated, name, required } = store.get();
      return !associated && (!!name || required);
    };
    const input2 = () => element2("input");
    const formElement = () => {
      const root = element2("root");
      return formInternals(root) ? root : input2();
    };
    let echoing = false;
    function echoChange() {
      const el = formElement();
      if (el && writingFromScript(el)) {
        return;
      }
      queueMicrotask(() => {
        if (!el?.isConnected) {
          return;
        }
        echoing = true;
        el.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        echoing = false;
      });
    }
    function writeInput() {
      const el = input2();
      if (!el) {
        return;
      }
      if (keepsFiles()) {
        setInputFiles(el, store.get().value);
      } else {
        el.value = "";
      }
    }
    function commit2(next, reason, event, {
      added = noFiles,
      removed = noFiles,
      rejected = noRejections
    } = {}) {
      const summary = {
        reason,
        added: [...added],
        removed: [...removed],
        rejected: [...rejected]
      };
      if (dev && options().debug) {
        console.debug(
          `[ui-sdk] file-input#${id} ${added.length} added, ${removed.length} removed, ${rejected.length} rejected (${reason})`
        );
      }
      const differs2 = !sameValue(store.get().value, next);
      const changed = differs2 && change("value", [...next], { event, ...summary });
      if (rejected.length) {
        options().onReject?.(
          summary.rejected,
          createDetails({ reason, event }, changeSource(reason, event), false)
        );
      }
      writeInput();
      if (differs2 && !changed) {
        return false;
      }
      if (changed && reason !== "picker" && reason !== "reset") {
        echoChange();
      }
      const { announcement } = options();
      const message = announcement ? announcement(summary) : describeChange(summary);
      if (message) {
        announce(message);
      }
      return changed;
    }
    function receive(files, reason, event) {
      const state = store.get();
      if (isDisabled(state)) {
        return false;
      }
      const { accepted, rejected } = validateFiles(files, rules2());
      if (!state.multiple && !accepted.length) {
        return commit2(state.value, reason, event, { rejected });
      }
      const current = state.multiple ? state.value : noFiles;
      const added = accepted.filter((file) => !current.includes(file));
      const removed = state.multiple ? noFiles : state.value.filter((file) => !added.includes(file));
      return commit2([...current, ...added], reason, event, {
        added,
        removed,
        rejected
      });
    }
    function remove(file, reason = "imperative", event) {
      const state = store.get();
      if (isDisabled(state) || !state.value.includes(file)) {
        return false;
      }
      return commit2(
        state.value.filter((item) => item !== file),
        reason,
        event,
        { removed: [file] }
      );
    }
    function replace(files, reason, event) {
      const { value } = store.get();
      return commit2(files, reason, event, {
        added: files.filter((file) => !value.includes(file)),
        removed: value.filter((file) => !files.includes(file))
      });
    }
    const items = () => elements(context2, "item");
    function removeItem(file, event) {
      const list = items();
      const index = list.findIndex(({ props }) => props.file === file);
      const hadFocus = list[index]?.el.contains(
        list[index].el.ownerDocument.activeElement
      );
      const neighbour = list[index + 1] ?? list[index - 1];
      if (!remove(file, "remove-press", event) || !hadFocus) {
        return;
      }
      const moveFocus = () => {
        if (store.get().value.includes(file)) {
          return;
        }
        if (neighbour?.el.isConnected) {
          neighbour.el.focus();
        } else {
          element2("trigger")?.focus();
        }
      };
      if (options().value === void 0) {
        moveFocus();
      } else {
        queueMicrotask(moveFocus);
      }
    }
    function itemKeydown(event, el, file) {
      if (event.target !== el || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        return removeItem(file, event);
      }
      const list = items().map((item) => item.el);
      const step = radioStep(event.key, isRTL(el)) ?? (event.key === "Home" ? "first" : event.key === "End" ? "last" : void 0);
      if (step === void 0) {
        return;
      }
      const target = list[moveIndex(list.indexOf(el), step, list.length, false)];
      if (!target) {
        return;
      }
      event.preventDefault();
      target.focus();
    }
    const api = {
      getValue: () => store.get().value,
      setValue: (files, { reason = "imperative", event } = {}) => replace(files, reason, event),
      addFiles(files, { reason = "imperative", event } = {}) {
        return receive(Array.from(files), reason, event);
      },
      removeFile: (file, { reason = "imperative", event } = {}) => remove(file, reason, event),
      clear: ({ reason = "imperative", event } = {}) => api.setValue([], { reason, event }),
      open() {
        const state = store.get();
        if (isDisabled(state)) {
          return false;
        }
        const el = input2();
        if (!el) {
          return false;
        }
        el.click();
        return true;
      },
      focus: () => element2("trigger")?.focus(),
      isDragging: () => Object.keys(store.get().drags).length > 0,
      internal: {
        receive,
        removeItem,
        itemKeydown,
        setActiveItem(key) {
          if (store.get().activeItem !== key) {
            store.set({ activeItem: key });
          }
        },
        setDrag(key, status) {
          const { [key]: current, ...rest } = store.get().drags;
          if (current === (status ?? void 0)) {
            return;
          }
          store.set({ drags: status ? { ...rest, [key]: status } : rest });
        },
        rules: rules2,
        dropzoneProps(key) {
          const props = context2.props("dropzone", key) ?? {};
          return props;
        },
        reset: () => replace(store.get().initial, "reset"),
        setFormDisabled(formDisabled) {
          store.set({ formDisabled });
        },
        bindInput(el) {
          writeInput();
          let written = store.get();
          const cleanups = [
            on(el, "change", (event) => {
              if (!echoing) {
                receive(Array.from(el.files ?? []), "picker", event);
              }
            }),
            // A controlled value, a new name or a removal changes what the input holds.
            store.subscribe(() => {
              const state = store.get();
              if (state.value === written.value && state.name === written.name && state.required === written.required) {
                return;
              }
              written = state;
              writeInput();
            }),
            // The form already emptied the input, so there's nothing to write back.
            associate(el, {
              reset: api.internal.reset,
              disabled: api.internal.setFormDisabled,
              focus: api.focus,
              write: () => {
              }
            })
          ];
          return () => cleanups.forEach((cleanup) => cleanup());
        },
        // Custom elements submit their files through ElementInternals.
        bindRoot(el) {
          if (!formInternals(el)) {
            return () => {
            };
          }
          store.set({ associated: true });
          return bindInternals(el, {
            value: () => {
              const { name, value } = store.get();
              if (!name) {
                return null;
              }
              const data = new FormData();
              for (const file of value.length ? value : [noFile()]) {
                data.append(name, file);
              }
              return data;
            },
            state: () => "",
            // Files can't be restored after going back.
            restore: () => {
            },
            valueMissing: () => store.get().required && !store.get().value.length,
            message: () => valueMissingMessage("file"),
            anchor: () => element2("trigger"),
            focus: api.focus,
            reset: api.internal.reset,
            disabled: api.internal.setFormDisabled,
            subscribe: store.subscribe
          });
        }
      }
    };
    return api;
  }
  var fileInputApi = fileInputApiBody;

  // node_modules/@ui-sdk/core/dist/foundation/forms/form-internals.js
  var callbacksOf = /* @__PURE__ */ new WeakMap();
  var customMessages = /* @__PURE__ */ new WeakMap();
  function formCallback(el, type, ...args) {
    if (type === "customValidity") {
      customMessages.set(el, args[0]);
    }
    const callback = callbacksOf.get(el)?.[type];
    callback?.(...args);
    return !!callback;
  }
  function bindElementInternals(el, internals, options) {
    let reported = "";
    const sync = () => {
      const value = options.value();
      if (value instanceof FormData) {
        internals.setFormValue(value, options.state());
      } else if (Array.isArray(value)) {
        const data = new FormData();
        const name = options.name?.();
        if (name) {
          for (const item of value) {
            data.append(name, item);
          }
        }
        internals.setFormValue(data, options.state());
      } else {
        internals.setFormValue(value, options.state());
      }
      const missing = options.valueMissing();
      const custom = customMessages.get(el);
      const invalid = options.invalid?.();
      if (custom) {
        internals.setValidity(
          { customError: true },
          custom,
          options.anchor?.() ?? el
        );
      } else if (invalid) {
        internals.setValidity(
          invalid.flags,
          invalid.message,
          invalid.anchor ?? options.anchor?.() ?? el
        );
      } else if (missing) {
        internals.setValidity(
          { valueMissing: true },
          options.message(),
          options.anchor?.() ?? el
        );
      } else {
        internals.setValidity({});
      }
      if ((invalid?.message ?? "") === reported) {
        return;
      }
      reported = invalid?.message ?? "";
      validityChanged(el);
    };
    sync();
    const unsubscribe = options.subscribe(sync);
    const unfocus = options.focus ? focusWith(el, options.focus) : () => {
    };
    if (el.matches(":disabled")) {
      options.disabled(true);
    }
    callbacksOf.set(el, {
      reset: () => {
        options.reset();
        sync();
      },
      disabled: (disabled) => options.disabled(disabled),
      restore: (state) => {
        if (typeof state === "string") {
          options.restore(state);
        }
      },
      customValidity: sync
    });
    const unlabel = labelledBy(el, () => labelsOf(el));
    const onInvalid = () => {
      if (options.focus) {
        claimInvalidFocus(el, internals.form);
      }
    };
    el.addEventListener("invalid", onInvalid);
    return () => {
      el.removeEventListener("invalid", onInvalid);
      unsubscribe();
      unlabel();
      callbacksOf.delete(el);
      unfocus();
    };
  }

  // node_modules/@ui-sdk/core/dist/renderer.js
  init_part();
  init_style();

  // node_modules/@ui-sdk/web/dist/action.js
  function waitList() {
    const waiting = [];
    let dispatching = true;
    const waitUntil = (promise) => {
      if (!dispatching) {
        throw new DOMException(
          "waitUntil() can only be called while the event dispatches.",
          "InvalidStateError"
        );
      }
      waiting.push(promise);
    };
    const done = () => {
      dispatching = false;
      return waiting;
    };
    return { waitUntil, done };
  }
  var actionOf = (el) => (_event, details) => {
    const { waitUntil, done } = waitList();
    const proceed = el.dispatchEvent(
      new CustomEvent("action", {
        cancelable: true,
        composed: true,
        detail: { ...details, waitUntil }
      })
    );
    const waiting = done();
    if (!proceed) {
      return canceledAction;
    }
    return waiting.length ? Promise.all(waiting) : void 0;
  };

  // node_modules/@ui-sdk/web/dist/define-element.js
  var autoIds = /* @__PURE__ */ new WeakMap();
  var count2 = 0;
  var claimed = /* @__PURE__ */ new Set();
  function claimTag(tagName) {
    if (typeof customElements === "undefined" || claimed.has(tagName)) {
      return false;
    }
    if (customElements.get(tagName)) {
      warn(
        `<${tagName}> is already defined by another library or another copy of ui-sdk. This one is skipped.`
      );
      return false;
    }
    claimed.add(tagName);
    return true;
  }
  function autoId(el) {
    if (!autoIds.has(el)) {
      autoIds.set(el, `auto-${++count2}`);
    }
    return autoIds.get(el);
  }
  function wrappedButton(el) {
    return el.querySelector(":scope > button, :scope > a") ?? el.firstElementChild;
  }
  var wrappedChild = (selector) => (el) => el.querySelector(`:scope > ${selector}`) ?? el.firstElementChild;
  function boundElement(el, target) {
    if (target) {
      return target(el);
    }
    return el.hasAttribute("as-child") ? el.firstElementChild : el;
  }
  var rekeyed = (previous, next) => previous.id !== next.id || previous.value !== next.value;
  var kebab = (name) => name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
  var semantics = ["role", "aria-disabled"];
  function parseAttribute(type, value) {
    if (value === null) {
      return void 0;
    }
    if (typeof type === "function") {
      return type(value);
    }
    if (type === "boolean") {
      return value !== "false";
    }
    if (type === "number") {
      const number = Number(value);
      return value.trim() === "" || Number.isNaN(number) ? void 0 : number;
    }
    if (type === "list") {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
    return value;
  }
  var presence = /* @__PURE__ */ new Set(["disabled", "required"]);
  function readAttribute(el, name, type) {
    const value = el.getAttribute(kebab(name));
    if (type === "boolean" && presence.has(name)) {
      return value === null ? void 0 : true;
    }
    return parseAttribute(type, value);
  }
  function readAttributes(el, schema) {
    const result = {};
    for (const [name, type] of Object.entries(schema)) {
      const value = readAttribute(el, name, type);
      if (value !== void 0) {
        result[name] = value;
      }
    }
    return result;
  }
  var defaultOn = (el, value) => typeof value === "function" ? value(el) : value;
  function reflectAttributes(proto, schema, defaults = {}) {
    for (const [name, type] of Object.entries(schema)) {
      if (name in proto) {
        continue;
      }
      const attribute = kebab(name);
      Object.defineProperty(proto, name, {
        configurable: true,
        get() {
          return readAttribute(this, name, type) ?? defaultOn(this, defaults[name]) ?? (type === "boolean" ? false : void 0);
        },
        set(value) {
          const removes = value === false && type === "boolean" && !defaultOn(this, defaults[name]);
          if (value == null || removes) {
            this.removeAttribute(attribute);
          } else {
            this.setAttribute(
              attribute,
              value === true ? "" : Array.isArray(value) ? value.join(",") : String(value)
            );
          }
        }
      });
    }
  }
  function upgradeProperties(el, names) {
    for (const name of names) {
      if (!Object.prototype.hasOwnProperty.call(el, name)) {
        continue;
      }
      const value = el[name];
      delete el[name];
      el[name] = value;
    }
  }
  var quiet = /* @__PURE__ */ new Set();
  function restoreQuietly(el, state, mode) {
    quiet.add(el);
    try {
      return formCallback(el, "restore", state, mode);
    } finally {
      quiet.delete(el);
    }
  }
  var pendingRestores = /* @__PURE__ */ new Map();
  function wroteFromScript(el) {
    for (const waiting of pendingRestores.keys()) {
      if (waiting.contains(el)) {
        pendingRestores.delete(waiting);
      }
    }
  }
  function restoreOnceBound(el, state, mode) {
    const token = {};
    pendingRestores.set(el, token);
    queueMicrotask(() => {
      if (pendingRestores.get(el) !== token) {
        return;
      }
      pendingRestores.delete(el);
      restoreQuietly(el, state, mode);
    });
  }
  function quietNow(el) {
    const owner4 = partOwners.get(el);
    if (quiet.has(el) || !!owner4 && quiet.has(owner4)) {
      return true;
    }
    for (const inside of quiet) {
      if (el.contains(inside)) {
        return true;
      }
    }
    return false;
  }
  function detailsOnly(value, details) {
    return details === void 0 && !!value && typeof value === "object" && "reason" in value && !(typeof Event !== "undefined" && value instanceof Event);
  }
  function withEvents(el, target, silent = [], actions = [], names = {}) {
    return new Proxy(target, {
      get(target2, key) {
        if (key in target2 || typeof key !== "string" || !/^on[A-Z]/.test(key)) {
          return target2[key];
        }
        if (silent.includes(key)) {
          return void 0;
        }
        return (value, details) => {
          if (quietNow(el)) {
            return;
          }
          const only = detailsOnly(value, details);
          const { cancel, canceled, ...rest } = (only ? value : details) ?? {};
          const detail = only ? rest : { ...rest, value };
          const wait = actions.includes(key) ? waitList() : void 0;
          if (wait) {
            detail.waitUntil = wait.waitUntil;
          }
          const event = new CustomEvent(
            names[key] ?? key.slice(2).toLowerCase(),
            {
              detail,
              bubbles: false,
              // Only a change with details or an event to cancel is cancelable.
              cancelable: typeof cancel === "function" || typeof value?.preventDefault === "function",
              composed: true
            }
          );
          const proceed = el.dispatchEvent(event);
          const waiting = wait?.done() ?? [];
          if (!proceed) {
            if (typeof cancel === "function") {
              cancel();
            } else if (value && typeof value.preventDefault === "function") {
              ;
              value.preventDefault();
            }
          }
          return waiting.length > 1 ? Promise.all(waiting).then((values) => values.at(-1)) : waiting[0];
        };
      }
    });
  }
  var instances = /* @__PURE__ */ new WeakMap();
  function instanceOf(el) {
    return el ? instances.get(el) : void 0;
  }
  var reads = /^(?:get|is|can)[A-Z]|^focus$/;
  function controllerView(el, api, methods) {
    const view2 = {};
    for (const name of methods) {
      const method = api[name];
      if (typeof method === "function") {
        view2[name] = (...args) => {
          if (!reads.test(name)) {
            wroteFromScript(el);
          }
          return method.apply(api, args);
        };
      }
    }
    return Object.freeze(view2);
  }
  var display = /* @__PURE__ */ new Map();
  var aligned = /* @__PURE__ */ new Set();
  var styleId;
  function documentStyle() {
    if (styleId) {
      return styleId;
    }
    const copies = globalThis;
    const key = /* @__PURE__ */ Symbol.for("ui-sdk.web-styles@1");
    copies[key] = (copies[key] ?? 0) + 1;
    return styleId = `ui-sdk-web-${copies[key]}`;
  }
  var css = "";
  var rulesVersion = 0;
  var constructed = /* @__PURE__ */ new WeakMap();
  function setDisplay(selector, value, align = false) {
    if (align) {
      aligned.add(selector);
    }
    if (!value && !align) {
      return;
    }
    if (value) {
      display.set(selector, value);
    }
    css = rules();
    writeStyle(document, documentStyle(), css);
    rulesVersion++;
  }
  function rules() {
    return [
      "@layer ui-sdk {",
      // Parts that aren't shown stay hidden whatever display a class gives them.
      '  :where([data-slot][hidden]:not([hidden="until-found"])) { display: none !important }',
      // Content hidden until found is only hidden inside a box, so those keep theirs.
      ...[...display].map(
        ([selector, value]) => `  :where(${selector}:not([hidden]), ${selector}[hidden="until-found"]) { display: ${value} }`
      ),
      ...[...aligned].map(
        (tag) => `  :where(${tag}[align]) { text-align: inherit }`
      ),
      // A part with as-child hands its role to its child, so it has no box of its own.
      "  :where([as-child]) { display: contents }",
      "}"
    ].join("\n");
  }
  function adoptStyles(el) {
    const root = el.getRootNode();
    if (!isShadowRoot(root)) {
      return copyStyles(el.ownerDocument);
    }
    const shared = sharedSheet(root.ownerDocument);
    if (!shared || root.adoptedStyleSheets.includes(shared)) {
      return;
    }
    root.adoptedStyleSheets = [shared, ...root.adoptedStyleSheets];
  }
  var isShadowRoot = (node) => node.nodeType === 11 && "host" in node;
  function sharedSheet(doc) {
    const view2 = doc.defaultView;
    if (!view2) {
      return;
    }
    let entry = constructed.get(doc);
    if (!entry) {
      constructed.set(
        doc,
        entry = { sheet: new view2.CSSStyleSheet(), version: -1 }
      );
    }
    if (entry.version !== rulesVersion) {
      entry.sheet.replaceSync(rules());
      entry.version = rulesVersion;
    }
    return entry.sheet;
  }
  function copyStyles(doc) {
    if (css) {
      writeStyle(doc, documentStyle(), css);
    }
  }
  var dependents = /* @__PURE__ */ new Set();
  function reconfigureInside(el) {
    for (const dependent of dependents) {
      if (dependent !== el && el.contains(dependent)) {
        dependent.reconfigure();
      }
    }
  }
  var portals = /* @__PURE__ */ new WeakMap();
  var partOwners = /* @__PURE__ */ new WeakMap();
  var slotParts = /* @__PURE__ */ new WeakMap();
  function innerPart(part, owner4) {
    for (let node = part.el; node && node !== owner4; node = node.parentElement) {
      const other = slotParts.get(node);
      if (other === part) {
        return;
      }
      if (other?.el === part.el && registered.has(other)) {
        return other;
      }
    }
  }
  function handOver(part) {
    part.dataSlot = void 0;
    const sharing = [];
    for (let node = part.el; node; node = node.parentElement) {
      const other = slotParts.get(node);
      if (other && other !== part && other.el === part.el && registered.has(other)) {
        sharing.push(other);
      }
    }
    if (!sharing.length) {
      return;
    }
    part.el.removeAttribute("data-slot");
    markAuthored(part.el, "data-slot");
    for (const other of sharing) {
      other.sync?.();
    }
  }
  var registered = /* @__PURE__ */ new WeakSet();
  var findOwnerAgain = /* @__PURE__ */ new WeakMap();
  var hasRichValue = (props) => props.value !== void 0 && typeof props.value !== "string";
  function propsAround(el, slot, owner4) {
    for (let node = el.parentElement; node; node = node.parentElement) {
      const part = slotParts.get(node);
      if (part?.slot !== slot || partOwners.get(node) !== owner4) {
        continue;
      }
      return part.keyed && hasRichValue(part.props) ? { ...part.props, value: part.props.id } : part.props;
    }
  }
  function findOwner(el, selector) {
    const target = el.getAttribute("for");
    if (target) {
      const root = el.getRootNode();
      const owner4 = "getElementById" in root ? root.getElementById(target) : null;
      if (owner4?.matches(selector)) {
        return owner4;
      }
    }
    for (let node = el.parentElement; node; node = node.parentElement) {
      if (node.matches(selector)) {
        return node;
      }
      const owner4 = partOwners.get(node);
      if (owner4?.matches(selector)) {
        return owner4;
      }
    }
  }
  function whenGone(el, run) {
    queueMicrotask(() => {
      if (!el.isConnected) {
        run();
      }
    });
  }
  var formStates = /* @__PURE__ */ new WeakMap();
  var bindInternals2 = (el, internals, options) => {
    formStates.set(el, options.state);
    return bindElementInternals(el, internals, options);
  };
  function formAssociated(Base) {
    return class extends Base {
      static formAssociated = true;
      #internals;
      constructor() {
        super();
        this.#internals = this.attachInternals();
        attachFormInternals(this, this.#internals, bindInternals2);
      }
      get form() {
        return this.#internals.form;
      }
      get labels() {
        return this.#internals.labels;
      }
      get name() {
        return this.getAttribute("name") ?? "";
      }
      set name(value) {
        this.setAttribute("name", value);
      }
      get validity() {
        return this.#internals.validity;
      }
      get validationMessage() {
        return this.#internals.validationMessage;
      }
      get willValidate() {
        return this.#internals.willValidate;
      }
      checkValidity() {
        return this.#internals.checkValidity();
      }
      reportValidity() {
        return this.#internals.reportValidity();
      }
      setCustomValidity(message) {
        if (!formCallback(this, "customValidity", message)) {
          this.#internals.setValidity(
            message ? { customError: true } : {},
            message
          );
        }
      }
      formResetCallback() {
        pendingRestores.delete(this);
        formCallback(this, "reset");
      }
      formDisabledCallback(disabled) {
        formCallback(this, "disabled", disabled);
      }
      formStateRestoreCallback(state, mode) {
        pendingRestores.delete(this);
        if (!restoreQuietly(this, state, mode)) {
          restoreOnceBound(this, state, mode);
        }
      }
    };
  }
  var defaultOf = (name) => `default${name[0].toUpperCase()}${name.slice(1)}`;
  function defineRootElement(tagName, primitive, config) {
    if (!claimTag(tagName)) {
      return;
    }
    setDisplay(tagName, config.display);
    const schema = {
      debug: "boolean",
      ...config.attributes
    };
    const state = config.state ?? {};
    const optionsOf = (el, properties, rendered) => {
      const options = readAttributes(el, schema);
      for (const name of rendered) {
        delete options[name];
      }
      for (const [name, value] of Object.entries(properties)) {
        if (value !== void 0) {
          options[name] = value;
        }
      }
      for (const name of Object.keys(state)) {
        if (!(name in options)) {
          continue;
        }
        const fallback = defaultOf(name);
        if (!(fallback in options)) {
          options[fallback] = options[name];
        }
        delete options[name];
      }
      return { ...options, ...config.options?.(el) };
    };
    customElements.define(
      tagName,
      class Owner extends (config.formAssociated ? formAssociated(HTMLElement) : HTMLElement) {
        static observedAttributes = [
          ...Object.keys(schema).map(kebab),
          ...semantics
        ];
        #view;
        get #instance() {
          return instances.get(this);
        }
        // The controller's methods. Internals stay out of reach.
        get api() {
          if (!this.#instance) {
            return void 0;
          }
          return this.#view ??= controllerView(
            this,
            this.#instance.api,
            config.api ?? []
          );
        }
        #parts = /* @__PURE__ */ new Set();
        #pending = /* @__PURE__ */ new Set();
        #connected = false;
        #rendering = false;
        #rendered = /* @__PURE__ */ new Set();
        #applying = /* @__PURE__ */ new Set();
        #stale = /* @__PURE__ */ new Set();
        // Left the page and destroyed its instance, which a reconnect replaces.
        #gone = false;
        #properties = {};
        // State properties set while there's no live instance, like before the
        // element connects, where the next instance starts.
        #state = {};
        // What a form-associated element reported to its form when it left,
        // which it restores when it's back.
        #saved;
        static {
          for (const [name, { get, set }] of Object.entries(state)) {
            Object.defineProperty(Owner.prototype, name, {
              get() {
                if (name in this.#state) {
                  return this.#state[name];
                }
                return this.#instance ? get(this.#instance.api) : void 0;
              },
              set(value) {
                wroteFromScript(this);
                if (this.#instance && !this.#gone) {
                  this.#quietly(() => set(this.#instance.api, value));
                } else {
                  this.#state[name] = value;
                }
              }
            });
          }
          for (const name of config.properties ?? []) {
            Object.defineProperty(Owner.prototype, name, {
              get() {
                return this.#properties[name];
              },
              set(value) {
                if (Object.is(this.#properties[name], value)) {
                  return;
                }
                this.#properties[name] = value;
                if (!this.#connected) {
                  return;
                }
                this.#configure();
                this.#render();
              }
            });
          }
          reflectAttributes(
            Owner.prototype,
            schema,
            config.defaults
          );
        }
        // Options come from attributes and properties, with `defaults` over them.
        // Re-read them into the instance.
        #configure(defaults) {
          this.#instance?.setOptions(
            withEvents(
              this,
              {
                ...optionsOf(this, this.#properties, this.#rendered),
                ...defaults,
                id: this.#instance.id
              },
              config.silent,
              config.actions,
              config.events
            )
          );
        }
        attributeChangedCallback(name, previous, value) {
          markAuthored(this, name);
          if (semantics.includes(name)) {
            return;
          }
          const key = name.replace(
            /-(\w)/g,
            (_, char) => char.toUpperCase()
          );
          if (key in state && value !== previous && !this.#rendering) {
            wroteFromScript(this);
          }
          if (!this.#rendering || value === null) {
            this.#rendered.delete(key);
          } else if (previous === null) {
            this.#rendered.add(key);
          }
          if (!this.#connected) {
            return;
          }
          this.#configure();
          reconfigureInside(this);
          if (!(key in state) || value === previous) {
            return;
          }
          const type = schema[key];
          const cleared = type === "boolean" ? false : type === "list" ? [] : null;
          this.#quietly(
            () => state[key].set(
              this.#instance.api,
              value === null ? cleared : parseAttribute(type, value)
            )
          );
        }
        // State set from script commits without events, like a native input's
        // `value`, so a page that renders the state back never hears its own write.
        #quietly(write) {
          const nested = quiet.has(this);
          quiet.add(this);
          try {
            writeFromScript(this, write);
          } finally {
            if (!nested) {
              quiet.delete(this);
              validityChanged(this);
            }
          }
        }
        connectedCallback() {
          adoptStyles(this);
          if (this.#connected) {
            for (const part of this.#parts) {
              elementMoved(part.el);
            }
            if (config.options) {
              this.#configure();
            }
            return;
          }
          upgradeProperties(this, [
            ...Object.keys(state),
            ...config.properties ?? [],
            ...Object.keys(schema)
          ]);
          for (const [name, value] of Object.entries(config.host ?? {})) {
            if (!this.hasAttribute(name)) {
              this.setAttribute(name, value);
            }
          }
          const restore = this.#gone && !Object.keys(this.#state).length ? this.#saved : void 0;
          const starts = {};
          if (this.#gone && restore === void 0) {
            for (const [name, { get }] of Object.entries(state)) {
              starts[name] = get(this.#instance.api);
            }
          }
          Object.assign(starts, this.#state);
          this.#state = {};
          const last = Object.fromEntries(
            Object.entries(starts).map(([name, value]) => [
              defaultOf(name),
              value
            ])
          );
          if (this.#gone) {
            instances.delete(this);
            this.#view = void 0;
            this.#gone = false;
            this.#saved = void 0;
          }
          let instance = this.#instance;
          if (instance) {
            this.#configure();
          } else {
            instance = primitive(
              withEvents(
                this,
                {
                  ...optionsOf(this, this.#properties, this.#rendered),
                  ...last,
                  id: this.id || `ui-sdk-${tagName.replace(/^ui-/, "")}-${++count2}`
                },
                config.silent,
                config.actions,
                config.events
              )
            );
            instances.set(this, instance);
          }
          if (config.formAssociated && Object.keys(starts).length) {
            const base = instance.startState(
              optionsOf(this, this.#properties, this.#rendered)
            );
            this.#configure(
              Object.fromEntries(
                Object.keys(starts).map((name) => [defaultOf(name), base[name]])
              )
            );
          }
          this.#connected = true;
          if (config.options) {
            dependents.add(this);
          }
          if (config.self) {
            const el = boundElement(this, config.target);
            if (el) {
              this.#registerSelf(el);
            } else {
              warn(`<${tagName}> needs an element inside it.`);
            }
          }
          for (const [slot, find] of Object.entries(config.children ?? {})) {
            const child = find(this);
            if (child) {
              this.#registerChild(slot, child);
            } else if (!config.optionalChildren?.includes(slot)) {
              warn(
                `<${tagName}> needs its native element inside it for "${slot}".`
              );
            }
          }
          if (config.children || config.target) {
            this.#childObserver = new MutationObserver(() => {
              this.#syncChildren();
              this.#syncSelf();
            });
            this.#childObserver.observe(this, { childList: true });
          }
          this.#render();
          if (this.id) {
            const root = this.getRootNode();
            for (const el of root.querySelectorAll(
              `[for="${CSS.escape(this.id)}"]`
            )) {
              findOwnerAgain.get(el)?.();
            }
          }
          if (restore !== void 0) {
            restoreOnceBound(this, restore, "restore");
          }
        }
        #renderCleanup;
        // Runs only while connected, when the instance exists.
        #render() {
          this.#renderCleanup?.();
          this.#renderCleanup = config.render?.(this, this.#instance) || void 0;
        }
        reconfigure() {
          if (this.#connected) {
            this.#configure();
          }
        }
        #childParts = /* @__PURE__ */ new Map();
        #childObserver;
        #selfPart;
        #registerSelf(el) {
          this.#selfPart = { slot: config.self, el, props: {} };
          this.register(this.#selfPart);
        }
        // The element the own slot binds was replaced: the new one binds instead.
        #syncSelf() {
          if (!config.self || !config.target) {
            return;
          }
          const el = boundElement(this, config.target);
          if (el === this.#selfPart?.el) {
            return;
          }
          if (this.#selfPart) {
            this.unregister(this.#selfPart);
          }
          this.#selfPart = void 0;
          this.#configure();
          if (el) {
            this.#registerSelf(el);
          }
        }
        #registerChild(slot, el) {
          const part = {
            slot,
            el,
            props: config.childProps?.read?.(el) ?? {}
          };
          if (config.childProps) {
            part.observer = new MutationObserver(() => {
              part.props = config.childProps.read?.(el) ?? {};
              this.#configure();
              this.update(part, false);
            });
            part.observer.observe(el, {
              attributeFilter: config.childProps.attributes
            });
          }
          this.#childParts.set(slot, part);
          this.register(part);
        }
        #syncChildren() {
          for (const [slot, find] of Object.entries(config.children ?? {})) {
            const child = find(this);
            const current = this.#childParts.get(slot);
            if (current?.el === child) {
              continue;
            }
            if (current) {
              this.unregister(current);
              this.#childParts.delete(slot);
            }
            if (child) {
              this.#registerChild(slot, child);
            }
          }
        }
        disconnectedCallback() {
          whenGone(this, () => {
            this.#saved = formStates.get(this)?.();
            this.#renderCleanup?.();
            this.#renderCleanup = void 0;
            this.#childObserver?.disconnect();
            this.#childObserver = void 0;
            this.#childParts.clear();
            this.#selfPart = void 0;
            this.#connected = false;
            dependents.delete(this);
            for (const part of this.#parts) {
              this.unregister(part);
            }
            this.#instance?.destroy();
            this.#gone = true;
          });
        }
        // Parts register as they upgrade, in no useful order. They sync together a
        // microtask later in DOM order, so a trigger binds before an open popup.
        register(part) {
          this.#parts.add(part);
          registered.add(part);
          part.sync = () => this.#pending.has(part) || this.#sync(part);
          if (!this.#pending.size) {
            queueMicrotask(() => this.#flush());
          }
          this.#pending.add(part);
        }
        #flush() {
          const parts = inDocumentOrder([...this.#pending]);
          this.#pending.clear();
          for (const part of parts) {
            if (!this.#parts.has(part)) {
              continue;
            }
            if (part.reread) {
              part.props = part.reread();
            }
            if (part.feature) {
              this.#instance.use(part.feature);
            }
            this.#watch(part);
            this.#sync(part);
          }
        }
        // Syncs a part again when a change can affect it, so a highlight change
        // reaches the two items it moves between, not every part. Live state is
        // written by the core, so only changes to state that affects rendering
        // apply attributes again. A part that selects on a live key, like an
        // item on the highlight, hears that key alone, and has nothing to apply.
        #watch(part) {
          const instance = this.#instance;
          part.unwatch?.();
          const record = instance.part(part.slot, part.props);
          part.record = record;
          part.selected = selectedKeys(record);
          part.version = renderVersion(instance);
          part.unwatch = subscribe(record, (liveOnly) => {
            if (present(record) !== part.shown) {
              part.version = renderVersion(instance);
              return this.#sync(part);
            }
            if (liveOnly) {
              return;
            }
            const version = renderVersion(instance);
            if (version === part.version) {
              return;
            }
            part.version = version;
            this.#sync(part);
          });
        }
        unregister(part) {
          part.unwatch?.();
          part.unwatch = void 0;
          part.observer?.disconnect();
          part.observer = void 0;
          this.#unbind(part);
          releaseAttrs(part.el, this.#channel);
          part.disconnect?.();
          part.disconnect = void 0;
          this.#restore(part);
          this.#parts.delete(part);
          registered.delete(part);
          this.#pending.delete(part);
          handOver(part);
        }
        // Binds every bound part again, in DOM order, for what they found when
        // they bound, like the menubar a menu joins, which may upgrade later.
        rebind() {
          const parts = inDocumentOrder(
            [...this.#parts].filter((part) => !this.#pending.has(part))
          );
          for (const part of parts) {
            this.#unbind(part);
          }
          for (const part of parts) {
            this.#sync(part);
          }
        }
        // Props changed. A new key needs a new binding. Other parts can depend on
        // this one's props, like radio items on their group's value, or on its
        // attributes, like toolbar items on their group's `disabled`, so they
        // read their props again and sync too.
        update(part, rebind) {
          if (this.#pending.has(part)) {
            return;
          }
          this.#rewatch(part, rebind);
          this.#sync(part);
          for (const other of this.#parts) {
            if (other === part || this.#pending.has(other)) {
              continue;
            }
            if (other.reread) {
              const previous = other.props;
              other.props = other.reread();
              this.#rewatch(other, rekeyed(previous, other.props));
            }
            this.#sync(other);
          }
          reconfigureInside(part.el);
        }
        #rewatch(part, rebind) {
          if (rebind) {
            this.#unbind(part);
          }
          const record = this.#instance.part(part.slot, part.props);
          if (record !== part.record || selectedKeys(record) !== part.selected) {
            this.#watch(part);
          }
        }
        #sync(part) {
          if (this.#applying.has(part)) {
            return void this.#stale.add(part);
          }
          adoptStyles(part.el);
          const instance = this.#instance;
          const record = instance.part(part.slot, part.props);
          part.disconnect ??= connect(record, part.el);
          part.shown = present(record);
          if (part.shown) {
            const target = this.#portalTarget(part);
            if (target !== void 0 && this.#moves(part, target)) {
              this.#unbind(part);
              this.#move(part, target);
            }
            const attrs2 = attrs(record);
            if (attrs2.hidden === void 0 && (conditional(record) || "hidden" in attrs2)) {
              part.el.removeAttribute("hidden");
            }
            this.#apply(part, attrs2);
            if (!part.unbind) {
              this.#bind(part, record);
            }
          } else {
            if (part.unbind) {
              this.#apply(part, attrs(record));
              this.#unbind(part);
            }
            if (!part.el.hasAttribute("hidden")) {
              part.el.setAttribute("hidden", "");
            }
            const slot = attrs(record)["data-slot"];
            if (slot && !part.el.hasAttribute("data-slot")) {
              part.el.setAttribute("data-slot", slot);
            }
            this.#restore(part);
          }
        }
        // Binding and unbinding can change state, which syncs parts again. The part
        // counts as bound from the start, so a nested sync never binds it twice,
        // and as unbound from the start, so it never unbinds twice.
        #bind(part, record) {
          let cleanup;
          let unbound = false;
          part.unbind = () => {
            unbound = true;
            cleanup?.();
          };
          cleanup = bind(record, part.el);
          if (unbound) {
            cleanup();
          }
        }
        #unbind(part) {
          const unbind = part.unbind;
          part.unbind = void 0;
          unbind?.();
        }
        // Where a portaled slot's part belongs: a container, or null for in
        // place. Undefined for slots that never move.
        #portalTarget(part) {
          if (!config.portal?.slots.includes(part.slot)) {
            return void 0;
          }
          return portalTarget(config.portal.container(this, part));
        }
        #moves(part, target) {
          return target ? part.el.parentNode !== target : !!part.placeholder;
        }
        // Moves a part into its container, or back in place for null.
        #move(part, target) {
          this.#restore(part);
          if (!target) {
            return;
          }
          part.placeholder = document.createComment(`${tagName} ${part.slot}`);
          part.el.replaceWith(part.placeholder);
          target.appendChild(part.el);
          portals.set(part.el, target);
        }
        // An attribute the owner writes on itself is state, not an option, like a
        // grouped checkbox's `disabled` from its group, so it never disables it for good.
        #apply(part, attrs2) {
          const inner = innerPart(part, this);
          if (inner?.dataSlot) {
            attrs2 = { ...attrs2, "data-slot": inner.dataSlot };
          }
          part.dataSlot = attrs2["data-slot"];
          const rendering = this.#rendering;
          this.#rendering = part.el === this;
          this.#applying.add(part);
          try {
            applyAttrs(part.el, attrs2, this.#channel);
          } finally {
            this.#rendering = rendering;
            this.#applying.delete(part);
          }
          if (this.#stale.delete(part)) {
            this.#sync(part);
          }
        }
        // What the owner writes on its parts' elements. By host, not instance, so
        // one put back on the page replaces what its last instance wrote, like its parts' ids.
        get #channel() {
          return `render:${autoId(this)}`;
        }
        #restore(part) {
          if (!part.placeholder) {
            return;
          }
          part.placeholder.replaceWith(part.el);
          part.placeholder = void 0;
          portals.delete(part.el);
        }
      }
    );
  }
  function definePartElement(tagName, config) {
    if (!claimTag(tagName)) {
      return;
    }
    const schema = config.props ?? {};
    setDisplay(tagName, config.display, "align" in schema);
    customElements.define(
      tagName,
      class PartElement extends (config.formAssociated ? formAssociated(HTMLElement) : HTMLElement) {
        static observedAttributes = [
          ...Object.keys(schema).map(kebab),
          "for",
          ...semantics
        ];
        #owner;
        #part;
        #properties = {};
        constructor() {
          super();
          findOwnerAgain.set(this, () => {
            if (this.isConnected) {
              this.connectedCallback();
            }
          });
        }
        static {
          for (const name of config.properties ?? []) {
            Object.defineProperty(PartElement.prototype, name, {
              get() {
                return this.#properties[name] ?? (schema[name] && readAttribute(this, name, schema[name]));
              },
              set(value) {
                this.#properties[name] = value;
                this.attributeChangedCallback("");
              }
            });
          }
          reflectAttributes(PartElement.prototype, schema, config.defaults);
        }
        // What the element says itself, its attributes and properties, wins
        // over what its surroundings give it.
        #props() {
          const props = {
            ...config.context?.(this),
            ...readAttributes(this, schema)
          };
          for (const name of config.properties ?? []) {
            if (this.#properties[name] !== void 0) {
              props[name] = this.#properties[name];
            }
          }
          for (const [name, { slot, prop }] of Object.entries(
            config.from ?? {}
          )) {
            props[name] ??= propsAround(this, slot, this.#owner)?.[prop];
          }
          for (const name of config.ids ?? []) {
            props[name] ??= autoId(this);
          }
          if (props.value === void 0 && props.id === void 0) {
            props.id = autoId(this);
          }
          if (config.keyed && hasRichValue(props)) {
            props.id ??= instanceOf(this.#owner)?.api.internal.keyOf(
              props.value
            );
          }
          return withEvents(this, props, [], config.actions);
        }
        // Watches the children for the element the part binds, which can come
        // later or be replaced, like a framework's conditional content.
        #children;
        connectedCallback() {
          upgradeProperties(this, [
            ...config.properties ?? [],
            ...Object.keys(schema)
          ]);
          adoptStyles(this);
          if ((config.target || this.hasAttribute("as-child")) && !this.#children) {
            this.#children = new MutationObserver(() => this.#retarget());
            this.#children.observe(this, { childList: true });
          }
          const owner4 = findOwner(this, config.owner) ?? this.#owner;
          if (!owner4) {
            return queueMicrotask(() => this.#findOwnerLater());
          }
          if (!("register" in owner4)) {
            customElements.whenDefined(owner4.localName).then(() => this.isConnected && this.connectedCallback());
            return;
          }
          if (owner4 === this.#owner && this.#part && registered.has(this.#part)) {
            return;
          }
          if (this.#owner && this.#part) {
            this.#owner.unregister(this.#part);
          }
          const el = boundElement(this, config.target);
          if (!el) {
            return queueMicrotask(() => {
              if (this.isConnected && !this.#part && !boundElement(this, config.target)) {
                warn(`<${tagName}> needs an element inside it.`);
              }
            });
          }
          if (!this.#part) {
            config.render?.(this);
            if (this.#part) {
              return;
            }
          }
          this.#owner = owner4;
          this.#part = {
            slot: config.slot,
            feature: config.feature,
            el,
            props: this.#props(),
            reread: (config.context || config.from) && (() => this.#props()),
            keyed: config.keyed
          };
          partOwners.set(this, owner4);
          slotParts.set(this, this.#part);
          owner4.register(this.#part);
        }
        // Put back on the page, a part can connect before what leads to its owner
        // does, like an item in a list its owner renders again. Warned only when
        // the owner is still missing once the task's other elements connected.
        #findOwnerLater() {
          if (!this.isConnected || this.#owner) {
            return;
          }
          if (findOwner(this, config.owner)) {
            this.connectedCallback();
          } else if (config.alone) {
            config.alone(boundElement(this, config.target) ?? this, this);
          } else if (!this.hasAttribute("for")) {
            warn(`<${tagName}> must be inside ${config.owner}.`);
          }
        }
        // The element the part binds came, left or was replaced: the part lets go
        // of the old one and registers again with what's there now. One the owner
        // moved into a portal, like an input a sheet puts in its header, stays bound.
        #retarget() {
          const old = this.#part?.el;
          if (!this.isConnected || old && portals.has(old)) {
            return;
          }
          const el = boundElement(this, config.target);
          if (el === (old ?? null)) {
            return;
          }
          if (this.#owner && this.#part) {
            this.#owner.unregister(this.#part);
          }
          this.#owner = void 0;
          this.#part = void 0;
          if (el) {
            this.connectedCallback();
          }
        }
        disconnectedCallback() {
          whenGone(this, () => {
            this.#children?.disconnect();
            this.#children = void 0;
            if (this.#owner && this.#part) {
              this.#owner.unregister(this.#part);
            }
            partOwners.delete(this);
            slotParts.delete(this);
            this.#owner = void 0;
            this.#part = void 0;
          });
        }
        attributeChangedCallback(name) {
          markAuthored(this, name);
          if (semantics.includes(name)) {
            return;
          }
          if (name === "for") {
            if (!this.isConnected) {
              return;
            }
            if (!findOwner(this, config.owner) && this.#owner && this.#part) {
              this.#owner.unregister(this.#part);
              this.#owner = void 0;
              partOwners.delete(this);
            }
            this.connectedCallback();
            return;
          }
          if (!this.#owner || !this.#part) {
            if (config.alone && this.isConnected && !findOwner(this, config.owner)) {
              config.alone(boundElement(this, config.target) ?? this, this);
            }
            return;
          }
          const previous = this.#part.props;
          this.#part.props = this.#props();
          const next = this.#part.props;
          const rebind = rekeyed(previous, next) || !!config.rebind?.some((name2) => previous[name2] !== next[name2]);
          this.#owner.update(this.#part, rebind);
          config.changed?.(this);
        }
      }
    );
  }
  var rootTags = /* @__PURE__ */ new WeakMap();
  function elementProps(props, schema, kinds = {}) {
    const attributes = {};
    const properties = [];
    const ids = [];
    const actions = [];
    let keyed = false;
    const from = {};
    for (const [name, spec] of Object.entries({ ...props, ...kinds })) {
      if (!spec) {
        continue;
      }
      if (typeof spec === "object") {
        const [slot, prop = name] = spec.from.split(".");
        if (slot in schema.slots) {
          from[name] = { slot, prop };
        }
        if (!(name in kinds)) {
          continue;
        }
      }
      const kind = typeof spec === "object" ? spec.kind : spec;
      if (kind === "value") {
        properties.push(name);
      } else if (kind === "action") {
        actions.push(name);
      } else if (kind === "id") {
        ids.push(name);
      } else if (kind === "key") {
        keyed = true;
      }
      if (kind === "value" || kind === "action" || kind === "callback") {
        continue;
      }
      if (name !== "id" || name in kinds) {
        attributes[name] = kind === "id" || kind === "key" ? "string" : kind;
      }
    }
    return {
      attributes,
      properties,
      ids,
      actions,
      keyed,
      from: Object.keys(from).length ? from : void 0
    };
  }
  var tagOf = (tagOrOptions) => typeof tagOrOptions === "string" ? { tag: tagOrOptions } : tagOrOptions;
  function partElement(primitive, key, tagOrOptions, root) {
    const schema = schemaOf(primitive);
    if (key === "root") {
      const {
        tag: tag2,
        self,
        kinds: kinds2,
        properties: properties2 = [],
        ...options2
      } = tagOf(tagOrOptions);
      rootTags.set(primitive, [
        .../* @__PURE__ */ new Set([...rootTags.get(primitive) ?? [], tag2])
      ]);
      const { debug: _debug, ...optionSchema } = schema.options;
      const props2 = elementProps(optionSchema, schema, kinds2);
      const config2 = {
        ...options2,
        self: self ?? ("root" in schema.slots && !options2.children?.root ? "root" : void 0),
        attributes: props2.attributes,
        // Live state has its own property.
        properties: [.../* @__PURE__ */ new Set([...props2.properties, ...properties2])].filter(
          (name) => !options2.state?.[name]
        ),
        actions: props2.actions
      };
      return { kind: "owner", key, tagName: tag2, config: config2 };
    }
    const {
      tag,
      slot = key,
      owners = [],
      kinds,
      properties = [],
      ...options
    } = tagOf(tagOrOptions);
    const roots = rootTags.get(primitive);
    if (!roots) {
      throw new Error(
        `<${tag}> is a part of ${primitive.name}: define its root first.`
      );
    }
    const slotSchema = schema.slots[slot] ?? (options.feature?.slots[slot] && (options.feature.slots[slot].props ?? {}));
    if (!slotSchema) {
      throw new Error(`<${tag}>: ${primitive.name} has no ${slot} slot.`);
    }
    const { attributes, ...props } = elementProps(slotSchema, schema, kinds);
    const config = {
      ...options,
      slot,
      owner: [.../* @__PURE__ */ new Set([...root ? [root] : [], ...roots, ...owners])].join(
        ", "
      ),
      props: attributes,
      ...props,
      properties: [.../* @__PURE__ */ new Set([...props.properties, ...properties])]
    };
    return { kind: "part", key, tagName: tag, config };
  }
  function partElements(primitive, tags) {
    const { root, ...parts } = tags;
    const owner4 = partElement(primitive, "root", root);
    return [
      owner4,
      ...Object.entries(
        parts
      ).flatMap(
        ([key, tag]) => tag ? [partElement(primitive, key, tag, owner4.tagName)] : []
      )
    ];
  }
  function defineElement(primitive, element2) {
    if (element2.kind === "owner") {
      defineRootElement(element2.tagName, primitive, element2.config);
    } else {
      definePartElement(element2.tagName, element2.config);
    }
  }
  var pascal = (name) => name.replace(/(^|-)(\w)/g, (_, _dash, char) => char.toUpperCase());
  function createParts(primitive, tags) {
    const parts = {};
    for (const element2 of partElements(primitive, tags)) {
      defineElement(primitive, element2);
      parts[pascal(element2.key)] = typeof customElements === "undefined" ? void 0 : customElements.get(element2.tagName);
    }
    return parts;
  }

  // node_modules/@ui-sdk/web/dist/button.js
  var authoredTypes = /* @__PURE__ */ new WeakMap();
  var isButtonType = (type) => type === "button" || type === "submit" || type === "reset";
  function authoredType(el) {
    const inner = wrappedButton(el);
    if (!inner) {
      return void 0;
    }
    const current = inner.getAttribute("type");
    const authored = authoredTypes.get(inner);
    const written = isButtonType(authored) ? authored : "button";
    if (!authoredTypes.has(inner) || current !== written) {
      authoredTypes.set(inner, current);
    }
    const type = authoredTypes.get(inner);
    return isButtonType(type) ? type : void 0;
  }
  function defineButtonElements() {
    createParts(button, {
      root: {
        tag: "ui-button",
        target: wrappedButton,
        display: "contents",
        // The button's own type, as written, so <button type="submit"> stays a submit button.
        kinds: { type: null },
        options: (el) => ({ type: authoredType(el), action: actionOf(el) })
      }
    });
  }

  // node_modules/@ui-sdk/web/dist/entries/button.js
  defineButtonElements();

  // node_modules/@ui-sdk/core/dist/foundation/forms/control.js
  var controlSelector = '[data-slot="slider"],[data-slot="color-picker"],[data-slot="date-input"],[data-slot="time-input"],input:not([type="hidden"]):not([aria-hidden="true"]),select,textarea,[data-slot="checkbox-group"],[role="checkbox"],[role="switch"],[role="radiogroup"],[role="radio"],[role="combobox"],[role="slider"],[role="spinbutton"],[role="textbox"],[role="listbox"],[data-slot="file-input-trigger"]';
  var isSingleSlider = (el) => el.matches('[data-slot="slider"]') && !el.querySelector('[data-slot="slider-thumb"][data-index="1"]');
  var isControl = (el) => el.matches(controlSelector) && !isSingleSlider(el);
  function findControl(root, accepts = () => true) {
    if (isControl(root)) {
      return root;
    }
    for (const el of Array.from(
      root.querySelectorAll(controlSelector)
    )) {
      if (accepts(el) && !isSingleSlider(el)) {
        return el;
      }
    }
  }
  function activateControl(control, event) {
    const role = control.getAttribute("role");
    const checkable = role === "checkbox" || role === "switch" || role === "radio" || control instanceof HTMLInputElement && (control.type === "checkbox" || control.type === "radio");
    const plainButton = control instanceof HTMLButtonElement && !role;
    if (checkable || plainButton || role === "radiogroup") {
      control.click();
    } else if (role === "group") {
      ;
      (control.querySelector("input:not([type='hidden'])") ?? control.querySelector('[tabindex="0"]'))?.focus();
    } else {
      control.focus();
    }
    event?.preventDefault();
  }

  // node_modules/@ui-sdk/core/dist/components/field/field-control.js
  var validityKeys = [
    "valueMissing",
    "typeMismatch",
    "patternMismatch",
    "tooLong",
    "tooShort",
    "rangeUnderflow",
    "rangeOverflow",
    "stepMismatch",
    "badInput",
    "customError"
  ];
  var valid = { valid: true, flags: {}, message: "" };
  function validates(el) {
    return el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement || !!formInternals(el) || isFormAssociated(el);
  }
  function isFormAssociated(el) {
    return !!el.constructor.formAssociated && "validity" in el;
  }
  function controlsIn(root) {
    return Array.from(root.querySelectorAll("*")).filter(
      (el) => validates(el) && el.type !== "hidden" && el.closest('[data-slot="field"]') === root
    );
  }
  function validityOf(el) {
    const internals = formInternals(el);
    const target = internals ?? el;
    return {
      willValidate: target.willValidate,
      validity: target.validity,
      message: target.validationMessage
    };
  }
  var isRequired = (el) => el.hasAttribute("required") || el.getAttribute("aria-required") === "true";

  // node_modules/@ui-sdk/core/dist/components/field/field-attrs.js
  init_part();
  function fieldState(state, api) {
    const show = api.shown();
    const bad = api.invalid();
    return {
      disabled: api.disabled(),
      required: state.required,
      focused: state.focused,
      invalid: show && bad,
      // Only the browser's own validation says a value is valid.
      valid: state.external === void 0 && show && !bad
    };
  }
  function dataAttrs(state, api) {
    const { disabled, required, focused, invalid, valid: valid2 } = fieldState(state, api);
    return {
      "data-disabled": disabled ? "" : void 0,
      "data-required": required ? "" : void 0,
      "data-focused": focused ? "" : void 0,
      "data-invalid": invalid ? "" : void 0,
      "data-valid": valid2 ? "" : void 0
    };
  }
  function errorState(state, api) {
    return { ...fieldState(state, api), message: state.validity.message };
  }
  function errorShown(state, api, props) {
    if (typeof props.match === "boolean") {
      return props.match;
    }
    if (api.disabled() || !api.shown() || !api.invalid()) {
      return false;
    }
    if (typeof props.match === "string") {
      return state.external === void 0 && !!state.validity.flags[props.match];
    }
    return true;
  }
  function references2(state, api) {
    if (state.bound) {
      return state;
    }
    return {
      labels: [`${api.id}-label`],
      descriptions: [`${api.id}-description`],
      errors: errorShown(state, api, {}) ? [`${api.id}-error`] : []
    };
  }
  function controlAttrs(state, api, props, fallback) {
    const { invalid } = fieldState(state, api);
    const { labels: labels2, descriptions, errors } = references2(state, api);
    const described2 = [props.describedBy, ...descriptions, ...errors].filter(
      Boolean
    );
    const id = props.id ?? fallback;
    const named = state.namedByContent && labels2.length ? [...labels2, id] : labels2;
    return {
      id,
      // Also set beside a native <label for>, so labels that aren't one, and
      // controls a <label> can't point at, are named too.
      "aria-labelledby": named.length ? named.join(" ") : void 0,
      "aria-describedby": described2.length ? described2.join(" ") : void 0,
      "aria-invalid": invalid ? "true" : void 0,
      disabled: state.disabled ? "" : void 0,
      ...dataAttrs(state, api)
    };
  }
  function bindFoundControl(root, api, store) {
    let current;
    let written = /* @__PURE__ */ new Map();
    let added = /* @__PURE__ */ new Set();
    let gave;
    const write = () => {
      const control = current;
      if (!control || !root.contains(control) || api.internal.hasControlPart()) {
        return;
      }
      const state = store.get();
      const describedBy = (control.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((id) => id && !added.has(id)).join(" ");
      const { id: _id, ...attrs2 } = controlAttrs(
        state,
        api,
        { id: control.id, describedBy },
        fieldControlId(api.id)
      );
      const { descriptions, errors } = references2(state, api);
      added = /* @__PURE__ */ new Set([...descriptions, ...errors]);
      const next = /* @__PURE__ */ new Map();
      for (const [name2, value] of Object.entries(attrs2)) {
        if (value === void 0) {
          if (written.has(name2)) {
            control.removeAttribute(name2);
          }
          continue;
        }
        const current2 = control.getAttribute(name2);
        if (name2 === "aria-labelledby" && current2 !== null && current2 !== written.get(name2) && !madeLabel(current2)) {
          continue;
        }
        next.set(name2, value);
        if (current2 !== value) {
          control.setAttribute(name2, value);
        }
      }
      written = next;
      const name = state.name;
      const named = submitterOf(control, root);
      const own = named?.getAttribute("name");
      if (!named || own != null && (gave?.el !== named || own !== gave.name)) {
        return;
      }
      if (name) {
        named.setAttribute("name", name);
      } else if (own != null) {
        named.removeAttribute("name");
      }
      gave = { el: named, name };
    };
    const adopt = (control) => {
      if (!control.id) {
        control.id = fieldControlId(api.id);
      }
      api.internal.adopt(control);
    };
    const described2 = typeof MutationObserver === "undefined" ? void 0 : new MutationObserver((records) => {
      if (current && records.some((record) => record.attributeName === "id")) {
        adopt(current);
      }
      write();
    });
    const find = () => {
      if (api.internal.hasControlPart()) {
        return;
      }
      const next = api.control();
      if (next === current || next === void 0) {
        return;
      }
      current = next;
      added = /* @__PURE__ */ new Set();
      adopt(next);
      described2?.disconnect();
      described2?.observe(next, { attributeFilter: ["aria-describedby", "id"] });
      write();
    };
    queueMicrotask(find);
    const unsubscribe = store.subscribe(() => {
      find();
      write();
    });
    const observer = typeof MutationObserver === "undefined" ? void 0 : new MutationObserver(find);
    observer?.observe(root, { childList: true, subtree: true });
    return () => {
      unsubscribe();
      observer?.disconnect();
      described2?.disconnect();
    };
  }
  function submitterOf(control, root) {
    for (let node = control; node && node !== root; node = node.parentElement) {
      if (formInternals(node)) {
        return node;
      }
    }
    return control.matches("input, select, textarea") ? control : void 0;
  }

  // node_modules/@ui-sdk/core/dist/components/field/field-set.js
  function registerById(el, register2) {
    let id = el.id;
    let unregister = register2(id);
    if (typeof MutationObserver === "undefined") {
      return () => unregister();
    }
    const observer = new MutationObserver(() => {
      if (el.id === id) {
        return;
      }
      id = el.id;
      unregister();
      unregister = register2(id);
    });
    observer.observe(el, { attributeFilter: ["id"] });
    return () => {
      observer.disconnect();
      unregister();
    };
  }
  var fieldSetState = (state) => ({
    disabled: state.disabled || state.inherited
  });
  var disabledAttrs = (state) => ({
    "data-disabled": state.disabled || state.inherited ? "" : void 0
  });
  var fieldSetPrimitive = /* @__PURE__ */ definePrimitive({
    name: "field",
    options: { disabled: "boolean" },
    state: (options) => ({
      disabled: !!options.disabled,
      inherited: false,
      legends: [],
      descriptions: []
    }),
    sync: (options) => ({ disabled: !!options.disabled }),
    api: ({ store }) => ({
      // Parts register a microtask after they bind, since Vue binds them while hydrating.
      register(list, partId) {
        let active = true;
        queueMicrotask(() => {
          if (active) {
            store.set({
              [list]: [
                ...store.get()[list].filter((item) => item !== partId),
                partId
              ]
            });
          }
        });
        return () => {
          active = false;
          queueMicrotask(
            () => store.set({
              [list]: store.get()[list].filter((item) => item !== partId)
            })
          );
        };
      }
    }),
    slots: (slot) => ({
      set: slot({
        state: fieldSetState,
        attrs: (state) => ({
          disabled: state.disabled ? "" : void 0,
          // A <legend> that's the first child names it natively, before scripts
          // run. This also covers a legend rendered as another element.
          "aria-labelledby": state.legends.length ? state.legends.join(" ") : void 0,
          "aria-describedby": state.descriptions.length ? state.descriptions.join(" ") : void 0,
          ...disabledAttrs(state)
        }),
        bind: (el, { store }) => watchFieldsets(el, (inherited) => store.set({ inherited }))
      }),
      legend: slot({
        props: { id: "string" },
        state: fieldSetState,
        attrs: (state, { id, props }) => ({
          id: props.id ?? `${id}-legend`,
          ...disabledAttrs(state)
        }),
        bind: (el, { api }) => registerById(el, (id) => api.register("legends", id))
      }),
      // A FieldDescription right inside a FieldSet, outside any Field, describes the group.
      description: slot({
        props: { id: "string" },
        state: fieldSetState,
        attrs: (state, { id, props }) => ({
          id: props.id ?? `${id}-description`,
          ...disabledAttrs(state)
        }),
        bind: (el, { api }) => registerById(el, (id) => api.register("descriptions", id))
      })
    }),
    agent: { shown: () => false }
  });
  var fieldSet = fieldSetPrimitive;
  var fieldGroupPrimitive = /* @__PURE__ */ definePrimitive({
    name: "field",
    state: (_options) => ({}),
    // Nothing to set up. The parameter keeps TypeScript inferring the slots.
    api: (_context) => ({}),
    slots: (slot) => ({
      group: slot({ attrs: () => ({}) })
    }),
    agent: { shown: () => false }
  });
  var fieldGroup = fieldGroupPrimitive;

  // node_modules/@ui-sdk/core/dist/components/field/field.js
  init_part();
  init_events();
  var matchAttribute = (attribute) => attribute === null ? void 0 : attribute === "" || attribute === "true" ? true : attribute === "false" ? false : attribute;
  var ownControl = (root) => (el) => el.closest('[data-slot="field"]') === root;
  function fieldApiBody(context2) {
    const { id, store, element: element2, parts } = context2;
    let root;
    const shown2 = () => store.get().external ?? store.get().revealed;
    const disabled = () => store.get().disabled || store.get().formDisabled;
    const invalid = () => store.get().external ?? !store.get().validity.valid;
    const errorInPage = () => {
      const state = store.get();
      for (const part of parts()) {
        if (part.slot !== "error" || !held2(part) || part.el?.isConnected === false) {
          continue;
        }
        if (errorShown(state, api, part.props)) {
          return true;
        }
      }
      return false;
    };
    let holder;
    const errorId = (state, key) => {
      const first = holder ?? [...parts()].find(
        (part) => part.slot === "error" && part.props.id === void 0 && errorShown(state, api, part.props)
      )?.key;
      return !key || first === key ? `${id}-error` : `${id}-error-${key}`;
    };
    let wired = [];
    let quiet2 = true;
    let quietTimer;
    function hush() {
      quiet2 = true;
      clearTimeout(quietTimer);
      quietTimer = setTimeout(() => quiet2 = false);
    }
    function readValidity(controls) {
      wired = controls;
      let next = valid;
      for (const el of controls) {
        const { willValidate, validity, message } = validityOf(el);
        if (!willValidate || validity.valid) {
          continue;
        }
        const flags = {};
        for (const key of validityKeys) {
          if (validity[key]) {
            flags[key] = true;
          }
        }
        next = { valid: false, flags, message };
        break;
      }
      const required = controls.some(isRequired);
      if (required !== store.get().required) {
        store.set({ required });
      }
      const current = store.get().validity;
      if (current.valid !== next.valid || current.message !== next.message || validityKeys.some((key) => !!current.flags[key] !== !!next.flags[key])) {
        store.set({ validity: next });
      }
    }
    const api = {
      id,
      shown: shown2,
      disabled,
      invalid,
      // The element labels and messages are wired to.
      control: () => element2("control") ?? (root ? findControl(root, ownControl(root)) : void 0),
      activate(event) {
        const control = api.control();
        if (control && !disabled()) {
          activateControl(control, event);
        }
      },
      internal: {
        errorId,
        bindRoot(el) {
          root = el;
          return bindRoot(el);
        },
        // A microtask after binding, since Vue binds mid-hydration. Each takes out
        // only its own entry, so two parts sharing an id don't drop each other.
        register(list, partId) {
          let active = true;
          let added = false;
          queueMicrotask(() => {
            if (active) {
              added = true;
              store.set({ [list]: [...store.get()[list], partId] });
            }
          });
          return () => {
            active = false;
            queueMicrotask(() => {
              const items = store.get()[list];
              const index = items.indexOf(partId);
              if (added && index !== -1) {
                store.set({ [list]: items.filter((_, at) => at !== index) });
              }
            });
          };
        },
        holdError(el, key) {
          if (el.id !== `${id}-error`) {
            return () => {
            };
          }
          holder = key;
          return () => queueMicrotask(() => {
            if (holder === key && !el.isConnected) {
              holder = void 0;
            }
          });
        },
        // The browser's message for the current problem, which an empty error shows.
        message: () => store.get().validity.message,
        // Controls rendered by a framework bind before their field's root.
        hasControlPart: () => !!element2("control"),
        // Screen readers don't read an error that appears or changes while the
        // person stays where they are, so its text goes to the shared announcer.
        announce(el) {
          if (typeof MutationObserver === "undefined") {
            return () => {
            };
          }
          const textOf3 = () => el.textContent?.replace(/\s+/g, " ").trim() ?? "";
          let silent = quiet2;
          let said = "";
          const say = () => {
            const text = textOf3();
            if (!text || text === said) {
              return;
            }
            said = text;
            if (silent) {
              return;
            }
            Promise.resolve().then(() => (init_announce(), announce_exports)).then(
              ({ announce: announce2 }) => el.isConnected && announce2(text, { doc: el.ownerDocument }),
              () => {
              }
            );
          };
          const timer = setTimeout(() => {
            if (silent) {
              said = textOf3();
            }
            silent = false;
            say();
          });
          const observer = new MutationObserver(say);
          observer.observe(el, {
            childList: true,
            characterData: true,
            subtree: true
          });
          return () => {
            clearTimeout(timer);
            observer.disconnect();
          };
        },
        adopt(el) {
          const namedByContent2 = el instanceof HTMLButtonElement && !el.hasAttribute("role");
          queueMicrotask(
            () => store.set({
              controlId: el.id || null,
              labelable: isLabelable(el) && !namedByContent2,
              namedByContent: namedByContent2
            })
          );
        }
      }
    };
    let queued2 = false;
    const check = () => {
      if (queued2) {
        return;
      }
      queued2 = true;
      queueMicrotask(() => {
        queued2 = false;
        if (root) {
          readValidity(controlsIn(root));
        }
      });
    };
    function bindRoot(el) {
      check();
      hush();
      queueMicrotask(() => store.set({ bound: true }));
      const form = () => {
        const control = controlsIn(el)[0];
        return formInternals(control)?.form ?? control?.form ?? el.closest("form");
      };
      const cleanups = [
        watchFieldsets(el, (formDisabled) => store.set({ formDisabled })),
        on(el, "focusin", () => store.set({ focused: true })),
        on(el, "focusout", (event) => {
          if (event.relatedTarget instanceof Node && el.contains(event.relatedTarget)) {
            return;
          }
          store.set({ focused: false });
        })
      ];
      const onChange = (event) => {
        if (event.target instanceof Node && el.contains(event.target)) {
          check();
        }
      };
      for (const type of ["input", "change"]) {
        el.ownerDocument.addEventListener(type, onChange);
        cleanups.push(() => el.ownerDocument.removeEventListener(type, onChange));
      }
      const onInvalid = (event) => {
        const target = event.target;
        hush();
        store.set({ revealed: true });
        readValidity(controlsIn(el));
        if (!errorInPage()) {
          if (invalidFocusClaimed(target, form())) {
            event.preventDefault();
          }
          return;
        }
        event.preventDefault();
        claimInvalidFocus(target, form());
      };
      el.addEventListener("invalid", onInvalid, true);
      cleanups.push(() => el.removeEventListener("invalid", onInvalid, true));
      const onReset = (event) => {
        if (event.target !== form()) {
          return;
        }
        afterReset(event, () => {
          store.set({ revealed: false });
          readValidity(controlsIn(el));
        });
      };
      el.ownerDocument.addEventListener("reset", onReset, true);
      cleanups.push(
        () => el.ownerDocument.removeEventListener("reset", onReset, true)
      );
      let external = store.get().external;
      cleanups.push(
        store.subscribe(() => {
          const next = store.get().external;
          if (next === void 0 === (external === void 0)) {
            external = next;
            return;
          }
          external = next;
          store.set({ revealed: false });
          check();
        })
      );
      cleanups.push(
        onValidityChange((control) => {
          if (el.contains(control)) {
            check();
          }
        })
      );
      if (typeof MutationObserver !== "undefined") {
        const observer = new MutationObserver((records) => {
          const left = wired.some((control) => !el.contains(control));
          if (left || records.some((record) => record.type === "attributes")) {
            check();
          }
        });
        observer.observe(el, {
          subtree: true,
          childList: true,
          attributeFilter: ["required", "aria-required", "disabled", "pattern"]
        });
        cleanups.push(() => observer.disconnect());
      }
      return () => {
        clearTimeout(quietTimer);
        cleanups.forEach((cleanup) => cleanup());
      };
    }
    return api;
  }
  var fieldApi = fieldApiBody;
  var fieldPrimitive = /* @__PURE__ */ definePrimitive({
    name: "field",
    options: {
      name: "string",
      disabled: "boolean",
      invalid: "boolean"
    },
    state: (options) => ({
      disabled: !!options.disabled,
      name: options.name,
      external: options.invalid,
      focused: false,
      revealed: false,
      formDisabled: false,
      validity: valid,
      labels: [],
      descriptions: [],
      errors: [],
      bound: false,
      controlId: null,
      labelable: true,
      namedByContent: false,
      required: false
    }),
    sync: (options) => ({
      disabled: !!options.disabled,
      name: options.name,
      external: options.invalid
    }),
    api: (context2) => fieldApi(context2),
    slots: (slot) => ({
      root: slot({
        state: (state, { api }) => fieldState(state, api),
        attrs: (state, { api }) => dataAttrs(state, api),
        bind: (el, { api, store }) => {
          const cleanups = [api.internal.bindRoot(el)];
          if (!api.internal.hasControlPart()) {
            cleanups.push(bindFoundControl(el, api, store));
          }
          return () => cleanups.forEach((cleanup) => cleanup());
        }
      }),
      label: slot({
        props: { id: "string" },
        state: (state, { api }) => fieldState(state, api),
        attrs: (state, { id, props, api }) => ({
          id: props.id ?? `${id}-label`,
          for: state.labelable ? state.controlId ?? fieldControlId(id) : void 0,
          ...dataAttrs(state, api)
        }),
        // A label that isn't a native one for the control activates it all the same.
        press({ api, el }, event) {
          if (el instanceof HTMLLabelElement && el.control) {
            return;
          }
          api.activate(event);
        },
        bind: (el, { api }) => registerById(el, (id) => api.internal.register("labels", id))
      }),
      description: slot({
        props: { id: "string" },
        state: (state, { api }) => fieldState(state, api),
        attrs: (state, { id, props, api }) => ({
          id: props.id ?? `${id}-description`,
          ...dataAttrs(state, api)
        }),
        bind: (el, { api }) => registerById(el, (id) => api.internal.register("descriptions", id))
      }),
      error: slot({
        props: {
          id: "id",
          match: matchAttribute,
          // Internal: renderers key each error by a made value, so an invalid
          // submit reads every error's own `match`. Field has no `field` slot,
          // so no element attribute either.
          value: { kind: "string", from: "field" }
        },
        present: (state, { props, api }) => errorShown(state, api, props),
        state: (state, { api }) => errorState(state, api),
        attrs: (state, { id, key, props, api }) => ({
          id: props.id ?? api.internal.errorId(state, key),
          ...dataAttrs(state, api)
        }),
        bind: (el, { api, key }) => {
          const unregister = registerById(
            el,
            (id) => api.internal.register("errors", id)
          );
          const unhold = api.internal.holdError(el, key);
          const unannounce = api.internal.announce(el);
          return () => {
            unregister();
            unhold();
            unannounce();
          };
        }
      }),
      // The control, when a framework renders it: a control of this package, or
      // a native input through the field's own control part.
      control: slot({
        props: { id: "string", describedBy: "string" },
        state: (state, { api }) => fieldState(state, api),
        attrs: (state, { id, props, api }) => controlAttrs(state, api, props, fieldControlId(id)),
        bind: (el, { api }) => {
          api.internal.adopt(el);
          return () => {
          };
        }
      })
    }),
    agent: { shown: (state) => !!state.errors.length }
  });
  var field = fieldPrimitive;

  // node_modules/@ui-sdk/web/dist/field.js
  var owner = "ui-field";
  function writeAlone(el, slot) {
    for (const [name, value] of Object.entries(fieldOutsideAttrs(slot))) {
      if (el.getAttribute(name) !== value) {
        el.setAttribute(name, value);
      }
    }
  }
  function labelAlone(el, host) {
    writeAlone(el, "label");
    if (el === host && host.hasAttribute("as-child")) {
      return;
    }
    checkFieldOutside(
      el,
      "label",
      "Put `as-child` on the <ui-field-label>, around a native <label> that wraps the control."
    );
  }
  function errorAlone(el, host) {
    if (el === host && host.hasAttribute("as-child")) {
      return;
    }
    writeAlone(el, "error");
    const match = host.getAttribute("match");
    el.hidden = !fieldOutsideErrorShown({
      match: match === "" || match === "true"
    });
  }
  function defineFieldElements() {
    createParts(field, {
      root: {
        tag: owner,
        display: "block",
        // `invalid` is three-way, so its property writes "false" for false, and
        // reads undefined without the attribute, which leaves it to the browser.
        kinds: { invalid: (value) => value !== "false" },
        // Empty errors show the current message.
        render(el, instance) {
          const update = () => {
            for (const error of Array.from(
              el.querySelectorAll("ui-field-error")
            )) {
              if (error.closest(owner) !== el) {
                continue;
              }
              if (!("message" in error.dataset) && error.childNodes.length) {
                continue;
              }
              error.dataset.message = "";
              const message = instance.api.internal.message();
              if (error.textContent !== message) {
                error.textContent = message;
              }
            }
          };
          queueMicrotask(update);
          return instance.subscribe(update);
        }
      },
      // Outside any field, a label is plain. With as-child on a native <label>,
      // it labels the control inside it, like a card around a whole field.
      label: { tag: "ui-field-label", display: "block", alone: labelAlone },
      // Describes the nearest field, or the whole field set when no field is closer.
      description: {
        tag: "ui-field-description",
        owners: ["ui-field-set"],
        display: "block",
        alone: (el) => writeAlone(el, "description")
      },
      error: { tag: "ui-field-error", display: "block", alone: errorAlone }
    });
    createParts(fieldSet, {
      // Wraps a native <fieldset> and its <legend>, so `disabled` disables every
      // control inside it the way the browser does.
      root: {
        tag: "ui-field-set",
        display: "contents",
        children: {
          set: (el) => el.querySelector(":scope > fieldset"),
          legend: (el) => el.querySelector(":scope > fieldset > legend")
        },
        optionalChildren: ["legend"]
      },
      legend: { tag: "ui-field-legend", display: "block" }
    });
    createParts(fieldGroup, {
      root: { tag: "ui-field-group", self: "group", display: "block" }
    });
  }

  // node_modules/@ui-sdk/web/dist/entries/field.js
  defineFieldElements();

  // node_modules/@ui-sdk/core/dist/components/file-input/file-drop.js
  var pageDrag = false;
  function carriesFiles(event) {
    const data = event.dataTransfer;
    if (pageDrag || !data) {
      return false;
    }
    const types = Array.from(data.types ?? []);
    return types.includes("Files") || types.includes("application/x-moz-file") || Array.from(data.items ?? []).some((item) => item.kind === "file");
  }
  function draggedTypes(dataTransfer) {
    if (!dataTransfer?.items) {
      return [];
    }
    return Array.from(dataTransfer.items).filter((item) => item.kind === "file").map((item) => item.type);
  }
  function pastedFiles(event) {
    const data = event.clipboardData;
    if (!data) {
      return [];
    }
    const files = Array.from(data.files ?? []);
    if (files.length) {
      return files;
    }
    return Array.from(data.items ?? []).filter((item) => item.kind === "file").map((item) => item.getAsFile()).filter((file) => !!file);
  }
  var systemFiles = /* @__PURE__ */ new Set([".DS_Store", "Thumbs.db", "desktop.ini"]);
  var folderFileLimit = 1e3;
  async function readEntries(entries2, limit2 = folderFileLimit) {
    const files = [];
    const visit = async (entry) => {
      if (files.length >= limit2) {
        return;
      }
      if (entry.isFile && entry.file) {
        if (systemFiles.has(entry.fullPath.split("/").pop())) {
          return;
        }
        const file = await new Promise(
          (resolve, reject) => entry.file(resolve, reject)
        );
        setRelativePath(file, entry.fullPath.replace(/^\//, ""));
        files.push(file);
        return;
      }
      const reader = entry.isDirectory ? entry.createReader?.() : void 0;
      if (!reader) {
        return;
      }
      for (; ; ) {
        const batch = await new Promise(
          (resolve, reject) => reader.readEntries(resolve, reject)
        );
        if (!batch.length || files.length >= limit2) {
          return;
        }
        for (const child of batch) {
          await visit(child);
        }
      }
    };
    for (const entry of entries2) {
      await visit(entry).catch(() => {
      });
    }
    return files;
  }
  function droppedFiles(dataTransfer) {
    const items = Array.from(dataTransfer.items ?? []).filter(
      (item) => item.kind === "file"
    );
    const entries2 = items.map(
      (item) => item.webkitGetAsEntry?.() ?? null
    );
    if (!entries2.some((entry) => entry?.isDirectory)) {
      return Array.from(dataTransfer.files);
    }
    const loose = items.flatMap(
      (item, index) => entries2[index] ? [] : [item.getAsFile()]
    );
    return readEntries(
      entries2.filter((entry) => !!entry)
    ).then((files) => [...loose.filter((file) => !!file), ...files]);
  }
  var claimed2 = /* @__PURE__ */ new WeakSet();
  function claim(event) {
    claimed2.add(event);
  }
  function isClaimed(event) {
    return claimed2.has(event);
  }
  function isFileInput(target) {
    return target instanceof HTMLInputElement && target.type === "file";
  }
  var guards = 0;
  var releaseGuard;
  function guardFileDrops() {
    if (typeof window === "undefined") {
      return () => {
      };
    }
    if (guards++ === 0) {
      const onDragStart = () => pageDrag = true;
      const onDragEnd = () => pageDrag = false;
      const onDragOver = (event) => {
        if (isClaimed(event) || !carriesFiles(event) || isFileInput(event.target)) {
          return;
        }
        event.preventDefault();
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = "none";
        }
      };
      const onDrop = (event) => {
        if (isClaimed(event) || !carriesFiles(event) || isFileInput(event.target)) {
          return;
        }
        event.preventDefault();
      };
      window.addEventListener("dragstart", onDragStart, true);
      window.addEventListener("dragend", onDragEnd, true);
      window.addEventListener("dragover", onDragOver);
      window.addEventListener("drop", onDrop);
      releaseGuard = () => {
        window.removeEventListener("dragstart", onDragStart, true);
        window.removeEventListener("dragend", onDragEnd, true);
        window.removeEventListener("dragover", onDragOver);
        window.removeEventListener("drop", onDrop);
        pageDrag = false;
      };
    }
    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;
      if (--guards === 0) {
        releaseGuard?.();
      }
    };
  }
  function createDragTracker(onChange) {
    const entered = /* @__PURE__ */ new Set();
    return {
      enter(event) {
        if (event.target) {
          entered.add(event.target);
        }
        if (entered.size === 1) {
          onChange(true);
        }
      },
      leave(event) {
        if (!event.target || !entered.delete(event.target)) {
          return;
        }
        for (const node of entered) {
          if (node instanceof Node && !node.isConnected) {
            entered.delete(node);
          }
        }
        if (!entered.size) {
          onChange(false);
        }
      },
      reset() {
        if (!entered.size) {
          return;
        }
        entered.clear();
        onChange(false);
      }
    };
  }

  // node_modules/@ui-sdk/core/dist/components/file-input/file-input-dropzone.js
  init_events();
  var zoneOf = (node) => node instanceof Element ? node.closest('[data-slot="file-input-dropzone"]') : null;
  function resolvePasteTarget(target, doc) {
    if (typeof target === "function") {
      return target();
    }
    if (typeof target === "string" && target !== "document") {
      return doc.querySelector(target);
    }
    return target;
  }
  function bindDropzone(el, {
    key,
    store,
    api,
    props
  }) {
    const targetsDocument = () => props().target === "document";
    const disabled = () => isDisabled(store.get());
    function take(files, event) {
      if (Array.isArray(files)) {
        api.internal.receive(files, "drop", event);
      } else {
        files.then((read) => api.internal.receive(read, "drop", event));
      }
    }
    function onPaste(event) {
      if (disabled() || isClaimed(event)) {
        return;
      }
      const files = pastedFiles(event);
      if (!files.length) {
        return;
      }
      claim(event);
      event.preventDefault();
      api.internal.receive(files, "paste", event);
    }
    function trackDrags(target, active) {
      let status = "accept";
      const tracker = createDragTracker(
        (over) => api.internal.setDrag(key, over && !disabled() ? status : null)
      );
      return [
        on(target, "dragenter", (event) => {
          if (!active() || !carriesFiles(event)) {
            return;
          }
          status = dragStatus(
            draggedTypes(event.dataTransfer),
            api.internal.rules()
          );
          tracker.enter(event);
        }),
        on(target, "dragleave", (event) => tracker.leave(event)),
        on(target, "dragover", (event) => {
          if (!active() || !carriesFiles(event) || isClaimed(event) || isFileInput(event.target)) {
            return;
          }
          claim(event);
          event.preventDefault();
          if (event.dataTransfer) {
            event.dataTransfer.dropEffect = disabled() ? "none" : "copy";
          }
        }),
        // A drop anywhere ends the drag, even one another zone took.
        on(window, "drop", () => tracker.reset(), { capture: true })
      ];
    }
    const cleanups = [
      guardFileDrops(),
      ...trackDrags(el, () => !targetsDocument()),
      ...trackDrags(window, targetsDocument),
      // In the capture phase, so the zone takes the drop before anything inside
      // it, and no native drop reaches listeners past the zone. On web
      // components, the root's own events are the only ones they hear.
      on(
        el,
        "drop",
        (event) => {
          if (targetsDocument() || !event.dataTransfer || !carriesFiles(event) || zoneOf(event.target) !== el) {
            return;
          }
          claim(event);
          event.preventDefault();
          event.stopImmediatePropagation();
          if (!disabled()) {
            take(droppedFiles(event.dataTransfer), event);
          }
        },
        { capture: true }
      ),
      // A page-wide zone takes what no other zone did, since those stop their drops.
      on(window, "drop", (event) => {
        if (!targetsDocument() || !event.dataTransfer || !carriesFiles(event)) {
          return;
        }
        if (isClaimed(event) || isFileInput(event.target)) {
          return;
        }
        claim(event);
        event.preventDefault();
        if (!disabled()) {
          take(droppedFiles(event.dataTransfer), event);
        }
      }),
      on(el, "paste", onPaste),
      // Pastes into `pasteTarget`, read when the paste happens, so the target can render after the zone.
      on(
        el.ownerDocument,
        "paste",
        (event) => {
          const target = resolvePasteTarget(props().pasteTarget, el.ownerDocument);
          if (target === "document" || target instanceof Node && target.contains(event.target)) {
            onPaste(event);
          }
        },
        { capture: true }
      ),
      () => api.internal.setDrag(key, null)
    ];
    return () => cleanups.forEach((cleanup) => cleanup());
  }

  // node_modules/@ui-sdk/core/dist/components/file-input/file-input.js
  function captureAttribute(attribute) {
    if (attribute === null) {
      return void 0;
    }
    if (attribute === "" || attribute === "true") {
      return true;
    }
    return attribute === "false" ? false : attribute;
  }
  function rootState2(state) {
    return {
      value: state.value,
      disabled: isDisabled(state),
      required: state.required,
      dragging: Object.keys(state.drags).length > 0
    };
  }
  function dropzoneState(state, key) {
    const status = state.drags[key];
    return {
      dragging: !!status,
      dragAccept: status === "accept",
      dragReject: status === "reject",
      disabled: isDisabled(state)
    };
  }
  var formAttrs2 = (state) => ({
    "data-disabled": isDisabled(state) ? "" : void 0,
    "data-required": state.required ? "" : void 0
  });
  function isActiveItem(state, key) {
    const active = state.activeItem;
    if (active && state.value.some((file) => fileKey(file) === active)) {
      return active === key;
    }
    return state.value.length > 0 && fileKey(state.value[0]) === key;
  }
  var fileInputPrimitive = /* @__PURE__ */ definePrimitive({
    name: "file-input",
    options: {
      accept: "string",
      maxFiles: "number",
      maxSize: "number",
      minSize: "number",
      validate: "value",
      value: "value",
      defaultValue: "value",
      onValueChange: "callback",
      onReject: "callback",
      multiple: "boolean",
      directory: "boolean",
      capture: captureAttribute,
      name: "string",
      form: "string",
      required: "boolean",
      disabled: "boolean",
      announcement: "value",
      controller: "value"
    },
    state: (options) => {
      const value = options.value ?? options.defaultValue ?? [];
      return {
        ...settings(options),
        value,
        initial: options.defaultValue ?? value,
        formDisabled: false,
        associated: false,
        drags: {},
        activeItem: null
      };
    },
    sync: (options) => ({
      ...settings(options),
      ...options.defaultValue === void 0 ? {} : { initial: options.defaultValue },
      ...options.value === void 0 ? {} : { value: options.value }
    }),
    api: fileInputApi,
    slots: (slot) => ({
      root: slot({
        state: rootState2,
        attrs: (state) => ({
          ...formAttrs2(state),
          "data-dragging": Object.keys(state.drags).length ? "" : void 0
        }),
        bind: (el, { api }) => api.internal.bindRoot(el)
      }),
      // The hidden input that opens the picker and, in React and Vue, holds the files the form submits.
      input: slot({
        attrs: (state) => ({
          type: "file",
          accept: state.accept,
          multiple: state.multiple ? "" : void 0,
          webkitdirectory: state.directory ? "" : void 0,
          capture: state.capture === true ? "" : state.capture,
          name: state.associated ? void 0 : state.name,
          form: state.associated ? void 0 : state.form,
          required: state.required && !state.associated ? "" : void 0,
          disabled: state.disabled ? "" : void 0,
          "aria-hidden": "true",
          tabindex: "-1",
          style: hiddenInputStyle
        }),
        bind: (el, { api }) => api.internal.bindInput(el)
      }),
      // Opens the picker. React and Vue render a button, and web components bind the button inside.
      trigger: slot({
        state: rootState2,
        attrs: (state) => ({
          type: "button",
          // A trigger connected from outside a disabled <fieldset> isn't disabled by it natively.
          disabled: isDisabled(state) ? "" : void 0,
          ...formAttrs2(state)
        }),
        press: ({ api }) => {
          api.open();
        }
      }),
      // Takes dropped and pasted files. It has no role and no tab stop.
      dropzone: slot({
        // Each zone is its own part, so it needs an id. `pasteTarget` is a
        // selector or "document" as an attribute, and may be an element too.
        props: {
          target: "string",
          pasteTarget: (attribute) => attribute,
          id: "id"
        },
        state: (state, { key }) => dropzoneState(state, key),
        attrs: (state, { key }) => {
          const { dragging, dragAccept, dragReject, disabled } = dropzoneState(
            state,
            key
          );
          return {
            "data-dragging": dragging ? "" : void 0,
            "data-drag-accept": dragAccept ? "" : void 0,
            "data-drag-reject": dragReject ? "" : void 0,
            "data-disabled": disabled ? "" : void 0
          };
        },
        bind: (el, { key, store, api }) => bindDropzone(el, {
          key,
          store,
          api,
          props: () => api.internal.dropzoneProps(key)
        })
      }),
      // The files, as a list. Adapters render its items, one per file.
      list: slot({
        role: "list",
        state: rootState2,
        attrs: formAttrs2
      }),
      // One file. It's focusable, with one tab stop for the list: arrow keys move
      // between items, and Backspace or Delete removes the focused one.
      item: slot({
        role: "listitem",
        focus: "roving",
        keys: [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Home",
          "End",
          "Backspace",
          "Delete"
        ],
        props: { file: "value", value: "string" },
        state: (state, { props }) => ({
          file: props.file,
          index: state.value.indexOf(props.file),
          disabled: isDisabled(state)
        }),
        attrs: (state, { key }) => ({
          tabindex: isActiveItem(state, key) ? "0" : "-1",
          "data-disabled": isDisabled(state) ? "" : void 0
        }),
        on: {
          keydown: (event, { api, el, props }) => el && api.internal.itemKeydown(event, el, props.file),
          focusin: (_, { api, key }) => api.internal.setActiveItem(key)
        }
      }),
      // Removes its item's file. Out of the tab order, since Backspace on the item does the same.
      // Renderers fill `file` from the item around it, so it's set by now.
      "item-remove": slot({
        props: {
          file: { kind: "value", from: "item" },
          value: { kind: "string", from: "item" }
        },
        state: (state) => ({ disabled: isDisabled(state) }),
        attrs: (state, { props }) => ({
          type: "button",
          tabindex: "-1",
          "aria-label": `Remove ${props.file.name}`,
          disabled: isDisabled(state) ? "" : void 0,
          "data-disabled": isDisabled(state) ? "" : void 0
        }),
        press: ({ api, props }, event) => api.internal.removeItem(props.file, event)
      })
    }),
    agent: { actions: ["setValue", "addFiles", "removeFile", "clear", "open"] }
  });
  var fileInput = fileInputPrimitive;

  // node_modules/@ui-sdk/web/dist/list.js
  var templateOf = (el) => el?.querySelector(":scope > template") ?? null;
  function copy(template, tagName, deep = true) {
    const model = template?.content.querySelector(tagName);
    return model ? model.cloneNode(deep) : document.createElement(tagName);
  }
  function element(tagName, attributes = {}, text, template) {
    const el = copy(template, tagName);
    for (const [name, value] of Object.entries(attributes)) {
      if (value === void 0 || value === false) {
        continue;
      }
      el.setAttribute(name, value === true ? "" : value);
    }
    if (text) {
      const slot = el.querySelector(`${tagName}-text`);
      if (slot) {
        slot.textContent = text;
      } else {
        el.prepend(text);
      }
    }
    return el;
  }
  function listAttribute(value) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  function renderListItems(prefix, items, toKey = (value) => String(value), template) {
    return items.map((entry) => {
      if (typeof entry === "string") {
        return element(
          `${prefix}-item`,
          { value: entry, label: entry },
          entry,
          template
        );
      }
      if ("type" in entry && entry.type === "separator") {
        return element(`${prefix}-separator`, {}, "", template);
      }
      if ("type" in entry && entry.type === "group") {
        const group = copy(template, `${prefix}-group`, false);
        if (entry.label) {
          group.append(
            element(`${prefix}-group-label`, {}, entry.label, template)
          );
        }
        group.append(...renderListItems(prefix, entry.items, toKey, template));
        return group;
      }
      const data = entry;
      const el = element(
        `${prefix}-item`,
        { value: toKey(data.value), label: data.label, disabled: data.disabled },
        data.label,
        template
      );
      if (data.keywords) {
        el.setAttribute("keywords", data.keywords.join(","));
      }
      if (data.shortcut) {
        el.setAttribute("shortcut", data.shortcut);
      }
      return el;
    });
  }
  function valuesOf(keys, items, itemToValue) {
    if (!items) {
      return keys;
    }
    const byKey = new Map(
      flattenData(items, (value) => itemKey(value, itemToValue)).map((entry) => [
        entry.key,
        entry
      ])
    );
    return keys.map((key) => byKey.get(key)?.value ?? key);
  }
  function adoptDefaultValue(el, items, api) {
    const start = el.getAttribute("default-value") ?? el.getAttribute("value");
    if (start === null || !items || !api) {
      return;
    }
    const multiple = el.hasAttribute("multiple") && el.getAttribute("multiple") !== "false";
    const keys = multiple ? listAttribute(start) : [start];
    const current = api.getValue();
    const named = multiple ? Array.isArray(current) && current.length === keys.length && current.every((value, index) => value === keys[index]) : current === keys[0];
    if (!named) {
      return;
    }
    const values = valuesOf(keys, items, api.internal.options().itemToValue);
    if (values.every((value, index) => value === keys[index])) {
      return;
    }
    api.internal.adoptValue(multiple ? values : values[0]);
  }

  // node_modules/@ui-sdk/web/dist/file-input.js
  var owner2 = "ui-file-input";
  function defineFileInputElements() {
    createParts(fileInput, {
      root: {
        tag: owner2,
        display: "block",
        formAssociated: true,
        // `value` is live, and `defaultValue` is the files a form reset returns to.
        state: {
          value: {
            get: (api) => api.getValue(),
            set: (api, files) => api.setValue(files ?? [])
          }
        },
        api: [
          "getValue",
          "setValue",
          "addFiles",
          "removeFile",
          "clear",
          "open",
          "focus",
          "isDragging"
        ],
        // The picker's input is generated inside, once.
        children: {
          input: (el) => {
            const existing = el.querySelector(
              ':scope > input[type="file"]'
            );
            if (existing) {
              return existing;
            }
            const input2 = el.ownerDocument.createElement("input");
            input2.type = "file";
            el.append(input2);
            return input2;
          }
        },
        // Lists follow the value.
        render(el, { api, subscribe: subscribe2 }) {
          renderLists(el, api);
          return subscribe2(() => renderLists(el, api));
        }
      },
      // Wraps your own <button>, so it keeps its native behavior.
      trigger: {
        tag: "ui-file-input-trigger",
        display: "contents",
        target: (el) => el.querySelector("button") ?? el.firstElementChild
      },
      // `paste-target` is "document" or a CSS selector.
      dropzone: { tag: "ui-file-input-dropzone", display: "block" },
      list: { tag: "ui-file-input-list", display: "block" },
      item: {
        tag: "ui-file-input-item",
        display: "block",
        // Its value is its file's key.
        kinds: { value: null },
        context: (el) => {
          const file = el.file;
          return file ? { value: fileKey(file) } : {};
        }
      },
      "item-remove": {
        tag: "ui-file-input-item-remove",
        display: "contents",
        target: (el) => el.querySelector("button") ?? el.firstElementChild
      }
    });
  }
  var renderedValue = /* @__PURE__ */ new WeakMap();
  var fileFields = {
    name: (file) => file.name,
    size: (file) => formatFileSize(file.size),
    type: (file) => file.type,
    path: (file) => relativePath(file)
  };
  function createItem(list, file) {
    const template = list.querySelector(":scope > template");
    const copy2 = template?.content.firstElementChild?.cloneNode(true);
    const item = copy2?.localName === "ui-file-input-item" ? copy2 : element("ui-file-input-item");
    if (item !== copy2) {
      item.append(element("span", { "data-file": "name" }));
      const remove = element("ui-file-input-item-remove");
      remove.append(element("button", { type: "button" }, "\xD7"));
      item.append(remove);
    }
    item.file = file;
    for (const field2 of item.querySelectorAll("[data-file]")) {
      field2.textContent = fileFields[field2.dataset.file ?? ""]?.(file) ?? "";
    }
    return item;
  }
  function renderLists(el, api) {
    const value = api.getValue();
    for (const list of el.querySelectorAll("ui-file-input-list")) {
      if (list.closest(owner2) !== el || renderedValue.get(list) === value) {
        continue;
      }
      renderedValue.set(list, value);
      const existing = /* @__PURE__ */ new Map();
      for (const item of list.querySelectorAll(
        ":scope > ui-file-input-item"
      )) {
        if (item.file) {
          existing.set(item.file, item);
        }
      }
      for (const [file, item] of existing) {
        if (!value.includes(file)) {
          item.remove();
        }
      }
      let previous = list.querySelector(":scope > template");
      for (const file of value) {
        const item = existing.get(file) ?? createItem(list, file);
        if (item.parentElement !== list || item.previousElementSibling !== previous) {
          if (previous) {
            previous.after(item);
          } else {
            list.prepend(item);
          }
        }
        previous = item;
      }
    }
  }

  // node_modules/@ui-sdk/web/dist/entries/file-input.js
  defineFileInputElements();

  // node_modules/@ui-sdk/core/dist/foundation/forms/text-field.js
  init_events();
  var textFields = /* @__PURE__ */ new WeakMap();
  var initialText = (options) => {
    const value = options.value ?? options.defaultValue ?? "";
    return { value, filled: value !== "" };
  };
  var syncText = (options) => options.value === void 0 ? {} : { value: options.value, filled: options.value !== "" };
  function textFieldApi({
    store,
    options,
    element: element2
  }, change, slot) {
    const control = () => element2(slot);
    const isControlled = () => options().value !== void 0;
    let writing2 = false;
    const read = (value) => store.set({ value, filled: value !== "" });
    function write(value, reason, event) {
      if (!change("value", value, { reason, event })) {
        return false;
      }
      if (!isControlled()) {
        read(value);
      }
      const el = control();
      if (!el || el.value === value) {
        return true;
      }
      writing2 = true;
      writeValue(el, value, { asUser: true });
      writing2 = false;
      return true;
    }
    function typed(el, event) {
      if (writing2) {
        return;
      }
      const previous = store.get().value;
      const next = el.value;
      if (next === previous) {
        return;
      }
      if (change("value", next, { reason: "input-change", event })) {
        if (!isControlled()) {
          read(next);
        }
        return;
      }
      if (event.isComposing) {
        return;
      }
      const inserted = next.length - previous.length;
      const caret = Math.max(0, (el.selectionStart ?? next.length) - inserted);
      el.value = previous;
      el.setSelectionRange?.(caret, caret);
    }
    const api = {
      getValue: () => store.get().value,
      setValue: (value, {
        reason = "imperative",
        event
      } = {}) => write(value, reason, event),
      clear: ({
        reason = "imperative",
        event
      } = {}) => write("", reason, event),
      focus: () => control()?.focus(),
      internal: {
        clearPress: (event) => write("", "clear-press", event),
        bind(el) {
          textFields.set(el, api);
          if (!isControlled()) {
            if (el.value === "" && el.defaultValue === "") {
              writeValue(el, store.get().value);
            }
            read(el.value);
          }
          const cleanups = [
            // Typing goes through `change` below, and resets through the reset listener.
            watchValue(el, (source) => {
              if (source === "write" && !isControlled()) {
                read(el.value);
              }
            }),
            // Bound on the element, so it runs before frameworks hear the event at their root.
            on(el, "input", (event) => typed(el, event)),
            // Browsers differ on whether an `input` follows the end of a composition.
            on(el, "compositionend", (event) => typed(el, event)),
            // A reset puts the default back, unless the change is canceled.
            on(
              el.ownerDocument,
              "reset",
              (event) => {
                if (event.target !== el.form) {
                  return;
                }
                afterReset(event, () => {
                  if (el.value === store.get().value) {
                    return;
                  }
                  if (!change("value", el.value, { reason: "reset" })) {
                    el.value = store.get().value;
                  } else if (!isControlled()) {
                    read(el.value);
                  }
                });
              },
              { capture: true }
            )
          ];
          return () => {
            textFields.delete(el);
            cleanups.forEach((cleanup) => cleanup());
          };
        }
      }
    };
    return api;
  }
  function focusFromSurroundings(event, container, field2) {
    const target = event?.target;
    if (!(target instanceof Element) || !container || !field2) {
      return;
    }
    const interactive = target.closest(
      "button, a[href], input, textarea, select, label, [tabindex]"
    );
    if (interactive && container.contains(interactive)) {
      return;
    }
    field2.focus();
  }

  // node_modules/@ui-sdk/core/dist/components/input/input.js
  init_selects();
  function textState(state, props) {
    return {
      filled: state.filled,
      disabled: !!props.disabled,
      readOnly: !!props.readOnly,
      required: !!props.required
    };
  }
  function textAttrs(state, props) {
    return {
      "data-filled": state.filled ? "" : void 0,
      "data-disabled": props.disabled ? "" : void 0,
      "data-readonly": props.readOnly ? "" : void 0,
      "data-required": props.required ? "" : void 0
    };
  }
  var inputPrimitive = /* @__PURE__ */ definePrimitive({
    name: "input",
    options: {
      value: "string",
      defaultValue: "string",
      onValueChange: "callback",
      controller: "value"
    },
    state: (options) => initialText(options),
    live: ["value"],
    sync: syncText,
    api: (context2) => textFieldApi(context2, createChange(context2), "root"),
    slots: (slot) => ({
      root: slot({
        props: { disabled: "boolean", readOnly: "boolean", required: "boolean" },
        state: (state, { props }) => textState(state, props),
        attrs: (state, { props }) => textAttrs(state, props),
        bind: (el, { api }) => api.internal.bind(el)
      })
    }),
    agent: { actions: ["setValue", "clear"] }
  });
  var input = inputPrimitive;
  function fitContent(el) {
    if (typeof CSS !== "undefined" && CSS.supports("field-sizing", "content")) {
      el.style.setProperty("field-sizing", "content");
      return () => el.style.removeProperty("field-sizing");
    }
    let width = -1;
    const fit = () => {
      el.style.height = "auto";
      const borders = el.offsetHeight - el.clientHeight;
      el.style.height = `${el.scrollHeight + borders}px`;
    };
    fit();
    const unwatch = watchValue(el, fit);
    const observer = typeof ResizeObserver === "undefined" ? void 0 : new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === width) {
        return;
      }
      width = entry.contentRect.width;
      fit();
    });
    observer?.observe(el);
    return () => {
      unwatch();
      observer?.disconnect();
      el.style.removeProperty("height");
    };
  }
  var textareaPrimitive = /* @__PURE__ */ definePrimitive({
    name: "textarea",
    options: {
      value: "string",
      defaultValue: "string",
      onValueChange: "callback",
      controller: "value",
      autoResize: "boolean",
      onSubmit: "callback",
      submitShortcut: "string"
    },
    // `autoResize` is state, so turning it on or off after mount reaches the bound root.
    state: (options) => ({
      ...initialText(options),
      autoResize: !!options.autoResize
    }),
    live: ["value"],
    sync: (options) => ({
      ...syncText(options),
      autoResize: !!options.autoResize
    }),
    api: (context2) => {
      const field2 = textFieldApi(context2, createChange(context2), "root");
      const { options, store, element: element2 } = context2;
      function submitKey(event) {
        const shortcut = options().submitShortcut;
        if (!shortcut || event.key !== "Enter") {
          return;
        }
        const mod = isApple() ? event.metaKey : event.ctrlKey;
        const submits = shortcut === "enter" ? !event.shiftKey && !mod && !event.altKey : mod && !event.shiftKey;
        if (!submits) {
          return;
        }
        const { onSubmit } = options();
        const form = element2("root")?.form;
        if (!onSubmit && !form) {
          return;
        }
        event.preventDefault();
        if (onSubmit) {
          onSubmit(store.get().value, { event });
        } else {
          form?.requestSubmit();
        }
      }
      return { ...field2, internal: { ...field2.internal, submitKey } };
    },
    slots: (slot) => ({
      root: slot({
        props: { disabled: "boolean", readOnly: "boolean", required: "boolean" },
        state: (state, { props }) => textState(state, props),
        attrs: (state, { props }) => textAttrs(state, props),
        on: { keydown: (event, { api }) => api.internal.submitKey(event) },
        bind: (el, { api, store }) => {
          const unbind = api.internal.bind(el);
          let unfit;
          const follow = () => {
            const { autoResize } = store.get();
            if (autoResize && !unfit) {
              unfit = fitContent(el);
            } else if (!autoResize && unfit) {
              unfit();
              unfit = void 0;
            }
          };
          follow();
          const unfollow = select(store, "autoResize", true, follow);
          return () => {
            unbind();
            unfollow();
            unfit?.();
          };
        }
      })
    }),
    agent: { actions: ["setValue", "clear"] }
  });
  var textarea = textareaPrimitive;
  var fieldSelector = 'input:not([type="hidden"]), textarea';
  function groupAttrs(state) {
    return {
      "data-filled": state.filled ? "" : void 0,
      "data-disabled": state.disabled ? "" : void 0,
      "data-readonly": state.readOnly ? "" : void 0
    };
  }
  var inputGroupPrimitive = /* @__PURE__ */ definePrimitive({
    // Its parts are `input-group` and `input-clear`.
    name: "input",
    state: (_options) => ({
      filled: false,
      disabled: false,
      readOnly: false
    }),
    api: ({ store, element: element2 }) => {
      inputSource();
      const control = () => element2("group")?.querySelector(fieldSelector) ?? void 0;
      return {
        control,
        // Empties the field the way typing would, then returns focus to it.
        clear(event) {
          const el = control();
          if (!el || store.get().disabled || store.get().readOnly) {
            return;
          }
          const field2 = textFields.get(el);
          if (field2) {
            field2.internal.clearPress(event);
          } else {
            writeValue(el, "", { asUser: true });
          }
          el.focus();
        },
        internal: {
          // Sets the state the group shows, like the docs' attribute tables do without a field.
          update: (state) => store.set(state)
        }
      };
    },
    slots: (slot) => ({
      group: slot({
        state: (state) => state,
        attrs: (state) => groupAttrs(state),
        // Presses on the group's own text and icons focus the field, like a label would.
        press: ({ api, el }, event) => focusFromSurroundings(event, el, api.control()),
        bind: (el, { store, api }) => {
          let field2;
          let fieldsetDisabled2 = false;
          let cleanups = [];
          let active = true;
          const update = () => {
            if (!field2) {
              return;
            }
            store.set({
              filled: field2.value !== "",
              disabled: field2.disabled || fieldsetDisabled2,
              readOnly: field2.readOnly
            });
          };
          const find = () => {
            if (!active) {
              return;
            }
            const next = api.control();
            if (next === field2) {
              return;
            }
            cleanups.forEach((cleanup) => cleanup());
            cleanups = [];
            field2 = next;
            if (!field2) {
              return;
            }
            const observer = new MutationObserver(update);
            observer.observe(field2, { attributeFilter: ["disabled", "readonly"] });
            cleanups = [
              watchValue(field2, update),
              watchFieldsets(field2, (disabled) => {
                fieldsetDisabled2 = disabled;
                update();
              }),
              () => observer.disconnect()
            ];
            update();
          };
          queueMicrotask(find);
          const children = new MutationObserver(find);
          children.observe(el, { childList: true, subtree: true });
          return () => {
            active = false;
            children.disconnect();
            cleanups.forEach((cleanup) => cleanup());
          };
        }
      }),
      // Shown while the field has text it can clear.
      clear: slot({
        present: (state) => state.filled && !state.disabled && !state.readOnly,
        state: (state) => state,
        attrs: (state) => ({ type: "button", ...groupAttrs(state) }),
        press: ({ api }, event) => api.clear(event)
      })
    }),
    // The Input inside is the component an agent reads and clears.
    agent: { shown: () => false }
  });
  var inputGroup = inputGroupPrimitive;

  // node_modules/@ui-sdk/web/dist/input.js
  var textApi = [
    "getValue",
    "setValue",
    "clear",
    "focus"
  ];
  var textState2 = {
    value: {
      get: (api) => api.getValue(),
      set: (api, value) => api.setValue(value ?? "")
    }
  };
  var controlProps = {
    attributes: ["disabled", "readonly", "required"],
    read: (el) => {
      const field2 = el;
      return {
        disabled: field2.disabled,
        readOnly: field2.readOnly,
        required: field2.required
      };
    }
  };
  function defineInputElements() {
    createParts(input, {
      root: {
        tag: "ui-input",
        display: "contents",
        children: { root: (el) => el.querySelector(":scope > input") },
        childProps: controlProps,
        state: textState2,
        api: textApi
      }
    });
    createParts(textarea, {
      root: {
        tag: "ui-textarea",
        display: "contents",
        children: { root: (el) => el.querySelector(":scope > textarea") },
        childProps: controlProps,
        // The submit shortcut submits the form the textarea is in, so a form's own
        // submit event hears it. A bubbling "submit" event would reach the form too.
        silent: ["onSubmit"],
        state: textState2,
        api: textApi
      }
    });
  }
  function defineInputGroupElements() {
    createParts(inputGroup, {
      root: { tag: "ui-input-group", self: "group", display: "block" },
      clear: {
        tag: "ui-input-clear",
        display: "contents",
        target: wrappedChild("button")
      }
    });
  }

  // node_modules/@ui-sdk/web/dist/entries/input.js
  defineInputElements();
  defineInputGroupElements();

  // node_modules/@ui-sdk/core/dist/components/listbox/listbox-root-parts.js
  init_dev_stub();
  init_selects();
  function rootState3(state, api) {
    return {
      multiple: state.multiple,
      orientation: state.orientation,
      disabled: isDisabled(state),
      readOnly: state.readOnly,
      required: state.required,
      items: api.internal.listbox.visibleData()?.list ?? noItems2
    };
  }
  function valueOfItem(key, props, api) {
    const { listbox: listbox2 } = api.internal;
    return listbox2.dataItems() ? listbox2.valueOf(key) ?? props.value : props.value;
  }
  function itemState(state, key, props, api) {
    return {
      highlighted: state.highlighted === key,
      selected: api.internal.selection.isSelected(
        key,
        valueOfItem(key, props, api)
      ),
      disabled: !!props.disabled || isDisabled(state)
    };
  }
  function isStop(state, key, props, api) {
    if (state.stop !== null) {
      return state.stop === key;
    }
    const eligible = api.internal.selection.keys().length ? api.internal.selection.isSelected(key, valueOfItem(key, props, api)) : !props.disabled;
    return api.internal.claim(key, eligible);
  }
  var listboxSlots = (slot) => ({
    // The listbox itself. It takes focus only to hand it to the option that holds the tab stop.
    root: slot({
      role: "listbox",
      keys: (state) => [
        ...state.orientation === "horizontal" ? ["ArrowLeft", "ArrowRight"] : ["ArrowUp", "ArrowDown"],
        "Home",
        "End",
        "Enter",
        " ",
        "typeahead",
        ...state.multiple ? ["mod+a"] : []
      ],
      state: (state, { api }) => rootState3(state, api),
      attrs: (state, { id }) => {
        const disabled = isDisabled(state);
        return {
          id: `${id}-listbox`,
          // Never a tab stop of its own, even disabled, when browsers make scrolling containers one.
          tabindex: "-1",
          "aria-multiselectable": state.multiple ? "true" : void 0,
          "aria-orientation": state.orientation,
          "aria-disabled": disabled ? "true" : void 0,
          "aria-readonly": state.readOnly ? "true" : void 0,
          "aria-required": state.required ? "true" : void 0,
          "data-orientation": state.orientation,
          ...formAttrs(state)
        };
      },
      on: {
        keydown: (event, { api, el }) => el && api.internal.onKeyDown(event, el),
        focusin(event, { api, el }) {
          if (event.target === el) {
            api.internal.focusStop();
          }
        },
        focusout(event, { api, el }) {
          if (!el?.contains(event.relatedTarget)) {
            api.internal.blurred(event);
          }
        }
      },
      bind(el, context2) {
        const { id } = context2;
        const unbind = bindFormRoot(el, context2, { focusOnSelfClick: false });
        if (dev) {
          warnIfUnnamed(
            el,
            "The listbox has no accessible name. Add a Field label, an aria-label or aria-labelledby.",
            {
              component: "listbox",
              id
            }
          );
        }
        return unbind;
      }
    }),
    item: slot({
      role: "option",
      focus: "roving",
      props: {
        value: "key",
        label: "string",
        disabled: "boolean",
        index: "number",
        // Internal: passed by renderers, from the group it's inside.
        group: { kind: "string", from: "group.id" }
      },
      // Without a stop yet, the first eligible item claims it, so every item hears that change.
      selects: selects({
        highlighted: ({ key }) => [key],
        stop: ({ key }) => [key, null]
      }),
      state: (state, { key, props, api }) => itemState(state, key, props, api),
      attrs: (state, { id, key, props, api }) => {
        const { selected, disabled } = itemState(state, key, props, api);
        return {
          id: `${id}-option-${idPart(key)}`,
          tabindex: isDisabled(state) ? void 0 : isStop(state, key, props, api) ? "0" : "-1",
          "aria-selected": String(selected),
          "aria-disabled": disabled ? "true" : void 0,
          ...positionAttrs(props.index, api.internal.listbox),
          "data-selected": selected ? "" : void 0,
          "data-disabled": disabled ? "" : void 0
        };
      },
      live: live((state, { key }) => ({
        "data-highlighted": state.highlighted === key ? "" : void 0
      })),
      on: {
        focusin: (event, { api, key }) => api.internal.focused(key),
        // Shift with a press selects a range, not the page's text.
        mousedown(event, { store }) {
          if (event.shiftKey && store.get().multiple) {
            event.preventDefault();
          }
        }
      },
      press: ({ api, key }, event) => api.internal.press(key, event),
      bind: (el, context2) => registerItem(el, context2)
    }),
    "item-indicator": slot(
      itemIndicatorPart()
    ),
    // An icon inside an item. Screen readers and typeahead skip it.
    "item-icon": slot(
      itemIconPart({
        component: "listbox",
        ...optionIcon
      })
    ),
    // A group of items, named by its label. Nothing filters a listbox, so it never hides.
    group: slot({
      role: "group",
      // Its id is made for it, and names the group its items and label are in.
      props: { id: "id" },
      attrs: (state, { id, key }) => ({
        "aria-labelledby": groupLabelledBy(state, id, key)
      })
    }),
    "group-label": slot(groupLabelPart()),
    // A listbox may only hold options and groups, so separators are hidden from assistive technology.
    separator: slot({
      role: "none",
      attrs: () => ({ "aria-hidden": "true" })
    }),
    "form-input": slot(hiddenInputPart("form-input")),
    "value-input": slot(valueInputPart())
  });

  // node_modules/@ui-sdk/core/dist/foundation/focus/roving-focus.js
  init_env();
  init_part();
  function createClaim() {
    let claimed3;
    return (key, eligible) => {
      if (claimed3 === void 0 && eligible) {
        claimed3 = key;
      }
      return claimed3 === key;
    };
  }
  function createRovingFocus(context2, options) {
    const { store } = context2;
    const key = options.key;
    const remember2 = options.remember ?? true;
    const order = createOrder();
    const claim2 = createClaim();
    let remembered = null;
    let pending2 = null;
    let holder = null;
    const orientation2 = () => options.orientation?.() ?? "vertical";
    const isDisabled2 = (item) => options.disabled?.(item) ?? false;
    const isFocusable = (item) => options.focusable?.(item) ?? true;
    const isPreferred = (item) => options.preferred?.(item) ?? false;
    function stopFor(preferred = isPreferred) {
      const list = order.list();
      if (!list.length) {
        return;
      }
      if (pending2 && !list.some(({ part }) => part.key === pending2.key && isFocusable(part))) {
        return;
      }
      const candidates = list.map(({ part }) => ({
        key: part.key,
        disabled: isDisabled2(part),
        focusable: isFocusable(part),
        preferred: preferred(part)
      }));
      return rovingStop(candidates, remembered);
    }
    function check() {
      const stop2 = stopFor();
      if (stop2 !== void 0) {
        store.set({ [key]: stop2 });
      }
    }
    let queued2 = false;
    let joined = false;
    function queue(joinedOrLeft) {
      joined ||= joinedOrLeft;
      if (queued2) {
        return;
      }
      queued2 = true;
      queueMicrotask(() => {
        queued2 = false;
        check();
        focusPending();
        if (joined) {
          options.onItemsChange?.();
        }
        joined = false;
      });
    }
    function moveTo(itemKey2, from) {
      const move = pending2 = { key: itemKey2, from };
      const before = remembered;
      if (remember2) {
        remembered = itemKey2;
      }
      store.set({ [key]: itemKey2 });
      setTimeout(() => {
        focusPending();
        if (pending2 !== move) {
          return;
        }
        pending2 = null;
        if (remembered === itemKey2) {
          remembered = before;
        }
        queue(false);
      });
    }
    const focusOn = (el) => {
      el.focus();
      return el.ownerDocument.activeElement === el;
    };
    function focusPending() {
      if (!pending2) {
        return;
      }
      const item = order.list().find(({ part }) => part.key === pending2.key);
      if (!item || !isFocusable(item.part)) {
        return;
      }
      const active = item.el.ownerDocument.activeElement;
      const untouched = active === pending2.from || active === null || active === item.el.ownerDocument.body;
      if (!untouched || focusOn(item.el)) {
        pending2 = null;
      }
    }
    let stop = store.get()[key];
    context2.onDestroy(
      store.subscribe(() => {
        const was = stop;
        stop = store.get()[key];
        if (stop === was && order.size()) {
          queue(false);
        }
      })
    );
    function focusables() {
      return order.list().filter(({ part }) => isFocusable(part)).map(({ part, el }) => ({ key: part.key, props: part.props, el }));
    }
    const roving = {
      /** Joins a bound part to the group. Call it from the item slot's `bind` and return its cleanup. */
      bind(el, part) {
        const leave = order.add({ key: part.key, el, part });
        if (pending2?.left && pending2.from === el) {
          const was = pending2.key;
          pending2.key = part.key;
          if (remembered === was) {
            remembered = part.key;
          }
          if (store.get()[key] === was) {
            store.set({ [key]: part.key });
          }
          if (el.ownerDocument.activeElement === el) {
            holder = el;
          }
        }
        const focused = () => {
          holder = el;
          if (remember2) {
            roving.remember(part.key);
          }
        };
        const blurred = () => {
          if (holder === el) {
            holder = null;
          }
        };
        el.addEventListener("focus", focused);
        el.addEventListener("blur", blurred);
        let wasDisabled = isDisabled2(part);
        let wasPreferred = isPreferred(part);
        const unwatch = onProps(part, () => {
          if (isDisabled2(part) === wasDisabled && isPreferred(part) === wasPreferred) {
            return;
          }
          wasDisabled = isDisabled2(part);
          wasPreferred = isPreferred(part);
          queue(false);
        });
        queue(true);
        return () => {
          unwatch();
          el.removeEventListener("focus", focused);
          el.removeEventListener("blur", blurred);
          const doc = el.ownerDocument;
          const had = !!doc && (doc.activeElement === el || holder === el && doc.activeElement === doc.body);
          if (holder === el) {
            holder = null;
          }
          leave();
          if (had && !pending2 && store.get()[key] === part.key) {
            const wait = pending2 = { key: part.key, from: el, left: true };
            setTimeout(() => {
              if (pending2 !== wait) {
                return;
              }
              pending2 = null;
              queue(false);
            });
          }
          queue(true);
        };
      },
      /** The item's `tabindex`: `"0"` for the item with the stop, `"-1"` for the rest. Pure, so `attrs` can call it. */
      tabIndex(state, part) {
        const stop2 = state[key] ?? null;
        if (stop2 !== null) {
          return stop2 === part.key ? "0" : "-1";
        }
        const eligible = options.claims ? options.claims(state, part) : !isDisabled2(part) && isFocusable(part);
        return claim2(part.key, eligible) ? "0" : "-1";
      },
      /**
       * Moves focus for a key pressed on an item's element. Returns the key it
       * moved to, the key it moved from and whether Shift was held, so the
       * caller can extend a selection, or `undefined` when the key isn't the
       * group's. At either end without `loop`, `key` is `from`.
       */
      keydown(event, el) {
        if (event.defaultPrevented || event.altKey) {
          return;
        }
        const list = focusables();
        const from = list.find((item) => item.el === el);
        if (!from) {
          return;
        }
        const rtl = isRTL(el);
        let to;
        if (options.move) {
          to = options.move(event, { from, items: list, rtl });
        } else if (!event.ctrlKey && !event.metaKey) {
          const step = stepFor(event.key, orientation2(), rtl);
          if (step !== void 0) {
            to = list[moveIndex(
              list.indexOf(from),
              step,
              list.length,
              options.loop?.() ?? false
            )]?.key;
          }
        }
        if (to === void 0) {
          return;
        }
        event.preventDefault();
        const next = list.find((item) => item.key === to);
        if (!next || next !== from && !focusOn(next.el)) {
          moveTo(to, el);
        }
        return { key: to, from: from.key, shift: event.shiftKey };
      },
      /** The items that can take focus now, in document order, with their elements. */
      items: focusables,
      /**
       * Focuses an item, or the one with the stop, or the first. An item that
       * isn't rendered or focusable yet takes the stop now and focus once it can.
       */
      focus(itemKey2) {
        if (itemKey2 !== void 0) {
          const item = order.list().find(({ part }) => part.key === itemKey2);
          if (item && isFocusable(item.part) && focusOn(item.el)) {
            return;
          }
          moveTo(
            itemKey2,
            typeof document === "undefined" ? null : document.activeElement
          );
          return;
        }
        const list = order.list();
        (list.find((item) => item.key === stop) ?? list[0])?.el.focus();
      },
      /**
       * Moves the stop to an item as if focus had landed on it, for an item
       * whose focus went elsewhere, like a menubar trigger whose menu took it.
       * A group that doesn't `remember` ignores it, since its stop follows the
       * preferred item.
       */
      remember(itemKey2) {
        if (!remember2) {
          return;
        }
        remembered = itemKey2;
        store.set({ [key]: itemKey2 });
      },
      /** Moves the stop to where the group's rules put it now. It also runs on its own after items join or leave and after state changes. */
      check,
      /**
       * Where the group's rules would put the stop if `preferred` said which
       * items are preferred, like the tab a value from options selects, without
       * moving it. Undefined while the bound items can't decide it, like when
       * none is preferred yet: the item may be about to bind, as when its value
       * changed, and the group decides once it has.
       */
      stopFor: (preferred) => order.list().some(({ part }) => preferred(part)) ? stopFor(preferred) : void 0
    };
    return roving;
  }

  // node_modules/@ui-sdk/core/dist/foundation/selection/listbox-range.js
  function keysBetween(order, from, to) {
    const start = order.indexOf(from);
    const end = order.indexOf(to);
    if (start === -1 || end === -1) {
      return [];
    }
    return order.slice(Math.min(start, end), Math.max(start, end) + 1);
  }
  function rangeSelection(order, anchor, to, {
    additive,
    selectable
  }) {
    const range = keysBetween(order, anchor.key, to).filter(selectable);
    const base = additive ? anchor.base : [];
    const kept = new Set(base);
    return [...base, ...range.filter((key) => !kept.has(key))];
  }
  function toggledKeys(selected, key) {
    return selected.includes(key) ? selected.filter((item) => item !== key) : [...selected, key];
  }
  function allToggled(selected, selectable) {
    const current = new Set(selected);
    if (selectable.length && selectable.every((key) => current.has(key))) {
      const removed = new Set(selectable);
      return selected.filter((key) => !removed.has(key));
    }
    return [...selected, ...selectable.filter((key) => !current.has(key))];
  }
  function isSameKeys(a, b) {
    return a.length === b.length && a.every((key, index) => key === b[index]);
  }

  // node_modules/@ui-sdk/core/dist/foundation/selection/selection-model.js
  function createKeySelection(config) {
    const { keys, set, order, selectable } = config;
    let anchor = null;
    return {
      toggle(key, why) {
        if (!selectable(key)) {
          return;
        }
        const next = toggledKeys(keys(), key);
        if (set(next, why)) {
          anchor = { key, base: next };
        }
      },
      replace(key, why) {
        if (!selectable(key)) {
          return;
        }
        if (!isSameKeys(keys(), [key]) && !set([key], why)) {
          return;
        }
        anchor = { key, base: [key] };
      },
      // Selects from the anchor to `to`. Without an anchor, the range starts at
      // `from`, the item focus was on, or at `to` itself.
      extend(to, { from, additive }, why) {
        const list = order();
        if (!anchor || !list.includes(anchor.key)) {
          anchor = { key: from ?? to, base: keys() };
        }
        const next = rangeSelection(list, anchor, to, { additive, selectable });
        if (!isSameKeys(next, keys())) {
          set(next, why);
        }
      },
      toggleAll(why) {
        const next = allToggled(keys(), order().filter(selectable));
        if (!isSameKeys(next, keys())) {
          set(next, why);
        }
      },
      anchor: () => anchor?.key ?? null,
      resetAnchor() {
        anchor = null;
      }
    };
  }

  // node_modules/@ui-sdk/core/dist/components/listbox/listbox-root-keyboard.js
  init_env();
  var withModifier = (event) => event.ctrlKey || event.metaKey;
  function createListboxKeyboard({
    store,
    listbox: listbox2,
    choose,
    toggle,
    replace,
    extend,
    toggleAll,
    anchorKey
  }) {
    function navigate(event, step, current) {
      const state = store.get();
      const extending = event.shiftKey && state.multiple;
      const next = extending ? listbox2.stepKey(step, { loop: false }) : listbox2.stepKey(step);
      if (next === void 0) {
        return;
      }
      event.preventDefault();
      if (next !== current) {
        listbox2.highlight(next, { event });
      }
      const why = { reason: "list-navigation", event };
      if (extending) {
        return extend(next, { from: current, additive: additive(event) }, why);
      }
      if (state.activation !== "automatic" || withModifier(event)) {
        return;
      }
      if (state.multiple) {
        replace(next, why);
      } else {
        choose(next, why);
      }
    }
    const additive = (event) => store.get().activation === "manual" || withModifier(event);
    function activate(event, current) {
      if (current === null) {
        return;
      }
      event.preventDefault();
      const el = listbox2.element(current);
      if (event.key === "Enter" && el?.matches("a[href]")) {
        return el.click();
      }
      const state = store.get();
      const why = { reason: "item-press", event };
      if (!state.multiple) {
        return choose(current, why);
      }
      if (event.shiftKey) {
        return extend(
          current,
          { from: anchorKey(), additive: additive(event) },
          why
        );
      }
      if (state.activation === "manual" || withModifier(event)) {
        return toggle(current, why);
      }
      replace(current, why);
    }
    function typed(event, current) {
      const found2 = listbox2.search(event.key, current);
      if (!found2) {
        return false;
      }
      event.preventDefault();
      listbox2.highlight(found2.key, { event });
      const state = store.get();
      if (state.activation !== "automatic") {
        return true;
      }
      const why = { reason: "list-navigation", event };
      if (state.multiple) {
        replace(found2.key, why);
      } else {
        choose(found2.key, why);
      }
      return true;
    }
    function onKeyDown(event, root) {
      if (event.target.closest('[role="listbox"]') !== root) {
        return;
      }
      const state = store.get();
      if (isDisabled(state) || event.altKey) {
        return;
      }
      const current = state.highlighted ?? state.stop;
      if (withModifier(event) && event.key.toLowerCase() === "a" && !event.shiftKey) {
        if (!state.multiple) {
          return;
        }
        event.preventDefault();
        return toggleAll({ reason: "list-navigation", event });
      }
      const step = stepFor(event.key, state.orientation, isRTL(root));
      if (step !== void 0) {
        return navigate(event, step, current);
      }
      if (event.key === " " && listbox2.typing()) {
        if (typed(event, current)) {
          return;
        }
        listbox2.resetTyping();
      }
      if (event.key === " " || event.key === "Enter") {
        return activate(event, current);
      }
      if (isTypeaheadKey(event) && !withModifier(event)) {
        typed(event, current);
      }
    }
    function press2(key, event) {
      const state = store.get();
      if (isDisabled(state)) {
        return;
      }
      const el = listbox2.element(key);
      if (el && el.ownerDocument.activeElement !== el) {
        el.focus({ preventScroll: true });
      }
      const why = { reason: "item-press", event };
      if (!state.multiple) {
        return choose(key, why);
      }
      const pointer = event;
      const source = event ? sourceOf2(event) : "touch";
      const modifiers = !!pointer && source !== "touch" && source !== "virtual";
      if (modifiers && pointer.shiftKey) {
        return extend(key, { from: null, additive: additive(pointer) }, why);
      }
      if (state.activation === "manual" || !modifiers || withModifier(pointer)) {
        return toggle(key, why);
      }
      replace(key, why);
    }
    return { onKeyDown, press: press2 };
  }

  // node_modules/@ui-sdk/core/dist/components/listbox/listbox-root-api.js
  function initialListboxStore(options) {
    const empty = () => options.multiple ? [] : null;
    return {
      value: options.value !== void 0 ? options.value : options.defaultValue ?? empty(),
      initial: options.defaultValue ?? empty(),
      highlighted: null,
      stop: null,
      labels: 0,
      icons: 0,
      formDisabled: false,
      groupLabels: [],
      ...syncListboxStore(options)
    };
  }
  function syncListboxStore(options) {
    return {
      multiple: !!options.multiple,
      // The APG's models: selection follows focus in a single list, and waits for Space with several.
      activation: options.activation ?? (options.multiple ? "manual" : "automatic"),
      deselectable: !!options.deselectable,
      orientation: orientationOf(options.orientation, "vertical"),
      keepInView: options.keepInView ?? true,
      disabled: !!options.disabled,
      readOnly: !!options.readOnly,
      required: !!options.required,
      name: options.name,
      form: options.form,
      items: options.items,
      // Like a native select's default, changing it changes what a reset returns to.
      ...options.defaultValue === void 0 ? {} : { initial: options.defaultValue },
      ...options.value === void 0 ? {} : { value: options.value }
    };
  }
  var noFiltering = { data: (data) => data, matches: () => true };
  function listboxApiBody(context2) {
    const { id, store, options, element: element2 } = context2;
    const change = createChange(context2);
    const toKey = (value) => itemKey(value, options().itemToValue);
    const rootElement = () => element2("root");
    let focusInside = false;
    let remembered = null;
    let requested = null;
    let checkQueued = false;
    let revealed = false;
    const listbox2 = createListboxEngine(
      {
        store,
        focus: "real",
        items: () => store.get().items,
        toKey,
        filter: () => void 0,
        query: () => "",
        loop: () => options().loop ?? true,
        skipDisabled: true,
        active: () => focusInside,
        container: rootElement,
        keepInView: () => store.get().keepInView,
        onHighlight: (key, index, event) => options().onHighlight?.(
          key === null ? null : listbox2.valueOf(key) ?? null,
          { index, event }
        ),
        onRegister: () => queueCheck()
      },
      noFiltering
    );
    const selection = createValueSelection({
      store,
      options,
      listbox: listbox2,
      toKey,
      onDestroy: context2.onDestroy
    });
    const icons = createItemIcons(store);
    const order = () => listbox2.entries().map((entry) => entry.key);
    const selectable = (key) => {
      const entry = listbox2.find(key);
      return !!entry && !listbox2.disabled(entry);
    };
    function stopKey() {
      const list = listbox2.entries();
      if (remembered !== null && list.some((entry) => entry.key === remembered)) {
        return remembered;
      }
      const active = remembered === null ? null : rootElement()?.ownerDocument.activeElement;
      const held3 = active && list.find((entry) => element2("item", entry.key) === active);
      if (held3) {
        if (store.get().highlighted === remembered) {
          store.set({ highlighted: held3.key });
        }
        return remembered = held3.key;
      }
      const enabled = list.filter((entry) => !entry.disabled);
      const selected = enabled.find(
        (entry) => selection.isSelected(entry.key, entry.value)
      );
      return (selected ?? enabled[0] ?? list[0])?.key ?? null;
    }
    function check() {
      checkQueued = false;
      const stop = stopKey();
      if (stop !== store.get().stop) {
        store.set({ stop });
      }
      if (!revealed) {
        revealed = revealSelected(stop);
      }
    }
    function revealSelected(key) {
      const el = key === null ? void 0 : listbox2.element(key);
      const root = rootElement();
      if (!el?.isConnected || !root) {
        return false;
      }
      if (selection.keys().length && store.get().keepInView) {
        revealInList(el, root);
      }
      return true;
    }
    function queueCheck() {
      if (checkQueued) {
        return;
      }
      checkQueued = true;
      queueMicrotask(check);
    }
    const formElement = () => {
      const root = rootElement();
      return formInternals(root) ? root : element2("form-input");
    };
    function setValue(value, { reason, event }) {
      const state = store.get();
      if (reason !== "reset" && (isDisabled(state) || state.readOnly)) {
        return false;
      }
      selection.stopRestoring();
      const done = change("value", value, { reason, event });
      if (done && reason !== "reset" && reason !== "restore") {
        dispatchChange(formElement());
      }
      return done;
    }
    function setKeys(keys, why) {
      const current = new Map(
        selection.keys().map((key, index) => [key, selection.values()[index]])
      );
      const value = keys.map(
        (key) => current.has(key) ? current.get(key) : listbox2.valueOf(key)
      );
      requested = keys;
      const done = setValue(value, why);
      if (!done) {
        requested = null;
      }
      return done;
    }
    function choose(key, why) {
      const entry = listbox2.find(key);
      if (!entry || listbox2.disabled(entry)) {
        return;
      }
      if (selection.isSelected(key, entry.value)) {
        if (store.get().deselectable && why.reason === "item-press") {
          setValue(null, why);
        }
        return;
      }
      setValue(entry.value, why);
    }
    const keySelection = createKeySelection({
      keys: selection.keys,
      set: setKeys,
      order,
      selectable
    });
    const { toggle, replace, extend } = keySelection;
    function toggleAll(why) {
      if (store.get().multiple) {
        keySelection.toggleAll(why);
      }
    }
    function focused(key) {
      focusInside = true;
      remembered = key;
      store.set({ highlighted: key, stop: key });
    }
    function focusStop() {
      focusInside = true;
      const { stop } = store.get();
      const key = stop ?? stopKey();
      const el = key === null ? void 0 : listbox2.element(key);
      if (el?.isConnected) {
        el.focus({ preventScroll: true });
      }
    }
    function blurred(event) {
      const target = event.target;
      const settle2 = () => {
        if (!target.isConnected) {
          return;
        }
        if (rootElement()?.contains(target.ownerDocument?.activeElement ?? null)) {
          return;
        }
        focusInside = false;
        store.set({ highlighted: null });
      };
      queueMicrotask(() => queueMicrotask(settle2));
    }
    const keyboard = createListboxKeyboard({
      store,
      listbox: listbox2,
      choose,
      toggle,
      replace,
      extend,
      toggleAll,
      anchorKey: keySelection.anchor
    });
    let previousValue = store.get().value;
    store.subscribe(() => {
      const { value } = store.get();
      if (value === previousValue) {
        return;
      }
      previousValue = value;
      const keys = selection.keys();
      const own = requested !== null && isSameKeys(requested, keys);
      requested = null;
      if (!own || !keys.length) {
        keySelection.resetAnchor();
      }
      if (!own && !focusInside) {
        remembered = null;
      }
      queueCheck();
    });
    const api = {
      id,
      getValue: () => store.get().value,
      setValue: (value, { reason = "imperative", event } = {}) => setValue(value, { reason, event }),
      clear: ({ reason = "imperative", event } = {}) => setValue(selection.empty(), { reason, event }),
      selectAll({ reason = "imperative", event } = {}) {
        if (!store.get().multiple) {
          return false;
        }
        const missing = order().filter(
          (key) => selectable(key) && !selection.isSelected(key)
        );
        return missing.length > 0 && setKeys([...selection.keys(), ...missing], { reason, event });
      },
      focus: focusStop,
      // Internal. Used by slots and adapters.
      internal: {
        options,
        listbox: listbox2,
        selection,
        icons,
        keyOf: toKey,
        claim: createClaim(),
        focused,
        focusStop,
        blurred,
        onKeyDown: keyboard.onKeyDown,
        press: keyboard.press,
        controlElement: rootElement,
        formElement,
        serialized: selection.keys,
        // The props an item last rendered with, read live by its registration.
        itemProps: (key) => context2.props("item", key),
        // Web components read `default-value` as keys when items come later. Once
        // they arrive, a value that still names them takes their values, with no
        // change: it's still the default.
        adoptValue: (value) => store.set({ value }),
        reset() {
          setValue(store.get().initial, { reason: "reset" });
        },
        // The browser restores a disabled or read-only control too, as a native one.
        restore(saved) {
          selection.restore(
            saved,
            (value) => change("value", value, { reason: "restore" })
          );
        },
        setFormDisabled(formDisabled) {
          store.set({ formDisabled });
        },
        // Picks the item a browser's autofill wrote, by its value or its label.
        autofill(text) {
          const lower = text.toLowerCase();
          const entry = listbox2.entries().find(
            (entry2) => entry2.key.toLowerCase() === lower || entry2.label.toLowerCase() === lower
          );
          if (entry && !store.get().multiple) {
            setValue(entry.value, { reason: "item-press" });
          }
        }
      }
    };
    if (store.get().items) {
      check();
    }
    return api;
  }
  var listboxApi = listboxApiBody;

  // node_modules/@ui-sdk/core/dist/components/listbox/listbox-root.js
  var listboxPrimitive = /* @__PURE__ */ definePrimitive({
    name: "listbox",
    options: {
      value: "string",
      defaultValue: "string",
      onValueChange: "callback",
      multiple: "boolean",
      activation: "string",
      deselectable: "boolean",
      orientation: "string",
      loop: "boolean",
      keepInView: "boolean",
      items: "value",
      itemToValue: "value",
      isItemEqualToValue: "value",
      onHighlight: "callback",
      disabled: "boolean",
      readOnly: "boolean",
      required: "boolean",
      name: "string",
      form: "string",
      controller: "value"
    },
    state: initialListboxStore,
    live: ["highlighted"],
    sync: syncListboxStore,
    api: listboxApi,
    // An arrow function, so TypeScript infers the slot names before it checks the parts.
    slots: (slot) => listboxSlots(slot),
    agent: { actions: ["setValue", "clear", "selectAll"], closed: true }
  });
  var listbox = listboxPrimitive;

  // node_modules/@ui-sdk/web/dist/listbox.js
  var owner3 = "ui-listbox";
  var generated = /* @__PURE__ */ new WeakMap();
  function defineListboxElements() {
    createParts(listbox, {
      root: {
        tag: owner3,
        defaults: { loop: true, keepInView: true },
        formAssociated: true,
        display: "block",
        options: (el) => {
          const data = el;
          const multiple = el.hasAttribute("multiple") && el.getAttribute("multiple") !== "false";
          const start = el.getAttribute("default-value") ?? el.getAttribute("value");
          const toValues = (keys) => valuesOf(keys, data.items, data.itemToValue);
          return {
            items: data.items,
            itemToValue: data.itemToValue,
            isItemEqualToValue: data.isItemEqualToValue,
            ...start !== null && {
              defaultValue: multiple ? toValues(listAttribute(start)) : toValues([start])[0]
            }
          };
        },
        state: {
          value: {
            get: (api) => api.getValue(),
            // A string names items by key, comma-separated with multiple.
            set: (api, value) => {
              if (typeof value !== "string") {
                return api.setValue(value);
              }
              const multiple = !!api.internal.options().multiple;
              const keys = multiple ? listAttribute(value) : [value];
              const found2 = keys.map(
                (key) => api.internal.listbox.valueOf(key) ?? key
              );
              api.setValue(multiple ? found2 : found2[0] ?? null);
            }
          }
        },
        api: ["getValue", "setValue", "clear", "selectAll", "focus"],
        // Runs again whenever `items` is set.
        render(el, { api }) {
          const { items } = el;
          generated.get(el)?.forEach((child) => child.remove());
          generated.delete(el);
          if (!items) {
            return;
          }
          adoptDefaultValue(el, items, api);
          const fresh = renderListItems(
            "ui-listbox",
            items,
            api.internal.keyOf,
            templateOf(el)
          );
          generated.set(el, fresh);
          el.append(...fresh);
        }
      },
      item: { tag: "ui-listbox-item", display: "block" },
      "item-indicator": "ui-listbox-item-indicator",
      // An icon inside an item. Screen readers and typeahead skip it.
      "item-icon": "ui-listbox-item-icon",
      group: { tag: "ui-listbox-group", display: "block" },
      "group-label": { tag: "ui-listbox-group-label", display: "block" },
      separator: { tag: "ui-listbox-separator", display: "block" }
    });
  }

  // node_modules/@ui-sdk/web/dist/entries/listbox.js
  defineListboxElements();

  // node_modules/@ui-sdk/core/dist/foundation/platform/layout.js
  var isTransformed = (style) => style.transform !== "none" || style.translate !== "none" || style.scale !== "none" || style.rotate !== "none";
  function movesRects(node, parent) {
    for (let el = node; el && el !== parent; ) {
      const scrolled = el !== node && (el.scrollLeft || el.scrollTop);
      if (scrolled || isTransformed(getComputedStyle(el))) {
        return true;
      }
      el = el.parentElement;
    }
    return false;
  }
  function offsetIn(node, parent) {
    const offset = {
      x: node.offsetLeft + parent.clientLeft,
      y: node.offsetTop + parent.clientTop
    };
    if (parent === node.ownerDocument.body || movesRects(node, parent)) {
      return offset;
    }
    const rect = node.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    const size = layoutSize(parent);
    const x = (rect.left - parentRect.left) * size.width / parentRect.width + parent.scrollLeft;
    const y = (rect.top - parentRect.top) * size.height / parentRect.height + parent.scrollTop;
    return {
      x: Math.abs(x - offset.x) < 1 ? x : offset.x,
      y: Math.abs(y - offset.y) < 1 ? y : offset.y
    };
  }
  function layoutOrigin(el) {
    let x = 0;
    let y = 0;
    for (let node = el; node; node = node.offsetParent) {
      const parent = node.offsetParent;
      if (!parent) {
        x += node.offsetLeft;
        y += node.offsetTop;
        continue;
      }
      const offset = offsetIn(node, parent);
      x += offset.x;
      y += offset.y;
    }
    return { x, y };
  }
  function layoutSize(el) {
    const style = getComputedStyle(el);
    const total = (...names) => names.reduce(
      (sum, name) => sum + (parseFloat(style.getPropertyValue(name)) || 0),
      0
    );
    const contentBox = style.boxSizing !== "border-box";
    const width = parseFloat(style.width) + (contentBox ? total(
      "padding-left",
      "padding-right",
      "border-left-width",
      "border-right-width"
    ) : 0);
    const height = parseFloat(style.height) + (contentBox ? total(
      "padding-top",
      "padding-bottom",
      "border-top-width",
      "border-bottom-width"
    ) : 0);
    return {
      width: Number.isFinite(width) ? width : el.offsetWidth,
      height: Number.isFinite(height) ? height : el.offsetHeight
    };
  }
  function layoutBox(el, container) {
    const at = layoutOrigin(el);
    const origin = layoutOrigin(container);
    const left = at.x - origin.x - container.clientLeft;
    const top = at.y - origin.y - container.clientTop;
    const { width, height } = layoutSize(el);
    const area = { width: container.scrollWidth, height: container.scrollHeight };
    return {
      left,
      top,
      width,
      height,
      right: area.width - (left + width),
      bottom: area.height - (top + height)
    };
  }

  // node_modules/@ui-sdk/core/dist/foundation/selection/indicator.js
  function bindIndicator(options) {
    const update = () => {
      const list = options.list();
      const item = options.active();
      options.write(item && list ? layoutBox(item, list) : void 0);
    };
    const observer = typeof ResizeObserver === "undefined" ? void 0 : new ResizeObserver(update);
    const observed = /* @__PURE__ */ new Set();
    const remeasure = () => {
      const list = options.list();
      const targets = new Set(
        list ? [list, ...list.querySelectorAll(options.itemSelector)] : []
      );
      for (const target of observed) {
        if (!targets.has(target)) {
          observed.delete(target);
          observer?.unobserve(target);
        }
      }
      for (const target of targets) {
        if (observed.has(target)) {
          continue;
        }
        observed.add(target);
        observer?.observe(target);
      }
      update();
    };
    const unsubscribe = options.subscribe(remeasure);
    queueMicrotask(remeasure);
    return () => {
      unsubscribe();
      observer?.disconnect();
    };
  }

  // node_modules/@ui-sdk/core/dist/components/radio/radio-api.js
  function radioGroupState(options, extra = {}) {
    const value = options.value !== void 0 ? options.value : options.defaultValue ?? null;
    return {
      value,
      initial: value,
      disabled: !!options.disabled,
      readOnly: !!options.readOnly,
      required: !!options.required,
      name: options.name,
      form: options.form,
      formDisabled: false,
      stop: null,
      exiting: [],
      ...extra
    };
  }
  function syncRadioGroup(options) {
    return {
      disabled: !!options.disabled,
      readOnly: !!options.readOnly,
      required: !!options.required,
      name: options.name,
      form: options.form,
      // Like a native radio's `defaultChecked`, changing it changes what a reset returns to.
      ...options.defaultValue === void 0 ? {} : { initial: options.defaultValue },
      ...options.value === void 0 ? {} : { value: options.value }
    };
  }
  var isNativeButton = (el) => el instanceof HTMLButtonElement;
  function radioGroupApiBody(context2, slots = { group: "group", item: "root" }) {
    const { id, store, options, element: element2, props } = context2;
    const change = createChange(context2);
    let changed = false;
    const enabled = (item) => !item.props?.disabled && !isDisabled(store.get());
    const roving = createRovingFocus(context2, {
      slot: slots.item,
      key: "stop",
      remember: false,
      disabled: (item) => !enabled(item),
      focusable: enabled,
      preferred: (item) => store.get().value === item.key,
      claims: (state, item) => (state.value ?? item.key) === item.key,
      move(event, { from, items, rtl }) {
        if (event.shiftKey) {
          return;
        }
        const step = radioStep(event.key, rtl);
        if (step === void 0) {
          return;
        }
        return items[moveIndex(
          items.indexOf(from),
          step,
          items.length,
          options().loop ?? true
        )].key;
      }
    });
    const exitingAfter = (from, value, exiting) => [
      ...exiting.filter((key) => key !== value),
      ...from !== null && hasIndicator(from) && !exiting.includes(from) ? [from] : []
    ];
    deriveFromOptions(context2, ["exiting", "stop"], (synced, state) => {
      if (!("value" in synced) || synced.value === state.value) {
        return;
      }
      const value = synced.value ?? null;
      const stop = roving.stopFor((item) => item.key === value);
      return {
        exiting: exitingAfter(state.value, value, state.exiting),
        ...stop !== void 0 && { stop }
      };
    });
    let previous = store.get().value;
    store.subscribe(() => {
      const { value, exiting } = store.get();
      if (value === previous) {
        return;
      }
      const from = previous;
      previous = value;
      changed = true;
      store.set({ exiting: exitingAfter(from, value, exiting) });
      roving.check();
    });
    const hasIndicator = (value) => !!element2("indicator", value)?.isConnected;
    const formElement = () => {
      const root = element2(slots.group);
      if (formInternals(root)) {
        return root;
      }
      const { value } = store.get();
      return value === null ? void 0 : element2("input", value);
    };
    const api = {
      id,
      getValue: () => store.get().value,
      isChanged: () => changed,
      // Checks a radio, as a user would. Disabled radios and read-only groups ignore it.
      setValue(value, { reason = "imperative", event } = {}) {
        const details = { reason, event };
        const state = store.get();
        if (isDisabled(state) || state.readOnly) {
          return false;
        }
        if (value !== null && props(slots.item, value)?.disabled) {
          return false;
        }
        const done = change("value", value, details);
        if (done && reason !== "restore") {
          dispatchChange(formElement());
        }
        return done;
      },
      // Moves focus to the item that holds the tab stop, the checked one if it is enabled.
      focus: () => roving.focus(),
      form: () => formInternals(element2(slots.group))?.form ?? elements(context2, "input")[0]?.el?.form ?? null,
      internal: {
        // Checks the radio a press landed on. Rating unchecks a checked one.
        check: (key, details) => api.setValue(key, details),
        reset() {
          change("value", store.get().initial, { reason: "reset" });
        },
        // The browser restores a disabled or read-only group too, as a native one.
        restore(saved) {
          change("value", saved || null, { reason: "restore" });
        },
        setFormDisabled(formDisabled) {
          store.set({ formDisabled });
        },
        finishExit(key) {
          store.set({
            exiting: store.get().exiting.filter((value) => value !== key)
          });
        },
        roving,
        group: () => element2(slots.group),
        radio: (key) => element2(slots.item, key),
        // The props its item rendered with, for parts inside an item.
        itemProps: (key) => props(slots.item, key) ?? {},
        anchor: () => (roving.items()[0] ?? elements(context2, slots.item)[0])?.el,
        onKeyDown(event, el) {
          if (event.altKey || event.ctrlKey || event.metaKey) {
            return;
          }
          if (event.key === "Enter") {
            event.preventDefault();
            if (!event.repeat) {
              submitImplicitly(api.form());
            }
            return;
          }
          if (event.key === " ") {
            if (!isNativeButton(el)) {
              event.preventDefault();
            }
            return;
          }
          const moved = roving.keydown(event, el);
          if (moved && moved.key !== moved.from && !store.get().readOnly) {
            api.setValue(moved.key, { reason: "list-navigation", event });
          }
        }
      }
    };
    return api;
  }
  var radioGroupApi = radioGroupApiBody;
  function itemState2(state, key, props) {
    return {
      checked: state.value === key,
      disabled: !!props.disabled || isDisabled(state),
      readOnly: state.readOnly,
      required: state.required
    };
  }
  function itemData(state, key, props) {
    const { checked: checked2, disabled } = itemState2(state, key, props);
    return {
      "data-checked": checked2 ? "" : void 0,
      "data-unchecked": checked2 ? void 0 : "",
      "data-disabled": disabled ? "" : void 0,
      "data-readonly": state.readOnly ? "" : void 0,
      "data-required": state.required ? "" : void 0
    };
  }

  // node_modules/@ui-sdk/core/dist/components/radio/radio-parts.js
  init_selects();
  function bindRadioGroup(el, api, store) {
    const unbind = bindInternals(el, {
      value: () => store.get().value,
      state: () => store.get().value ?? "",
      restore: api.internal.restore,
      valueMissing: () => store.get().required && store.get().value === null,
      message: () => valueMissingMessage("radio"),
      anchor: api.internal.anchor,
      focus: api.focus,
      reset: api.internal.reset,
      disabled: api.internal.setFormDisabled,
      subscribe: store.subscribe
    });
    const onClick = (event) => {
      if (event.target === el) {
        api.focus();
      }
    };
    let pressedLabel = null;
    const onPointerDown = (event) => {
      pressedLabel = isDisabled(store.get()) ? event.target?.closest?.("label") ?? null : null;
    };
    const onFocusIn = (event) => {
      const label = pressedLabel;
      pressedLabel = null;
      const target = event.target;
      if (label?.control === target && target !== el) {
        target.blur();
      }
    };
    const doc = el.ownerDocument;
    el.addEventListener("click", onClick);
    el.addEventListener("focusin", onFocusIn);
    doc.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      unbind();
      el.removeEventListener("click", onClick);
      el.removeEventListener("focusin", onFocusIn);
      doc.removeEventListener("pointerdown", onPointerDown, true);
    };
  }
  var radioGroupAttrs = (state) => ({
    "aria-orientation": state.orientation,
    "data-orientation": state.orientation,
    "aria-required": state.required ? "true" : void 0,
    "aria-readonly": state.readOnly ? "true" : void 0,
    "aria-disabled": isDisabled(state) ? "true" : void 0,
    "data-disabled": isDisabled(state) ? "" : void 0,
    "data-readonly": state.readOnly ? "" : void 0,
    "data-required": state.required ? "" : void 0
  });
  function radioSlots(slot, groupState, radioAttrs = () => ({})) {
    return {
      group: slot({
        role: "radiogroup",
        keys: { none: "Focus stays on a radio, whose keydown handles them." },
        state: groupState,
        attrs: radioGroupAttrs,
        bind: (el, { api, store }) => bindRadioGroup(el, api, store)
      }),
      item: slot({
        role: "radio",
        focus: "roving",
        keys: ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", " "],
        props: { value: "string", disabled: "boolean" },
        // Until there's a stop, the checked item holds it, or with nothing
        // checked, the first enabled one claims it: those hear a change to null.
        // Radios never read which indicators are exiting.
        selects: selects({
          value: ({ key }) => [key, null],
          stop: ({ key }) => [key, null],
          exiting: []
        }),
        state: (state, { key, props }) => itemState2(state, key, props),
        attrs: (state, { key, props, api }) => {
          const { checked: checked2, disabled } = itemState2(state, key, props);
          return {
            type: "button",
            "aria-checked": String(checked2),
            // Disabled items are skipped, like native radios.
            disabled: props.disabled ? "" : void 0,
            "aria-disabled": disabled ? "true" : void 0,
            tabindex: disabled ? props.disabled ? void 0 : "-1" : api.internal.roving.tabIndex(state, { key, props }),
            ...itemData(state, key, props),
            ...radioAttrs(state, key, api)
          };
        },
        press({ api, key, props }, event) {
          event?.preventDefault();
          if (props.disabled) {
            return;
          }
          api.internal.check(key, { reason: "item-press", event });
        },
        on: {
          // A group's disabled leaves the item focusable to scripts, so a press
          // mustn't focus it either, like a disabled native radio.
          mousedown: (event, { store, key, props }) => {
            if (itemState2(store.get(), key, props).disabled) {
              event.preventDefault();
            }
          },
          keydown: (event, { api, el }) => api.internal.onKeyDown(event, el),
          keyup: (event, { api, el, key, props }) => {
            if (event.key === " " && !isNativeButton(el) && !props.disabled) {
              api.internal.check(key, { reason: "item-press", event });
            }
          }
        },
        bind(el, part) {
          const unregister = part.api.internal.roving.bind(el, part);
          const unname = nameFromLabels(el);
          return () => {
            unname();
            unregister();
          };
        }
      }),
      // React and Vue: a native radio per item, so the form submits, resets and validates them.
      input: slot({
        props: { value: "string", disabled: "boolean" },
        attrs: (state, { id, key, props }) => ({
          type: "radio",
          // Required radios need a group to validate as one.
          name: state.name ?? (state.required ? id : void 0),
          value: key,
          form: state.form,
          checked: state.initial === key ? "" : void 0,
          required: state.required ? "" : void 0,
          disabled: state.disabled || props.disabled ? "" : void 0,
          "aria-hidden": "true",
          tabindex: "-1",
          style: hiddenInputStyle
        }),
        bind: (el, { api, store, key }) => bindHiddenInput(el, {
          checked: () => store.get().value === key,
          subscribe: store.subscribe,
          // The browser focuses an invalid radio on submit. Focus goes to the group's tab stop.
          focus: api.focus,
          control: () => api.internal.radio(key),
          activate: (event) => {
            if (!api.internal.itemProps(key).disabled) {
              api.internal.check(key, { reason: "item-press", event });
            }
          },
          reset: api.internal.reset,
          disabled: api.internal.setFormDisabled
        })
      })
    };
  }

  // node_modules/@ui-sdk/core/dist/components/segmented-control/segmented-control.js
  var slotNames = { group: "root", item: "item" };
  var indicatorVariables = [
    "left",
    "right",
    "top",
    "bottom",
    "width",
    "height"
  ];
  var orientation = (options) => orientationOf(options.orientation, "horizontal");
  var segmentedControlPrimitive = /* @__PURE__ */ definePrimitive({
    name: "segmented-control",
    options: {
      value: "string",
      defaultValue: "string",
      onValueChange: "callback",
      disabled: "boolean",
      readOnly: "boolean",
      required: "boolean",
      name: "string",
      form: "string",
      loop: "boolean",
      orientation: "string",
      controller: "value"
    },
    state: (options) => radioGroupState(options, { orientation: orientation(options) }),
    sync: (options) => ({
      ...syncRadioGroup(options),
      orientation: orientation(options)
    }),
    api: (context2) => radioGroupApi(context2, slotNames),
    slots: (slot) => {
      const { group, item, input: input2 } = radioSlots(slot, (state) => ({
        value: state.value,
        disabled: isDisabled(state),
        readOnly: state.readOnly,
        required: state.required,
        orientation: state.orientation ?? "horizontal"
      }));
      return {
        root: group,
        item,
        input: input2,
        indicator: slot({
          role: "presentation",
          state: (state) => ({
            value: state.value,
            orientation: state.orientation ?? "horizontal"
          }),
          attrs: (state) => ({ "data-orientation": state.orientation }),
          bind(el, { api, store }) {
            let value = store.get().value;
            return bindIndicator({
              list: () => api.internal.group() ?? el.parentElement,
              active: () => {
                const { value: value2 } = store.get();
                return value2 === null ? void 0 : api.internal.radio(value2);
              },
              itemSelector: '[role="radio"]',
              subscribe: (remeasure) => store.subscribe(() => {
                if (store.get().value === value) {
                  return;
                }
                value = store.get().value;
                remeasure();
              }),
              write(box) {
                for (const name of indicatorVariables) {
                  if (box) {
                    el.style.setProperty(
                      `--segmented-control-indicator-${name}`,
                      `${box[name]}px`
                    );
                  } else {
                    el.style.removeProperty(
                      `--segmented-control-indicator-${name}`
                    );
                  }
                }
              }
            });
          }
        })
      };
    },
    agent: { actions: ["setValue"], closed: true }
  });
  var segmentedControl = segmentedControlPrimitive;

  // node_modules/@ui-sdk/web/dist/segmented-control.js
  function defineSegmentedControlElements() {
    createParts(segmentedControl, {
      root: {
        tag: "ui-segmented-control",
        defaults: { loop: true },
        display: "block",
        formAssociated: true,
        state: {
          value: {
            get: (api) => api.getValue(),
            set: (api, value) => api.setValue(value)
          }
        },
        api: ["getValue", "setValue", "focus"]
      },
      // Form-associated, so a <label> around or pointing at an item checks it.
      item: { tag: "ui-segmented-control-item", formAssociated: true },
      indicator: "ui-segmented-control-indicator"
    });
  }

  // node_modules/@ui-sdk/web/dist/entries/segmented-control.js
  defineSegmentedControlElements();

  // shell/ui/tool-grid.js
  var toolGrid = definePrimitive({
    name: "tool-grid",
    options: {
      onActivate: "callback"
    },
    state: () => ({
      focused: null,
      columns: 1
    }),
    api: (context2) => {
      const roving = createRovingFocus(context2, {
        slot: "cell",
        key: "focused",
        move: (event, { from, items, rtl }) => {
          const index = items.findIndex((item) => item.key === from.key);
          if (index < 0) return from.key;
          const columns = Math.max(1, context2.store.get().columns);
          const forward = rtl ? -1 : 1;
          if (event.key === "Home") return items[0].key;
          if (event.key === "End") return items[items.length - 1].key;
          const step = {
            ArrowRight: forward,
            ArrowLeft: -forward,
            ArrowDown: columns,
            ArrowUp: -columns
          }[event.key];
          if (step == null) return void 0;
          let next = index + step;
          if (event.key === "ArrowDown" && next >= items.length && index < items.length - 1) {
            next = items.length - 1;
          }
          if (next < 0 || next >= items.length) return from.key;
          return items[next].key;
        }
      });
      return {
        roving,
        setColumns(count3) {
          const columns = Math.max(1, count3 | 0);
          if (context2.store.get().columns === columns) return;
          context2.store.set({ columns });
        },
        focusItem(value) {
          roving.focus(value);
        },
        activate(value, event) {
          context2.options().onActivate?.(value, { reason: "item-press", event });
        }
      };
    },
    slots: (slot) => ({
      root: slot({
        attrs: () => ({ role: "grid" }),
        bind: (el, { api }) => {
          const measure = () => {
            const tracks = getComputedStyle(el).gridTemplateColumns.split(" ").filter(Boolean);
            api.setColumns(tracks.length || 1);
          };
          measure();
          const observer = new ResizeObserver(measure);
          observer.observe(el);
          return () => observer.disconnect();
        }
      }),
      cell: slot({
        props: { value: "string", index: "number" },
        attrs: (state, part) => {
          const columns = Math.max(1, state.columns || 1);
          const index = part.props.index || 0;
          return {
            role: "gridcell",
            tabindex: part.api.roving.tabIndex(state, part),
            "aria-rowindex": Math.floor(index / columns) + 1,
            "aria-colindex": index % columns + 1
          };
        },
        on: {
          keydown: (event, { el, api, props }) => {
            api.roving.keydown(event, el);
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              api.activate(props.value, event);
            }
          }
        },
        press: ({ api, props }, event) => api.activate(props.value, event),
        bind: (el, part) => part.api.roving.bind(el, part)
      })
    }),
    agent: {
      actions: ["activate", "focusItem"],
      items: (api) => api.roving.items().map((item) => ({
        value: item.key,
        label: item.el.textContent.trim()
      }))
    }
  });

  // shell/ui/register.js
  globalThis.__uiSdkCreateAgent = createAgent;
  createParts(toolGrid, {
    root: { tag: "ui-tool-grid", display: "grid" },
    cell: { tag: "ui-tool-grid-cell", display: "flex" }
  });
})();
