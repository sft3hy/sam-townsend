import { createHooks } from "hookable";
import { toValue, isRef, defineComponent, ref, onMounted, createSSRApp, useSSRContext, onBeforeUnmount, mergeProps, unref, withCtx, createTextVNode, computed, toDisplayString, createVNode, resolveDynamicComponent, Transition, createBlock, openBlock, Fragment, renderList } from "vue";
import { createRouter, createMemoryHistory, RouterLink, useRoute, RouterView } from "vue-router";
import { ssrRenderAttrs, ssrRenderClass, ssrRenderComponent, ssrInterpolate, ssrRenderVNode, ssrRenderList, ssrRenderAttr, ssrRenderStyle } from "vue/server-renderer";
import { useHead } from "@vueuse/head";
import VLazyImage from "v-lazy-image";
import { Swiper, SwiperSlide } from "swiper/vue";
import { FreeMode, Navigation, Pagination, Mousewheel } from "swiper/modules";
import L from "leaflet";
const DupeableTags = /* @__PURE__ */ new Set(["link", "style", "script", "noscript"]);
const TagsWithInnerContent = /* @__PURE__ */ new Set(["title", "titleTemplate", "script", "style", "noscript"]);
const ValidHeadTags = /* @__PURE__ */ new Set([
  "title",
  "base",
  "htmlAttrs",
  "bodyAttrs",
  "meta",
  "link",
  "style",
  "script",
  "noscript"
]);
const UniqueTags = /* @__PURE__ */ new Set(["base", "title", "titleTemplate", "bodyAttrs", "htmlAttrs", "templateParams"]);
const TagConfigKeys = /* @__PURE__ */ new Set(["key", "tagPosition", "tagPriority", "tagDuplicateStrategy", "innerHTML", "textContent", "processTemplateParams"]);
const UsesMergeStrategy = /* @__PURE__ */ new Set(["templateParams", "htmlAttrs", "bodyAttrs"]);
const MetaTagsArrayable = /* @__PURE__ */ new Set([
  "theme-color",
  "google-site-verification",
  "og",
  "article",
  "book",
  "profile",
  "twitter",
  "author"
]);
const allowedMetaProperties = ["name", "property", "http-equiv"];
const StandardSingleMetaTags = /* @__PURE__ */ new Set([
  "viewport",
  "description",
  "keywords",
  "robots"
]);
function isMetaArrayDupeKey(v) {
  const parts = v.split(":");
  if (!parts.length)
    return false;
  return MetaTagsArrayable.has(parts[1]);
}
function dedupeKey(tag) {
  const { props, tag: name } = tag;
  if (UniqueTags.has(name))
    return name;
  if (name === "link" && props.rel === "canonical")
    return "canonical";
  const altKey = props.hreflang || props.type;
  if (name === "link" && props.rel === "alternate" && altKey) {
    return `alternate:${altKey}`;
  }
  if (props.charset)
    return "charset";
  if (tag.tag === "meta") {
    for (const n of allowedMetaProperties) {
      if (props[n] !== void 0) {
        const propValue = props[n];
        const isStructured = propValue && typeof propValue === "string" && propValue.includes(":");
        const isStandardSingle = propValue && StandardSingleMetaTags.has(propValue);
        const shouldAlwaysDedupe = isStructured || isStandardSingle;
        const keyPart = !shouldAlwaysDedupe && tag.key ? `:key:${tag.key}` : "";
        return `${name}:${propValue}${keyPart}`;
      }
    }
  }
  if (tag.key) {
    return `${name}:key:${tag.key}`;
  }
  if (props.id) {
    return `${name}:id:${props.id}`;
  }
  if (TagsWithInnerContent.has(name)) {
    const v = tag.textContent || tag.innerHTML;
    if (v) {
      return `${name}:content:${v}`;
    }
  }
}
function walkResolver(val, resolve, key) {
  const type = typeof val;
  if (type === "function") {
    if (!key || key !== "titleTemplate" && !(key[0] === "o" && key[1] === "n")) {
      val = val();
    }
  }
  const v = resolve ? resolve(key, val) : val;
  if (Array.isArray(v)) {
    return v.map((r) => walkResolver(r, resolve));
  }
  if ((v == null ? void 0 : v.constructor) === Object) {
    const next = {};
    for (const k of Object.keys(v)) {
      next[k] = walkResolver(v[k], resolve, k);
    }
    return next;
  }
  return v;
}
function normalizeStyleClassProps(key, value) {
  const store = key === "style" ? /* @__PURE__ */ new Map() : /* @__PURE__ */ new Set();
  function processValue(rawValue) {
    if (rawValue == null || rawValue === void 0)
      return;
    const value2 = String(rawValue).trim();
    if (!value2)
      return;
    if (key === "style") {
      const [k, ...v] = value2.split(":").map((s) => s ? s.trim() : "");
      if (k && v.length)
        store.set(k, v.join(":"));
    } else {
      value2.split(" ").filter(Boolean).forEach((c) => store.add(c));
    }
  }
  if (typeof value === "string") {
    key === "style" ? value.split(";").forEach(processValue) : processValue(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => processValue(item));
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([k, v]) => {
      if (v && v !== "false") {
        key === "style" ? store.set(String(k).trim(), String(v)) : processValue(k);
      }
    });
  }
  return store;
}
function normalizeProps(tag, input) {
  tag.props = tag.props || {};
  if (!input) {
    return tag;
  }
  if (tag.tag === "templateParams") {
    tag.props = input;
    return tag;
  }
  Object.entries(input).forEach(([key, value]) => {
    if (value === null) {
      tag.props[key] = null;
      return;
    }
    if (key === "class" || key === "style") {
      tag.props[key] = normalizeStyleClassProps(key, value);
      return;
    }
    if (TagConfigKeys.has(key)) {
      if (["textContent", "innerHTML"].includes(key) && typeof value === "object") {
        let type = input.type;
        if (!input.type) {
          type = "application/json";
        }
        if (!(type == null ? void 0 : type.endsWith("json")) && type !== "speculationrules") {
          return;
        }
        input.type = type;
        tag.props.type = type;
        tag[key] = JSON.stringify(value);
      } else {
        tag[key] = value;
      }
      return;
    }
    const strValue = String(value);
    const isDataKey = key.startsWith("data-");
    const isMetaContentKey = tag.tag === "meta" && key === "content";
    if (strValue === "true" || strValue === "") {
      tag.props[key] = isDataKey || isMetaContentKey ? strValue : true;
    } else if (!value && isDataKey && strValue === "false") {
      tag.props[key] = "false";
    } else if (value !== void 0) {
      tag.props[key] = value;
    }
  });
  return tag;
}
function normalizeTag(tagName, _input) {
  const input = typeof _input === "object" && typeof _input !== "function" ? _input : { [tagName === "script" || tagName === "noscript" || tagName === "style" ? "innerHTML" : "textContent"]: _input };
  const tag = normalizeProps({ tag: tagName, props: {} }, input);
  if (tag.key && DupeableTags.has(tag.tag)) {
    tag.props["data-hid"] = tag._h = tag.key;
  }
  if (tag.tag === "script" && typeof tag.innerHTML === "object") {
    tag.innerHTML = JSON.stringify(tag.innerHTML);
    tag.props.type = tag.props.type || "application/json";
  }
  return Array.isArray(tag.props.content) ? tag.props.content.map((v) => ({ ...tag, props: { ...tag.props, content: v } })) : tag;
}
function normalizeEntryToTags(input, propResolvers) {
  if (!input) {
    return [];
  }
  if (typeof input === "function") {
    input = input();
  }
  const resolvers = (key, val) => {
    for (let i = 0; i < propResolvers.length; i++) {
      val = propResolvers[i](key, val);
    }
    return val;
  };
  input = resolvers(void 0, input);
  const tags = [];
  input = walkResolver(input, resolvers);
  Object.entries(input || {}).forEach(([key, value]) => {
    if (value === void 0)
      return;
    for (const v of Array.isArray(value) ? value : [value])
      tags.push(normalizeTag(key, v));
  });
  return tags.flat();
}
const sortTags = (a, b) => a._w === b._w ? a._p - b._p : a._w - b._w;
const TAG_WEIGHTS = {
  base: -10,
  title: 10
};
const TAG_ALIASES = {
  critical: -8,
  high: -1,
  low: 2
};
const WEIGHT_MAP = {
  meta: {
    "content-security-policy": -30,
    "charset": -20,
    "viewport": -15
  },
  link: {
    "preconnect": 20,
    "stylesheet": 60,
    "preload": 70,
    "modulepreload": 70,
    "prefetch": 90,
    "dns-prefetch": 90,
    "prerender": 90
  },
  script: {
    async: 30,
    defer: 80,
    sync: 50
  },
  style: {
    imported: 40,
    sync: 60
  }
};
const ImportStyleRe = /@import/;
const isTruthy = (val) => val === "" || val === true;
function tagWeight(head, tag) {
  if (typeof tag.tagPriority === "number")
    return tag.tagPriority;
  let weight = 100;
  const offset = TAG_ALIASES[tag.tagPriority] || 0;
  const weightMap = head.resolvedOptions.disableCapoSorting ? {
    link: {},
    script: {},
    style: {}
  } : WEIGHT_MAP;
  if (tag.tag in TAG_WEIGHTS) {
    weight = TAG_WEIGHTS[tag.tag];
  } else if (tag.tag === "meta") {
    const metaType = tag.props["http-equiv"] === "content-security-policy" ? "content-security-policy" : tag.props.charset ? "charset" : tag.props.name === "viewport" ? "viewport" : null;
    if (metaType)
      weight = WEIGHT_MAP.meta[metaType];
  } else if (tag.tag === "link" && tag.props.rel) {
    weight = weightMap.link[tag.props.rel];
  } else if (tag.tag === "script") {
    const type = String(tag.props.type);
    if (isTruthy(tag.props.async)) {
      weight = weightMap.script.async;
    } else if (tag.props.src && !isTruthy(tag.props.defer) && !isTruthy(tag.props.async) && type !== "module" && !type.endsWith("json") || tag.innerHTML && !type.endsWith("json")) {
      weight = weightMap.script.sync;
    } else if (isTruthy(tag.props.defer) && tag.props.src && !isTruthy(tag.props.async) || type === "module") {
      weight = weightMap.script.defer;
    }
  } else if (tag.tag === "style") {
    weight = tag.innerHTML && ImportStyleRe.test(tag.innerHTML) ? weightMap.style.imported : weightMap.style.sync;
  }
  return (weight || 100) + offset;
}
function registerPlugin(head, p) {
  const plugin = typeof p === "function" ? p(head) : p;
  const key = plugin.key || String(head.plugins.size + 1);
  const exists = head.plugins.get(key);
  if (!exists) {
    head.plugins.set(key, plugin);
    head.hooks.addHooks(plugin.hooks || {});
  }
}
// @__NO_SIDE_EFFECTS__
function createUnhead(resolvedOptions = {}) {
  var _a;
  const hooks = createHooks();
  hooks.addHooks(resolvedOptions.hooks || {});
  const ssr = !resolvedOptions.document;
  const entries = /* @__PURE__ */ new Map();
  const plugins = /* @__PURE__ */ new Map();
  const normalizeQueue = /* @__PURE__ */ new Set();
  const head = {
    _entryCount: 1,
    // 0 is reserved for internal use
    plugins,
    dirty: false,
    resolvedOptions,
    hooks,
    ssr,
    entries,
    headEntries() {
      return [...entries.values()];
    },
    use: (p) => registerPlugin(head, p),
    push(input, _options) {
      const options = { ..._options || {} };
      delete options.head;
      const _i = options._index ?? head._entryCount++;
      const inst = { _i, input, options };
      const _ = {
        _poll(rm = false) {
          head.dirty = true;
          !rm && normalizeQueue.add(_i);
          hooks.callHook("entries:updated", head);
        },
        dispose() {
          if (entries.delete(_i)) {
            head.invalidate();
          }
        },
        // a patch is the same as creating a new entry, just a nice DX
        patch(input2) {
          if (!options.mode || options.mode === "server" && ssr || options.mode === "client" && !ssr) {
            inst.input = input2;
            entries.set(_i, inst);
            _._poll();
          }
        }
      };
      _.patch(input);
      return _;
    },
    async resolveTags() {
      const ctx = {
        tagMap: /* @__PURE__ */ new Map(),
        tags: [],
        entries: [...head.entries.values()]
      };
      await hooks.callHook("entries:resolve", ctx);
      while (normalizeQueue.size) {
        const i = normalizeQueue.values().next().value;
        normalizeQueue.delete(i);
        const e = entries.get(i);
        if (e) {
          const normalizeCtx = {
            tags: normalizeEntryToTags(e.input, resolvedOptions.propResolvers || []).map((t) => Object.assign(t, e.options)),
            entry: e
          };
          await hooks.callHook("entries:normalize", normalizeCtx);
          e._tags = normalizeCtx.tags.map((t, i2) => {
            t._w = tagWeight(head, t);
            t._p = (e._i << 10) + i2;
            t._d = dedupeKey(t);
            return t;
          });
        }
      }
      let hasFlatMeta = false;
      ctx.entries.flatMap((e) => (e._tags || []).map((t) => ({ ...t, props: { ...t.props } }))).sort(sortTags).reduce((acc, next) => {
        const k = String(next._d || next._p);
        if (!acc.has(k))
          return acc.set(k, next);
        const prev = acc.get(k);
        const strategy = (next == null ? void 0 : next.tagDuplicateStrategy) || (UsesMergeStrategy.has(next.tag) ? "merge" : null) || (next.key && next.key === prev.key ? "merge" : null);
        if (strategy === "merge") {
          const newProps = { ...prev.props };
          Object.entries(next.props).forEach(([p, v]) => (
            // @ts-expect-error untyped
            newProps[p] = p === "style" ? new Map([...prev.props.style || /* @__PURE__ */ new Map(), ...v]) : p === "class" ? /* @__PURE__ */ new Set([...prev.props.class || /* @__PURE__ */ new Set(), ...v]) : v
          ));
          acc.set(k, { ...next, props: newProps });
        } else if (next._p >> 10 === prev._p >> 10 && next.tag === "meta" && isMetaArrayDupeKey(k)) {
          acc.set(k, Object.assign([...Array.isArray(prev) ? prev : [prev], next], next));
          hasFlatMeta = true;
        } else if (next._w === prev._w ? next._p > prev._p : (next == null ? void 0 : next._w) < (prev == null ? void 0 : prev._w)) {
          acc.set(k, next);
        }
        return acc;
      }, ctx.tagMap);
      const title = ctx.tagMap.get("title");
      const titleTemplate = ctx.tagMap.get("titleTemplate");
      head._title = title == null ? void 0 : title.textContent;
      if (titleTemplate) {
        const titleTemplateFn = titleTemplate == null ? void 0 : titleTemplate.textContent;
        head._titleTemplate = titleTemplateFn;
        if (titleTemplateFn) {
          let newTitle = typeof titleTemplateFn === "function" ? titleTemplateFn(title == null ? void 0 : title.textContent) : titleTemplateFn;
          if (typeof newTitle === "string" && !head.plugins.has("template-params")) {
            newTitle = newTitle.replace("%s", (title == null ? void 0 : title.textContent) || "");
          }
          if (title) {
            newTitle === null ? ctx.tagMap.delete("title") : ctx.tagMap.set("title", { ...title, textContent: newTitle });
          } else {
            titleTemplate.tag = "title";
            titleTemplate.textContent = newTitle;
          }
        }
      }
      ctx.tags = Array.from(ctx.tagMap.values());
      if (hasFlatMeta) {
        ctx.tags = ctx.tags.flat().sort(sortTags);
      }
      await hooks.callHook("tags:beforeResolve", ctx);
      await hooks.callHook("tags:resolve", ctx);
      await hooks.callHook("tags:afterResolve", ctx);
      const finalTags = [];
      for (const t of ctx.tags) {
        const { innerHTML, tag, props } = t;
        if (!ValidHeadTags.has(tag)) {
          continue;
        }
        if (Object.keys(props).length === 0 && !t.innerHTML && !t.textContent) {
          continue;
        }
        if (tag === "meta" && !props.content && !props["http-equiv"] && !props.charset) {
          continue;
        }
        if (tag === "script" && innerHTML) {
          if (String(props.type).endsWith("json")) {
            const v = typeof innerHTML === "string" ? innerHTML : JSON.stringify(innerHTML);
            t.innerHTML = v.replace(/</g, "\\u003C");
          } else if (typeof innerHTML === "string") {
            t.innerHTML = innerHTML.replace(new RegExp(`</${tag}`, "g"), `<\\/${tag}`);
          }
          t._d = dedupeKey(t);
        }
        finalTags.push(t);
      }
      return finalTags;
    },
    invalidate() {
      for (const entry of entries.values()) {
        normalizeQueue.add(entry._i);
      }
      head.dirty = true;
      hooks.callHook("entries:updated", head);
    }
  };
  ((resolvedOptions == null ? void 0 : resolvedOptions.plugins) || []).forEach((p) => registerPlugin(head, p));
  head.hooks.callHook("init", head);
  (_a = resolvedOptions.init) == null ? void 0 : _a.forEach((e) => e && head.push(e));
  return head;
}
const VueResolver = (_, value) => {
  return isRef(value) ? toValue(value) : value;
};
const headSymbol = "usehead";
// @__NO_SIDE_EFFECTS__
function vueInstall(head) {
  const plugin = {
    install(app) {
      app.config.globalProperties.$unhead = head;
      app.config.globalProperties.$head = head;
      app.provide(headSymbol, head);
    }
  };
  return plugin.install;
}
// @__NO_SIDE_EFFECTS__
function createHead$1(options = {}) {
  const unhead = /* @__PURE__ */ createUnhead({
    ...options,
    // @ts-expect-error untyped
    document: false,
    propResolvers: [
      ...options.propResolvers || [],
      (k, v) => {
        if (k && k.startsWith("on") && typeof v === "function") {
          return `this.dataset.${k}fired = true`;
        }
        return v;
      }
    ],
    init: [
      options.disableDefaults ? void 0 : {
        htmlAttrs: {
          lang: "en"
        },
        meta: [
          {
            charset: "utf-8"
          },
          {
            name: "viewport",
            content: "width=device-width, initial-scale=1"
          }
        ]
      },
      ...options.init || []
    ]
  });
  unhead._ssrPayload = {};
  unhead.use({
    key: "server",
    hooks: {
      "tags:resolve": function(ctx) {
        const title = ctx.tagMap.get("title");
        const titleTemplate = ctx.tagMap.get("titleTemplate");
        let payload = {
          title: (title == null ? void 0 : title.mode) === "server" ? unhead._title : void 0,
          titleTemplate: (titleTemplate == null ? void 0 : titleTemplate.mode) === "server" ? unhead._titleTemplate : void 0
        };
        if (Object.keys(unhead._ssrPayload || {}).length > 0) {
          payload = {
            ...unhead._ssrPayload,
            ...payload
          };
        }
        if (Object.values(payload).some(Boolean)) {
          ctx.tags.push({
            tag: "script",
            innerHTML: JSON.stringify(payload),
            props: { id: "unhead:payload", type: "application/json" }
          });
        }
      }
    }
  });
  return unhead;
}
// @__NO_SIDE_EFFECTS__
function createHead(options = {}) {
  const head = /* @__PURE__ */ createHead$1({
    ...options,
    propResolvers: [VueResolver]
  });
  head.install = /* @__PURE__ */ vueInstall(head);
  return head;
}
const ClientOnly = defineComponent({
  setup(props, { slots }) {
    const mounted = ref(false);
    onMounted(() => mounted.value = true);
    return () => {
      if (!mounted.value)
        return slots.placeholder && slots.placeholder({});
      return slots.default && slots.default({});
    };
  }
});
function ViteSSG(App2, routerOptions, fn, options) {
  const {
    transformState,
    registerComponents = true,
    useHead: useHead2 = true,
    rootContainer = "#app"
  } = {};
  async function createApp$1(routePath) {
    const app = createSSRApp(App2);
    let head;
    if (useHead2) {
      app.use(head = /* @__PURE__ */ createHead());
    }
    const router = createRouter({
      history: createMemoryHistory(routerOptions.base),
      ...routerOptions
    });
    const { routes: routes2 } = routerOptions;
    if (registerComponents)
      app.component("ClientOnly", ClientOnly);
    const appRenderCallbacks = [];
    const onSSRAppRendered = (cb) => appRenderCallbacks.push(cb);
    const triggerOnSSRAppRendered = () => {
      return Promise.all(appRenderCallbacks.map((cb) => cb()));
    };
    const context = {
      app,
      head,
      isClient: false,
      router,
      routes: routes2,
      onSSRAppRendered,
      triggerOnSSRAppRendered,
      initialState: {},
      transformState,
      routePath
    };
    await (fn == null ? void 0 : fn(context));
    app.use(router);
    let entryRoutePath;
    let isFirstRoute = true;
    router.beforeEach((to, from, next) => {
      if (isFirstRoute || entryRoutePath && entryRoutePath === to.path) {
        isFirstRoute = false;
        entryRoutePath = to.path;
        to.meta.state = context.initialState;
      }
      next();
    });
    {
      const route = context.routePath ?? "/";
      router.push(route);
      await router.isReady();
      context.initialState = router.currentRoute.value.meta.state || {};
    }
    const initialState = context.initialState;
    return {
      ...context,
      initialState
    };
  }
  return createApp$1;
}
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const _sfc_main$e = {};
const _sfc_setup$e = _sfc_main$e.setup;
_sfc_main$e.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/icons/Hamburger.vue");
  return _sfc_setup$e ? _sfc_setup$e(props, ctx) : void 0;
};
const _sfc_main$d = {
  __name: "HamburgerMenu",
  __ssrInlineRender: true,
  setup(__props) {
    const isOpen = ref(false);
    const menuRef = ref(null);
    const closeMenu = () => {
      isOpen.value = false;
    };
    const handleClickOutside = (event) => {
      if (menuRef.value && !menuRef.value.contains(event.target)) {
        isOpen.value = false;
      }
    };
    onMounted(() => {
      document.addEventListener("click", handleClickOutside);
    });
    onBeforeUnmount(() => {
      document.removeEventListener("click", handleClickOutside);
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "nav-container",
        ref_key: "menuRef",
        ref: menuRef
      }, _attrs))} data-v-b63a13b7><button aria-label="Menu" class="${ssrRenderClass([{ "is-active": isOpen.value }, "hamburger-btn"])}" data-v-b63a13b7><div class="hamburger-box" data-v-b63a13b7><div class="hamburger-inner" data-v-b63a13b7></div></div></button>`);
      if (isOpen.value) {
        _push(`<nav class="nav-dropdown glass-panel" data-v-b63a13b7><ul data-v-b63a13b7><li data-v-b63a13b7>`);
        _push(ssrRenderComponent(unref(RouterLink), {
          to: "/",
          onClick: closeMenu
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Home`);
            } else {
              return [
                createTextVNode("Home")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</li><li data-v-b63a13b7>`);
        _push(ssrRenderComponent(unref(RouterLink), {
          to: "/about/",
          onClick: closeMenu
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`About`);
            } else {
              return [
                createTextVNode("About")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</li><li data-v-b63a13b7>`);
        _push(ssrRenderComponent(unref(RouterLink), {
          to: "/portfolio/",
          onClick: closeMenu
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Portfolio`);
            } else {
              return [
                createTextVNode("Portfolio")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</li><li data-v-b63a13b7>`);
        _push(ssrRenderComponent(unref(RouterLink), {
          to: "/travel/",
          onClick: closeMenu
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Travel`);
            } else {
              return [
                createTextVNode("Travel")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</li><li data-v-b63a13b7>`);
        _push(ssrRenderComponent(unref(RouterLink), {
          to: "/contact/",
          onClick: closeMenu
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Contact`);
            } else {
              return [
                createTextVNode("Contact")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</li></ul></nav>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup$d = _sfc_main$d.setup;
_sfc_main$d.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/HamburgerMenu.vue");
  return _sfc_setup$d ? _sfc_setup$d(props, ctx) : void 0;
};
const HamburgerMenu = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["__scopeId", "data-v-b63a13b7"]]);
const Unknown = [{ "filename": "IMG_6552.JPG", "path": "/src/assets/images/travel_images/IMG_6552.JPG", "hasGPS": false, "lat": null, "lng": null, "city": null, "state": null, "country": null, "date": "2026-01-06T11:23:22.000Z", "camera": "Apple iPhone 17 Pro Max" }, { "filename": "IMG_3172.jpg", "path": "/src/assets/images/travel_images/IMG_3172.jpg", "hasGPS": false, "lat": null, "lng": null, "city": null, "state": null, "country": null, "date": null, "camera": null }, { "filename": "IMG_3372.jpg", "path": "/src/assets/images/travel_images/IMG_3372.jpg", "hasGPS": false, "lat": null, "lng": null, "city": null, "state": null, "country": null, "date": null, "camera": null }, { "filename": "IMG_3428.jpg", "path": "/src/assets/images/travel_images/IMG_3428.jpg", "hasGPS": false, "lat": null, "lng": null, "city": null, "state": null, "country": null, "date": null, "camera": null }, { "filename": "IMG_7411.jpg", "path": "/src/assets/images/travel_images/IMG_7411.jpg", "hasGPS": false, "lat": null, "lng": null, "city": null, "state": null, "country": null, "date": null, "camera": null }, { "filename": "IMG_7430.jpg", "path": "/src/assets/images/travel_images/IMG_7430.jpg", "hasGPS": false, "lat": null, "lng": null, "city": null, "state": null, "country": null, "date": null, "camera": null }, { "filename": "IMG_7446.jpg", "path": "/src/assets/images/travel_images/IMG_7446.jpg", "hasGPS": false, "lat": null, "lng": null, "city": null, "state": null, "country": null, "date": null, "camera": null }];
const California = /* @__PURE__ */ JSON.parse('[{"filename":"IMG_6352.JPG","path":"/src/assets/images/travel_images/IMG_6352.JPG","hasGPS":true,"lat":34.03918888888889,"lng":-118.58115277777777,"city":"Unknown","state":"California","country":"United States","date":"2025-12-28T09:58:57.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6353.JPG","path":"/src/assets/images/travel_images/IMG_6353.JPG","hasGPS":true,"lat":34.03918888888889,"lng":-118.5811611111111,"city":"Unknown","state":"California","country":"United States","date":"2025-12-28T09:59:00.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6357.JPG","path":"/src/assets/images/travel_images/IMG_6357.JPG","hasGPS":true,"lat":34.03698333333333,"lng":-118.67746111111111,"city":"Malibu","state":"California","country":"United States","date":"2025-12-28T13:36:02.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6365.JPG","path":"/src/assets/images/travel_images/IMG_6365.JPG","hasGPS":true,"lat":34.03650277777778,"lng":-118.67617777777778,"city":"Malibu","state":"California","country":"United States","date":"2025-12-28T13:39:23.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6366.JPG","path":"/src/assets/images/travel_images/IMG_6366.JPG","hasGPS":true,"lat":34.036091666666664,"lng":-118.67591944444445,"city":"Malibu","state":"California","country":"United States","date":"2025-12-28T13:40:25.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6369.JPG","path":"/src/assets/images/travel_images/IMG_6369.JPG","hasGPS":true,"lat":34.03888611111111,"lng":-118.66967777777778,"city":"Malibu","state":"California","country":"United States","date":"2025-12-28T17:58:11.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6370.JPG","path":"/src/assets/images/travel_images/IMG_6370.JPG","hasGPS":true,"lat":34.03892777777778,"lng":-118.66970833333333,"city":"Malibu","state":"California","country":"United States","date":"2025-12-28T18:13:39.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6371.JPG","path":"/src/assets/images/travel_images/IMG_6371.JPG","hasGPS":true,"lat":34.038913888888885,"lng":-118.66971666666667,"city":"Malibu","state":"California","country":"United States","date":"2025-12-28T18:20:08.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6372.JPG","path":"/src/assets/images/travel_images/IMG_6372.JPG","hasGPS":true,"lat":34.03894722222222,"lng":-118.66970833333333,"city":"Malibu","state":"California","country":"United States","date":"2025-12-28T18:26:39.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6373.JPG","path":"/src/assets/images/travel_images/IMG_6373.JPG","hasGPS":true,"lat":34.03894444444444,"lng":-118.66969444444445,"city":"Malibu","state":"California","country":"United States","date":"2025-12-28T18:32:56.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6379.JPG","path":"/src/assets/images/travel_images/IMG_6379.JPG","hasGPS":true,"lat":34.083111111111116,"lng":-118.6030111111111,"city":"Topanga","state":"California","country":"United States","date":"2025-12-29T10:38:12.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6383.JPG","path":"/src/assets/images/travel_images/IMG_6383.JPG","hasGPS":true,"lat":34.40745277777778,"lng":-119.69841111111111,"city":"Santa Barbara","state":"California","country":"United States","date":"2025-12-29T16:49:55.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6385.JPG","path":"/src/assets/images/travel_images/IMG_6385.JPG","hasGPS":true,"lat":34.40425277777778,"lng":-119.69354166666668,"city":"Santa Barbara","state":"California","country":"United States","date":"2025-12-30T09:08:16.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6393.JPG","path":"/src/assets/images/travel_images/IMG_6393.JPG","hasGPS":true,"lat":34.40278611111111,"lng":-119.7054888888889,"city":"Santa Barbara","state":"California","country":"United States","date":"2025-12-30T10:44:18.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6395.JPG","path":"/src/assets/images/travel_images/IMG_6395.JPG","hasGPS":true,"lat":34.40289722222222,"lng":-119.70539722222223,"city":"Santa Barbara","state":"California","country":"United States","date":"2025-12-30T10:44:59.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6398.JPG","path":"/src/assets/images/travel_images/IMG_6398.JPG","hasGPS":true,"lat":34.594997222222226,"lng":-120.13919722222222,"city":"Solvang","state":"California","country":"United States","date":"2025-12-31T10:15:59.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6401.JPG","path":"/src/assets/images/travel_images/IMG_6401.JPG","hasGPS":true,"lat":35.106544444444445,"lng":-120.63226944444443,"city":"Unknown","state":"California","country":"United States","date":"2025-12-31T12:08:14.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6407.JPG","path":"/src/assets/images/travel_images/IMG_6407.JPG","hasGPS":true,"lat":35.10681666666667,"lng":-120.63237777777778,"city":"Unknown","state":"California","country":"United States","date":"2025-12-31T12:10:11.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6422.JPG","path":"/src/assets/images/travel_images/IMG_6422.JPG","hasGPS":true,"lat":35.22731111111111,"lng":-120.59968611111111,"city":"Unknown","state":"California","country":"United States","date":"2025-12-31T16:07:20.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6430.JPG","path":"/src/assets/images/travel_images/IMG_6430.JPG","hasGPS":true,"lat":35.66231388888889,"lng":-121.25579722222223,"city":"Unknown","state":"California","country":"United States","date":"2026-01-01T10:33:26.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6441.JPG","path":"/src/assets/images/travel_images/IMG_6441.JPG","hasGPS":true,"lat":35.66229722222222,"lng":-121.25621111111111,"city":"Unknown","state":"California","country":"United States","date":"2026-01-01T11:00:45.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6449.JPG","path":"/src/assets/images/travel_images/IMG_6449.JPG","hasGPS":true,"lat":35.79854722222222,"lng":-121.34777777777778,"city":"Unknown","state":"California","country":"United States","date":"2026-01-01T11:31:09.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6459.JPG","path":"/src/assets/images/travel_images/IMG_6459.JPG","hasGPS":true,"lat":36.21749722222222,"lng":-121.75080833333334,"city":"Unknown","state":"California","country":"United States","date":"2026-01-02T07:45:14.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6462.JPG","path":"/src/assets/images/travel_images/IMG_6462.JPG","hasGPS":true,"lat":36.217936111111115,"lng":-121.74940555555555,"city":"Unknown","state":"California","country":"United States","date":"2026-01-02T07:50:48.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6464.JPG","path":"/src/assets/images/travel_images/IMG_6464.JPG","hasGPS":true,"lat":36.217336111111116,"lng":-121.7504888888889,"city":"Unknown","state":"California","country":"United States","date":"2026-01-02T07:58:43.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6470.JPG","path":"/src/assets/images/travel_images/IMG_6470.JPG","hasGPS":true,"lat":36.37242222222222,"lng":-121.9031138888889,"city":"Unknown","state":"California","country":"United States","date":"2026-01-02T08:48:33.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6487.JPG","path":"/src/assets/images/travel_images/IMG_6487.JPG","hasGPS":true,"lat":36.522675,"lng":-121.95192777777778,"city":"Unknown","state":"California","country":"United States","date":"2026-01-02T09:57:15.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6499.JPG","path":"/src/assets/images/travel_images/IMG_6499.JPG","hasGPS":true,"lat":36.56952777777778,"lng":-121.96557777777778,"city":"Unknown","state":"California","country":"United States","date":"2026-01-03T14:59:08.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6503.JPG","path":"/src/assets/images/travel_images/IMG_6503.JPG","hasGPS":true,"lat":36.56951111111111,"lng":-121.96556111111111,"city":"Unknown","state":"California","country":"United States","date":"2026-01-03T14:59:59.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6511.JPG","path":"/src/assets/images/travel_images/IMG_6511.JPG","hasGPS":true,"lat":36.56843888888889,"lng":-121.95012777777778,"city":"Unknown","state":"California","country":"United States","date":"2026-01-03T15:45:36.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6512.JPG","path":"/src/assets/images/travel_images/IMG_6512.JPG","hasGPS":true,"lat":36.568136111111116,"lng":-121.94957777777778,"city":"Unknown","state":"California","country":"United States","date":"2026-01-03T16:46:20.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6515.JPG","path":"/src/assets/images/travel_images/IMG_6515.JPG","hasGPS":true,"lat":36.56809722222223,"lng":-121.94973888888889,"city":"Unknown","state":"California","country":"United States","date":"2026-01-03T16:46:37.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6524.JPG","path":"/src/assets/images/travel_images/IMG_6524.JPG","hasGPS":true,"lat":37.77601111111111,"lng":-122.43368611111111,"city":"San Francisco","state":"California","country":"United States","date":"2026-01-04T15:24:56.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6528.JPG","path":"/src/assets/images/travel_images/IMG_6528.JPG","hasGPS":true,"lat":37.801563888888886,"lng":-122.42091388888889,"city":"San Francisco","state":"California","country":"United States","date":"2026-01-04T15:52:20.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6533.JPG","path":"/src/assets/images/travel_images/IMG_6533.JPG","hasGPS":true,"lat":37.80317222222222,"lng":-122.40987222222223,"city":"San Francisco","state":"California","country":"United States","date":"2026-01-04T17:01:40.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6541.JPG","path":"/src/assets/images/travel_images/IMG_6541.JPG","hasGPS":true,"lat":37.80251944444444,"lng":-122.40573888888889,"city":"San Francisco","state":"California","country":"United States","date":"2026-01-04T17:14:20.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6553.JPG","path":"/src/assets/images/travel_images/IMG_6553.JPG","hasGPS":true,"lat":39.189411111111106,"lng":-120.27524444444444,"city":"Unknown","state":"California","country":"United States","date":"2026-01-06T11:40:20.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6577.JPG","path":"/src/assets/images/travel_images/IMG_6577.JPG","hasGPS":true,"lat":39.17423055555555,"lng":-120.24131944444444,"city":"Unknown","state":"California","country":"United States","date":"2026-01-09T12:30:56.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6584.JPG","path":"/src/assets/images/travel_images/IMG_6584.JPG","hasGPS":true,"lat":36.565711111111106,"lng":-118.77336111111111,"city":"Unknown","state":"California","country":"United States","date":"2026-01-10T09:25:03.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6585.JPG","path":"/src/assets/images/travel_images/IMG_6585.JPG","hasGPS":true,"lat":36.56528611111111,"lng":-118.77343611111111,"city":"Unknown","state":"California","country":"United States","date":"2026-01-10T09:26:15.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6588.JPG","path":"/src/assets/images/travel_images/IMG_6588.JPG","hasGPS":true,"lat":36.564769444444444,"lng":-118.77293333333333,"city":"Unknown","state":"California","country":"United States","date":"2026-01-10T09:29:51.000Z","camera":"Apple iPhone 17 Pro Max"},{"filename":"IMG_6593.JPG","path":"/src/assets/images/travel_images/IMG_6593.JPG","hasGPS":true,"lat":36.58162222222222,"lng":-118.75145555555555,"city":"Unknown","state":"California","country":"United States","date":"2026-01-10T10:19:02.000Z","camera":"Apple iPhone 17 Pro Max"}]');
const travelPhotos = {
  Unknown,
  California
};
const _sfc_main$c = {
  __name: "App",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const pageTitle = computed(() => {
      if (route.name === "TravelState" && route.params.state) {
        const slug = route.params.state;
        const stateName = Object.keys(travelPhotos).find(
          (state) => state.toLowerCase().replace(/\s+/g, "-") === slug
        );
        return stateName || "Travel Gallery";
      }
      return route.name || "Sam Townsend";
    });
    useHead({
      title: computed(() => route.meta.title || "Sam Townsend"),
      meta: [
        {
          name: "description",
          content: computed(() => route.meta.description || "Sam Townsend - Software Engineer")
        },
        {
          property: "og:title",
          content: computed(() => route.meta.title || "Sam Townsend")
        },
        {
          property: "og:description",
          content: computed(() => route.meta.ogDescription || route.meta.description || "Sam Townsend - Software Engineer")
        },
        {
          property: "og:url",
          content: computed(() => route.meta.ogUrl || "https://sft3hy.github.io/sam-townsend/")
        },
        {
          property: "og:image",
          content: computed(() => {
            const image = route.meta.ogImage;
            if (!image) return "https://sft3hy.github.io/sam-townsend/assets/surfingOBX.jpeg";
            if (image.startsWith("http")) return image;
            return `https://sft3hy.github.io${image}`;
          })
        },
        {
          property: "og:type",
          content: "website"
        },
        {
          name: "twitter:card",
          content: "summary_large_image"
        }
      ],
      link: [
        {
          rel: "canonical",
          href: computed(() => route.meta.canonical || "https://sft3hy.github.io/sam-townsend/")
        }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ id: "app" }, _attrs))} data-v-73385950><header class="top-bar glass-panel" data-v-73385950><div class="logo" data-v-73385950>`);
      _push(ssrRenderComponent(unref(RouterLink), { to: "/" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(pageTitle.value)}`);
          } else {
            return [
              createTextVNode(toDisplayString(pageTitle.value), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      _push(ssrRenderComponent(HamburgerMenu, null, null, _parent));
      _push(`</header><main class="page-content" data-v-73385950>`);
      _push(ssrRenderComponent(unref(RouterView), null, {
        default: withCtx(({ Component }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(``);
            ssrRenderVNode(_push2, createVNode(resolveDynamicComponent(Component), null, null), _parent2, _scopeId);
          } else {
            return [
              createVNode(Transition, {
                name: "fade",
                mode: "out-in"
              }, {
                default: withCtx(() => [
                  (openBlock(), createBlock(resolveDynamicComponent(Component)))
                ]),
                _: 2
              }, 1024)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</main><footer class="site-footer" data-v-73385950><p data-v-73385950>© ${ssrInterpolate((/* @__PURE__ */ new Date()).getFullYear())} Sam Townsend</p></footer></div>`);
    };
  }
};
const _sfc_setup$c = _sfc_main$c.setup;
_sfc_main$c.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/App.vue");
  return _sfc_setup$c ? _sfc_setup$c(props, ctx) : void 0;
};
const App = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["__scopeId", "data-v-73385950"]]);
const aboutImg = "/sam-townsend/assets/backpackingCamino-CkTQbku8.jpeg";
const __vite_glob_0_0$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: aboutImg
}, Symbol.toStringTag, { value: "Module" }));
const homeImg = "/sam-townsend/assets/Climbing-DhPahopr.jpeg";
const __vite_glob_1_0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: homeImg
}, Symbol.toStringTag, { value: "Module" }));
function createTag(type, propertyName, property, content) {
  const tag = document.createElement(type);
  tag.setAttribute(propertyName, property);
  tag.content = content;
  document.head.insertBefore(tag, document.head.firstChild);
}
const toRemove = 'meta[name="description"], meta[property="og:title"], meta[property="og:site_name"], meta[property="og:description"], meta[property="og:url"], link[rel="canonical"]';
function removeTags() {
  const existingMetaTags = document.querySelectorAll(toRemove);
  existingMetaTags.forEach((tag) => tag.remove());
}
function loadImages(folderName) {
  const imageFolders = {
    folder1: /* @__PURE__ */ Object.assign({ "/src/assets/images/about_pictures/backpackingCamino.jpeg": __vite_glob_0_0$1 }),
    folder2: /* @__PURE__ */ Object.assign({ "/src/assets/images/home_picture/Climbing.jpeg": __vite_glob_1_0 })
  };
  console.log(imageFolders);
  {
    return imageFolders.folder1 || {};
  }
}
function preloadImage(folderName) {
  const images = loadImages();
  for (const path in images) {
    if (path.includes("backpackingCamino") || folderName === "home_picture") {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = images[path].default;
      document.head.appendChild(link);
      break;
    }
  }
}
const _sfc_main$b = {
  __name: "HomeView",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<main${ssrRenderAttrs(mergeProps({ class: "home-container" }, _attrs))} data-v-d6e11c28><div class="hero-content" data-v-d6e11c28><div class="text-section" data-v-d6e11c28><h1 class="animate-title" data-v-d6e11c28>Howdy!</h1><p class="home-text" data-v-d6e11c28> Glad you could make it. Welcome to my site built with <a href="https://vuejs.org" target="_blank" rel="noopener" data-v-d6e11c28>Vue JS</a>. </p><div class="cta-group" data-v-d6e11c28>`);
      _push(ssrRenderComponent(unref(RouterLink), {
        to: "/about",
        class: "btn btn-primary"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`About Me`);
          } else {
            return [
              createTextVNode("About Me")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(unref(RouterLink), {
        to: "/contact",
        class: "btn btn-secondary"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Get in Touch`);
          } else {
            return [
              createTextVNode("Get in Touch")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div><div class="image-section" data-v-d6e11c28><div class="image-wrapper glass-panel" data-v-d6e11c28>`);
      _push(ssrRenderComponent(unref(VLazyImage), {
        src: unref(homeImg),
        alt: "Climbing Seneca Rocks",
        class: "hero-image"
      }, null, _parent));
      _push(`<div class="caption-badge glass-panel" data-v-d6e11c28> Summit of <a href="https://en.wikipedia.org/wiki/Seneca_Rocks" target="_blank" rel="noopener" data-v-d6e11c28>Seneca Rocks</a>, WV </div></div></div></div></main>`);
    };
  }
};
const _sfc_setup$b = _sfc_main$b.setup;
_sfc_main$b.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/views/HomeView.vue");
  return _sfc_setup$b ? _sfc_setup$b(props, ctx) : void 0;
};
const Home = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["__scopeId", "data-v-d6e11c28"]]);
const ChicagoBean = "/sam-townsend/assets/ChicagoBean-C7MyVJBG.jpeg";
const Climbing1 = "/sam-townsend/assets/Climbing1-D4QvsRwu.jpeg";
const contactImg = "/sam-townsend/assets/friends-QBXhmBt0.jpeg";
const portfolioImg = "/sam-townsend/assets/SenecaBase-Cn2jCles.jpeg";
const snorkelMaui = "/sam-townsend/assets/snorkelMaui-CKYWCH3L.jpeg";
const travelImg = "/sam-townsend/assets/surfingMaui-CHUiz8dg.jpeg";
const surfingOBX = "/sam-townsend/assets/surfingOBX-CDVQ7Efm.jpeg";
const _sfc_main$a = {
  __name: "AboutView",
  __ssrInlineRender: true,
  setup(__props) {
    const images = ref([
      { src: aboutImg, alt: "Backpacking the Camino de Santiago", caption: "Backpacking Camino de Santiago in Spain" },
      { src: ChicagoBean, alt: "Visiting the Chicago Bean", caption: "Me and a friend visiting the Chicago Bean" },
      { src: Climbing1, alt: "Climbing the Manchester Wall", caption: "Climbing Manchester Wall in Richmond, VA" },
      { src: contactImg, alt: "Visiting Luray Caverns", caption: "Friends visiting the caverns in Luray, VA" },
      { src: portfolioImg, alt: "Seneca Rocks, WV", caption: "About to climb at Seneca Rocks, WV" },
      { src: snorkelMaui, alt: "Snorkeling in Maui", caption: "Snorkeling in Maui" },
      { src: travelImg, alt: "Surfing in Maui", caption: "Surfing in Maui" },
      { src: surfingOBX, alt: "Surfing in OBX", caption: "Surfing in the Outer Banks, NC" }
    ]);
    const width = ref(window.innerWidth);
    const isDesktop = computed(() => width.value >= 900);
    const updateWidth = () => {
      width.value = window.innerWidth;
    };
    onMounted(() => {
      window.addEventListener("resize", updateWidth);
      preloadImage("about_pictures");
    });
    onBeforeUnmount(() => {
      window.removeEventListener("resize", updateWidth);
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "about-container" }, _attrs))} data-v-89af5e3e><div class="split-section glass-panel" data-v-89af5e3e><div class="content-side" data-v-89af5e3e><h2 data-v-89af5e3e>Professional Stuff</h2><p data-v-89af5e3e> I grew up in Virginia Beach, VA and went to <a href="https://www.capehenrycollegiate.org/" target="_blank" rel="noopener" data-v-89af5e3e>Cape Henry</a> for high school. I chose <a href="https://www.virginia.edu/" target="_blank" rel="noopener" data-v-89af5e3e>UVA</a> for my secondary education. My first year, I explored a variety of classes before settling on a double major in Music and Computer Science. </p><p data-v-89af5e3e> In May 2022, I graduated and worked as a systems engineer for <a href="https://www.arcfield.com/" target="_blank" rel="noopener" data-v-89af5e3e>Arcfield</a>. There, I sharpened my Python skills, front-end development (JS/HTML/CSS), and back-end database management. I also learned container orchestration with Docker and Rancher. </p><p data-v-89af5e3e> Recently, I decided to pursue a Master’s in Data Science at the University of California, Irvine, while continuing to work remotely for Arcfield. </p></div><div class="divider" data-v-89af5e3e></div><div class="content-side" data-v-89af5e3e><h2 data-v-89af5e3e>Who I really am</h2><p data-v-89af5e3e> I’m a 26-year-old guy who enjoys some pretty standard stuff: watching football (Go Chiefs!), hiking, camping, and cooking. </p><p data-v-89af5e3e> I love living in La Jolla. Some of my favorite surf spots are Scripps Pier, Encinitas, and Trestles. </p></div></div><div class="carousel-section glass-panel" data-v-89af5e3e><h3 data-v-89af5e3e>Adventures</h3><div class="swiper-container" data-v-89af5e3e>`);
      _push(ssrRenderComponent(unref(Swiper), {
        modules: [unref(FreeMode), unref(Navigation), unref(Pagination), unref(Mousewheel)],
        "slides-per-view": isDesktop.value ? 2.5 : 1.2,
        "space-between": 20,
        "free-mode": {
          enabled: true,
          momentum: false
        },
        mousewheel: {
          forceToAxis: true,
          sensitivity: 1
        },
        navigation: {
          prevEl: ".swiper-button-prev",
          nextEl: ".swiper-button-next"
        },
        pagination: { clickable: true },
        class: "adventures-swiper"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<!--[-->`);
            ssrRenderList(images.value, (image, index) => {
              _push2(ssrRenderComponent(unref(SwiperSlide), { key: index }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="carousel__item" data-v-89af5e3e${_scopeId2}><div class="image-card" data-v-89af5e3e${_scopeId2}>`);
                    _push3(ssrRenderComponent(unref(VLazyImage), {
                      src: image.src,
                      alt: image.alt,
                      class: "slide-image"
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div class="slide-caption glass-panel" data-v-89af5e3e${_scopeId2}>${ssrInterpolate(image.caption)}</div></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "carousel__item" }, [
                        createVNode("div", { class: "image-card" }, [
                          createVNode(unref(VLazyImage), {
                            src: image.src,
                            alt: image.alt,
                            class: "slide-image"
                          }, null, 8, ["src", "alt"])
                        ]),
                        createVNode("div", { class: "slide-caption glass-panel" }, toDisplayString(image.caption), 1)
                      ])
                    ];
                  }
                }),
                _: 2
              }, _parent2, _scopeId));
            });
            _push2(`<!--]-->`);
          } else {
            return [
              (openBlock(true), createBlock(Fragment, null, renderList(images.value, (image, index) => {
                return openBlock(), createBlock(unref(SwiperSlide), { key: index }, {
                  default: withCtx(() => [
                    createVNode("div", { class: "carousel__item" }, [
                      createVNode("div", { class: "image-card" }, [
                        createVNode(unref(VLazyImage), {
                          src: image.src,
                          alt: image.alt,
                          class: "slide-image"
                        }, null, 8, ["src", "alt"])
                      ]),
                      createVNode("div", { class: "slide-caption glass-panel" }, toDisplayString(image.caption), 1)
                    ])
                  ]),
                  _: 2
                }, 1024);
              }), 128))
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="swiper-button-prev" data-v-89af5e3e></div><div class="swiper-button-next" data-v-89af5e3e></div></div></div></div>`);
    };
  }
};
const _sfc_setup$a = _sfc_main$a.setup;
_sfc_main$a.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/views/AboutView.vue");
  return _sfc_setup$a ? _sfc_setup$a(props, ctx) : void 0;
};
const About = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["__scopeId", "data-v-89af5e3e"]]);
const _sfc_main$9 = {};
function _sfc_ssrRender$3(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    viewBox: "0 0 32 32",
    width: "32",
    height: "32",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><rect x="2" y="2" width="28" height="28" rx="6" fill="url(#paint0_radial_87_7153)"></rect><rect x="2" y="2" width="28" height="28" rx="6" fill="url(#paint1_radial_87_7153)"></rect><rect x="2" y="2" width="28" height="28" rx="6" fill="url(#paint2_radial_87_7153)"></rect><path d="M23 10.5C23 11.3284 22.3284 12 21.5 12C20.6716 12 20 11.3284 20 10.5C20 9.67157 20.6716 9 21.5 9C22.3284 9 23 9.67157 23 10.5Z" fill="white"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M16 21C18.7614 21 21 18.7614 21 16C21 13.2386 18.7614 11 16 11C13.2386 11 11 13.2386 11 16C11 18.7614 13.2386 21 16 21ZM16 19C17.6569 19 19 17.6569 19 16C19 14.3431 17.6569 13 16 13C14.3431 13 13 14.3431 13 16C13 17.6569 14.3431 19 16 19Z" fill="white"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M6 15.6C6 12.2397 6 10.5595 6.65396 9.27606C7.2292 8.14708 8.14708 7.2292 9.27606 6.65396C10.5595 6 12.2397 6 15.6 6H16.4C19.7603 6 21.4405 6 22.7239 6.65396C23.8529 7.2292 24.7708 8.14708 25.346 9.27606C26 10.5595 26 12.2397 26 15.6V16.4C26 19.7603 26 21.4405 25.346 22.7239C24.7708 23.8529 23.8529 24.7708 22.7239 25.346C21.4405 26 19.7603 26 16.4 26H15.6C12.2397 26 10.5595 26 9.27606 25.346C8.14708 24.7708 7.2292 23.8529 6.65396 22.7239C6 21.4405 6 19.7603 6 16.4V15.6ZM15.6 8H16.4C18.1132 8 19.2777 8.00156 20.1779 8.0751C21.0548 8.14674 21.5032 8.27659 21.816 8.43597C22.5686 8.81947 23.1805 9.43139 23.564 10.184C23.7234 10.4968 23.8533 10.9452 23.9249 11.8221C23.9984 12.7223 24 13.8868 24 15.6V16.4C24 18.1132 23.9984 19.2777 23.9249 20.1779C23.8533 21.0548 23.7234 21.5032 23.564 21.816C23.1805 22.5686 22.5686 23.1805 21.816 23.564C21.5032 23.7234 21.0548 23.8533 20.1779 23.9249C19.2777 23.9984 18.1132 24 16.4 24H15.6C13.8868 24 12.7223 23.9984 11.8221 23.9249C10.9452 23.8533 10.4968 23.7234 10.184 23.564C9.43139 23.1805 8.81947 22.5686 8.43597 21.816C8.27659 21.5032 8.14674 21.0548 8.0751 20.1779C8.00156 19.2777 8 18.1132 8 16.4V15.6C8 13.8868 8.00156 12.7223 8.0751 11.8221C8.14674 10.9452 8.27659 10.4968 8.43597 10.184C8.81947 9.43139 9.43139 8.81947 10.184 8.43597C10.4968 8.27659 10.9452 8.14674 11.8221 8.0751C12.7223 8.00156 13.8868 8 15.6 8Z" fill="white"></path><defs><radialGradient id="paint0_radial_87_7153" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(12 23) rotate(-55.3758) scale(25.5196)"><stop stop-color="#B13589"></stop><stop offset="0.79309" stop-color="#C62F94"></stop><stop offset="1" stop-color="#8A3AC8"></stop></radialGradient><radialGradient id="paint1_radial_87_7153" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(11 31) rotate(-65.1363) scale(22.5942)"><stop stop-color="#E0E8B7"></stop><stop offset="0.444662" stop-color="#FB8A2E"></stop><stop offset="0.71474" stop-color="#E2425C"></stop><stop offset="1" stop-color="#E2425C" stop-opacity="0"></stop></radialGradient><radialGradient id="paint2_radial_87_7153" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(0.500002 3) rotate(-8.1301) scale(38.8909 8.31836)"><stop offset="0.156701" stop-color="#406ADC"></stop><stop offset="0.467799" stop-color="#6A45BE"></stop><stop offset="1" stop-color="#6A45BE" stop-opacity="0"></stop></radialGradient></defs></g></svg>`);
}
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/icons/Instagram.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
const Instagram = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["ssrRender", _sfc_ssrRender$3]]);
const _sfc_main$8 = {};
function _sfc_ssrRender$2(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    viewBox: "0 0 32 32",
    width: "32",
    height: "32",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M2 11.9556C2 8.47078 2 6.7284 2.67818 5.39739C3.27473 4.22661 4.22661 3.27473 5.39739 2.67818C6.7284 2 8.47078 2 11.9556 2H20.0444C23.5292 2 25.2716 2 26.6026 2.67818C27.7734 3.27473 28.7253 4.22661 29.3218 5.39739C30 6.7284 30 8.47078 30 11.9556V20.0444C30 23.5292 30 25.2716 29.3218 26.6026C28.7253 27.7734 27.7734 28.7253 26.6026 29.3218C25.2716 30 23.5292 30 20.0444 30H11.9556C8.47078 30 6.7284 30 5.39739 29.3218C4.22661 28.7253 3.27473 27.7734 2.67818 26.6026C2 25.2716 2 23.5292 2 20.0444V11.9556Z" fill="white"></path><path d="M22.0515 8.52295L16.0644 13.1954L9.94043 8.52295V8.52421L9.94783 8.53053V15.0732L15.9954 19.8466L22.0515 15.2575V8.52295Z" fill="#EA4335"></path><path d="M23.6231 7.38639L22.0508 8.52292V15.2575L26.9983 11.459V9.17074C26.9983 9.17074 26.3978 5.90258 23.6231 7.38639Z" fill="#FBBC05"></path><path d="M22.0508 15.2575V23.9924H25.8428C25.8428 23.9924 26.9219 23.8813 26.9995 22.6513V11.459L22.0508 15.2575Z" fill="#34A853"></path><path d="M9.94811 24.0001V15.0732L9.94043 15.0669L9.94811 24.0001Z" fill="#C5221F"></path><path d="M9.94014 8.52404L8.37646 7.39382C5.60179 5.91001 5 9.17692 5 9.17692V11.4651L9.94014 15.0667V8.52404Z" fill="#C5221F"></path><path d="M9.94043 8.52441V15.0671L9.94811 15.0734V8.53073L9.94043 8.52441Z" fill="#C5221F"></path><path d="M5 11.4668V22.6591C5.07646 23.8904 6.15673 24.0003 6.15673 24.0003H9.94877L9.94014 15.0671L5 11.4668Z" fill="#4285F4"></path></g></svg>`);
}
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/icons/Gmail.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const Gmail = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["ssrRender", _sfc_ssrRender$2]]);
const _sfc_main$7 = {};
function _sfc_ssrRender$1(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    viewBox: "0 0 16 16",
    width: "32",
    height: "32",
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none"
  }, _attrs))}><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill="#0A66C2" d="M12.225 12.225h-1.778V9.44c0-.664-.012-1.519-.925-1.519-.926 0-1.068.724-1.068 1.47v2.834H6.676V6.498h1.707v.783h.024c.348-.594.996-.95 1.684-.925 1.802 0 2.135 1.185 2.135 2.728l-.001 3.14zM4.67 5.715a1.037 1.037 0 01-1.032-1.031c0-.566.466-1.032 1.032-1.032.566 0 1.031.466 1.032 1.032 0 .566-.466 1.032-1.032 1.032zm.889 6.51h-1.78V6.498h1.78v5.727zM13.11 2H2.885A.88.88 0 002 2.866v10.268a.88.88 0 00.885.866h10.226a.882.882 0 00.889-.866V2.865a.88.88 0 00-.889-.864z"></path></g></svg>`);
}
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/icons/LinkedIn.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const LinkedIn = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["ssrRender", _sfc_ssrRender$1]]);
const _sfc_main$6 = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    viewBox: "0 0 20 20",
    width: "32",
    height: "32",
    version: "1.1",
    xmlns: "http://www.w3.org/2000/svg",
    "xmlns:xlink": "http://www.w3.org/1999/xlink",
    fill: "#000000"
  }, _attrs))}><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><title>github [#142]</title><desc>Created with Sketch.</desc><defs></defs><g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="Dribbble-Light-Preview" transform="translate(-140.000000, -7559.000000)" fill="#000000"><g id="icons" transform="translate(56.000000, 160.000000)"><path d="M94,7399 C99.523,7399 104,7403.59 104,7409.253 C104,7413.782 101.138,7417.624 97.167,7418.981 C96.66,7419.082 96.48,7418.762 96.48,7418.489 C96.48,7418.151 96.492,7417.047 96.492,7415.675 C96.492,7414.719 96.172,7414.095 95.813,7413.777 C98.04,7413.523 100.38,7412.656 100.38,7408.718 C100.38,7407.598 99.992,7406.684 99.35,7405.966 C99.454,7405.707 99.797,7404.664 99.252,7403.252 C99.252,7403.252 98.414,7402.977 96.505,7404.303 C95.706,7404.076 94.85,7403.962 94,7403.958 C93.15,7403.962 92.295,7404.076 91.497,7404.303 C89.586,7402.977 88.746,7403.252 88.746,7403.252 C88.203,7404.664 88.546,7405.707 88.649,7405.966 C88.01,7406.684 87.619,7407.598 87.619,7408.718 C87.619,7412.646 89.954,7413.526 92.175,7413.785 C91.889,7414.041 91.63,7414.493 91.54,7415.156 C90.97,7415.418 89.522,7415.871 88.63,7414.304 C88.63,7414.304 88.101,7413.319 87.097,7413.247 C87.097,7413.247 86.122,7413.234 87.029,7413.87 C87.029,7413.87 87.684,7414.185 88.139,7415.37 C88.139,7415.37 88.726,7417.2 91.508,7416.58 C91.513,7417.437 91.522,7418.245 91.522,7418.489 C91.522,7418.76 91.338,7419.077 90.839,7418.982 C86.865,7417.627 84,7413.783 84,7409.253 C84,7403.59 88.478,7399 94,7399" id="github-[#142]"></path></g></g></g></g></svg>`);
}
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/icons/GitHub.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const GitHub = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["ssrRender", _sfc_ssrRender]]);
const _sfc_main$5 = {
  __name: "ContactIcons",
  __ssrInlineRender: true,
  setup(__props) {
    const contacts = [
      {
        name: "Email",
        value: "smaueltown@gmail.com",
        link: "mailto:smaueltown@gmail.com",
        icon: Gmail,
        color: "#EA4335"
      },
      {
        name: "LinkedIn",
        value: "samuel-townsend1",
        link: "https://linkedin.com/in/samuel-townsend1",
        icon: LinkedIn,
        color: "#0A66C2"
      },
      {
        name: "GitHub",
        value: "sft3hy",
        link: "https://github.com/sft3hy",
        icon: GitHub,
        color: "#181717"
      },
      {
        name: "Instagram",
        value: "@sam_townsend_",
        link: "https://www.instagram.com/sam_townsend_",
        icon: Instagram,
        color: "#E4405F"
      }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "contact-container" }, _attrs))} data-v-6ee2eaf6><div class="header-section glass-panel" data-v-6ee2eaf6><h1 data-v-6ee2eaf6>Get in Touch</h1><p class="subtitle" data-v-6ee2eaf6>I&#39;m always open to discussing new projects, creative ideas or opportunities to collaborate.</p></div><div class="contact-grid" data-v-6ee2eaf6><!--[-->`);
      ssrRenderList(contacts, (contact) => {
        _push(`<a${ssrRenderAttr("href", contact.link)} target="_blank" rel="noopener" class="contact-card glass-panel" data-v-6ee2eaf6><div class="icon-wrapper" style="${ssrRenderStyle({ color: contact.color })}" data-v-6ee2eaf6>`);
        ssrRenderVNode(_push, createVNode(resolveDynamicComponent(contact.icon), { class: "contact-icon" }, null), _parent);
        _push(`</div><div class="card-content" data-v-6ee2eaf6><h3 data-v-6ee2eaf6>${ssrInterpolate(contact.name)}</h3><p data-v-6ee2eaf6>${ssrInterpolate(contact.value)}</p></div><div class="card-arrow" data-v-6ee2eaf6>→</div></a>`);
      });
      _push(`<!--]--></div></div>`);
    };
  }
};
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/ContactIcons.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const ContactInfo = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["__scopeId", "data-v-6ee2eaf6"]]);
const _sfc_main$4 = {
  __name: "ContactView",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "contact-view" }, _attrs))} data-v-fee41a46>`);
      _push(ssrRenderComponent(ContactInfo, null, null, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/views/ContactView.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const Contact = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["__scopeId", "data-v-fee41a46"]]);
const _sfc_main$3 = {
  __name: "PortfolioView",
  __ssrInlineRender: true,
  setup(__props) {
    const sites = ref([
      { name: "Website Information Extractor", url: "https://cosmic-web-gist.streamlit.app/", image: "url-parser.png", description: "Parses website contents and uses an LLM to extract relevant information." },
      { name: "Document Summarizer", url: "https://the-gist.streamlit.app/", image: "document-summarizer.png", description: "Summarizes documents using an LLM." },
      { name: "NOAA GOES-18 Satellite Imagery Change Detection", url: "https://noaa-goes18-change-detection.streamlit.app/", image: "sat-image-st.png", description: "Downloads NOAA GOES-18 satellite imagery from s3, combines multiple spectra to create full color images from today and yesterday, and calls a vision model to describe changes in the imagery." },
      { name: "Dashboard Creator", url: "https://cosmic-dashboard.streamlit.app/", image: "llm-dboard.png", description: "Users upload data files and ask for a chart from their data, and an LLM writes streamlit code to visualize their data." },
      { name: "Custom Brew", url: "https://custom-brew.streamlit.app/", image: "custom-brew.png", description: "Users can sign up for a daily newsletter and choose from several topics. An LLM then parses NewsAPI's output for that topic to choose the most relevant articles, and another LLM then summarizes each article before the email is sent to the correct users." },
      { name: "Wine Temperature Calculator", url: "https://wine-time.streamlit.app/", image: "wine-time.png", description: "Users input fridge temperature, desired wine temperature, and room temperature, and the app uses Newton's Law of Cooling to determine how long the wine should be left out to warm up to the desired temperature." }
    ]);
    const getImage = (imageName) => {
      return new URL(`../assets/images/portfolio_screenshots/${imageName}`, import.meta.url).href;
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "portfolio-container" }, _attrs))} data-v-34dcaaf4><div class="header-section glass-panel" data-v-34dcaaf4><h1 data-v-34dcaaf4>Project Portfolio</h1><p class="subtitle" data-v-34dcaaf4>Here are some of the projects I&#39;ve built.</p></div><div class="projects-grid" data-v-34dcaaf4><!--[-->`);
      ssrRenderList(sites.value, (site) => {
        _push(`<div class="project-card glass-panel" data-v-34dcaaf4><a${ssrRenderAttr("href", site.url)} target="_blank" class="card-link" data-v-34dcaaf4><div class="image-container" data-v-34dcaaf4><img${ssrRenderAttr("src", getImage(site.image))}${ssrRenderAttr("alt", site.name)} class="project-image" data-v-34dcaaf4><div class="overlay" data-v-34dcaaf4><span class="view-btn" data-v-34dcaaf4>View Project</span></div></div><div class="card-content" data-v-34dcaaf4><h3 data-v-34dcaaf4>${ssrInterpolate(site.name)}</h3><p data-v-34dcaaf4>${ssrInterpolate(site.description)}</p></div></a></div>`);
      });
      _push(`<!--]--></div></div>`);
    };
  }
};
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/views/PortfolioView.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const Portfolio = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__scopeId", "data-v-34dcaaf4"]]);
const IMG_3172 = "/sam-townsend/assets/IMG_3172-TGisIKL6.jpg";
const __vite_glob_0_0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_3172
}, Symbol.toStringTag, { value: "Module" }));
const IMG_3372 = "/sam-townsend/assets/IMG_3372-BxIKgmyd.jpg";
const __vite_glob_0_1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_3372
}, Symbol.toStringTag, { value: "Module" }));
const IMG_3428 = "/sam-townsend/assets/IMG_3428-C46U0bGB.jpg";
const __vite_glob_0_2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_3428
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6352 = "/sam-townsend/assets/IMG_6352-DwydId-W.JPG";
const __vite_glob_0_3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6352
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6353 = "/sam-townsend/assets/IMG_6353-DBQP4QcW.JPG";
const __vite_glob_0_4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6353
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6357 = "/sam-townsend/assets/IMG_6357-CG52eBQ2.JPG";
const __vite_glob_0_5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6357
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6365 = "/sam-townsend/assets/IMG_6365-BB7iyfDe.JPG";
const __vite_glob_0_6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6365
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6366 = "/sam-townsend/assets/IMG_6366-DMILvBmJ.JPG";
const __vite_glob_0_7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6366
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6369 = "/sam-townsend/assets/IMG_6369-DcQVr19T.JPG";
const __vite_glob_0_8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6369
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6370 = "/sam-townsend/assets/IMG_6370-DxEgApTO.JPG";
const __vite_glob_0_9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6370
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6371 = "/sam-townsend/assets/IMG_6371-DTJtIsYI.JPG";
const __vite_glob_0_10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6371
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6372 = "/sam-townsend/assets/IMG_6372-bMa4pJ4l.JPG";
const __vite_glob_0_11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6372
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6373 = "/sam-townsend/assets/IMG_6373-CZvTy5NN.JPG";
const __vite_glob_0_12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6373
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6379 = "/sam-townsend/assets/IMG_6379-BjozWOZ_.JPG";
const __vite_glob_0_13 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6379
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6383 = "/sam-townsend/assets/IMG_6383-4CRqOMMk.JPG";
const __vite_glob_0_14 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6383
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6385 = "/sam-townsend/assets/IMG_6385-Csz1FRVw.JPG";
const __vite_glob_0_15 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6385
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6393 = "/sam-townsend/assets/IMG_6393-DcVXXKgf.JPG";
const __vite_glob_0_16 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6393
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6395 = "/sam-townsend/assets/IMG_6395-DR8XH5pz.JPG";
const __vite_glob_0_17 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6395
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6398 = "/sam-townsend/assets/IMG_6398-DXyPFI0e.JPG";
const __vite_glob_0_18 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6398
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6401 = "/sam-townsend/assets/IMG_6401-Cg2mGdPJ.JPG";
const __vite_glob_0_19 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6401
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6407 = "/sam-townsend/assets/IMG_6407-BpwQc34l.JPG";
const __vite_glob_0_20 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6407
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6422 = "/sam-townsend/assets/IMG_6422-YIdfQK0V.JPG";
const __vite_glob_0_21 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6422
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6430 = "/sam-townsend/assets/IMG_6430-B3SDmYR6.JPG";
const __vite_glob_0_22 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6430
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6441 = "/sam-townsend/assets/IMG_6441-Bz8wi4_v.JPG";
const __vite_glob_0_23 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6441
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6449 = "/sam-townsend/assets/IMG_6449-Qpin3HuP.JPG";
const __vite_glob_0_24 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6449
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6459 = "/sam-townsend/assets/IMG_6459-dyH7IIcj.JPG";
const __vite_glob_0_25 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6459
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6462 = "/sam-townsend/assets/IMG_6462-6PBZiTza.JPG";
const __vite_glob_0_26 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6462
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6464 = "/sam-townsend/assets/IMG_6464-ocFzOTwn.JPG";
const __vite_glob_0_27 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6464
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6470 = "/sam-townsend/assets/IMG_6470-B_EkICDL.JPG";
const __vite_glob_0_28 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6470
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6487 = "/sam-townsend/assets/IMG_6487-iBIgFwCo.JPG";
const __vite_glob_0_29 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6487
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6499 = "/sam-townsend/assets/IMG_6499-CPis9fls.JPG";
const __vite_glob_0_30 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6499
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6503 = "/sam-townsend/assets/IMG_6503-HyXba89P.JPG";
const __vite_glob_0_31 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6503
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6511 = "/sam-townsend/assets/IMG_6511-BOHahYRG.JPG";
const __vite_glob_0_32 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6511
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6512 = "/sam-townsend/assets/IMG_6512-BdEytDPq.JPG";
const __vite_glob_0_33 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6512
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6515 = "/sam-townsend/assets/IMG_6515-CgUXy0-w.JPG";
const __vite_glob_0_34 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6515
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6524 = "/sam-townsend/assets/IMG_6524-DW8sZ535.JPG";
const __vite_glob_0_35 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6524
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6528 = "/sam-townsend/assets/IMG_6528-GKmtr0cl.JPG";
const __vite_glob_0_36 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6528
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6533 = "/sam-townsend/assets/IMG_6533-BwRcwdab.JPG";
const __vite_glob_0_37 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6533
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6541 = "/sam-townsend/assets/IMG_6541-oELD-egg.JPG";
const __vite_glob_0_38 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6541
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6552 = "/sam-townsend/assets/IMG_6552-C5EvtKB6.JPG";
const __vite_glob_0_39 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6552
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6553 = "/sam-townsend/assets/IMG_6553-Culq23YM.JPG";
const __vite_glob_0_40 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6553
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6577 = "/sam-townsend/assets/IMG_6577-C3P9IGv_.JPG";
const __vite_glob_0_41 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6577
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6584 = "/sam-townsend/assets/IMG_6584-DEfx5ddE.JPG";
const __vite_glob_0_42 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6584
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6585 = "/sam-townsend/assets/IMG_6585-By54u8uY.JPG";
const __vite_glob_0_43 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6585
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6588 = "/sam-townsend/assets/IMG_6588-csLWbBCO.JPG";
const __vite_glob_0_44 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6588
}, Symbol.toStringTag, { value: "Module" }));
const IMG_6593 = "/sam-townsend/assets/IMG_6593-Da3d4P23.JPG";
const __vite_glob_0_45 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_6593
}, Symbol.toStringTag, { value: "Module" }));
const IMG_7411 = "/sam-townsend/assets/IMG_7411-Be_ZGkfY.jpg";
const __vite_glob_0_46 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_7411
}, Symbol.toStringTag, { value: "Module" }));
const IMG_7430 = "/sam-townsend/assets/IMG_7430-DN_Ub_O-.jpg";
const __vite_glob_0_47 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_7430
}, Symbol.toStringTag, { value: "Module" }));
const IMG_7446 = "/sam-townsend/assets/IMG_7446-BiYeqkMY.jpg";
const __vite_glob_0_48 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: IMG_7446
}, Symbol.toStringTag, { value: "Module" }));
const travelImages = /* @__PURE__ */ Object.assign({ "/src/assets/images/travel_images/IMG_3172.jpg": __vite_glob_0_0, "/src/assets/images/travel_images/IMG_3372.jpg": __vite_glob_0_1, "/src/assets/images/travel_images/IMG_3428.jpg": __vite_glob_0_2, "/src/assets/images/travel_images/IMG_6352.JPG": __vite_glob_0_3, "/src/assets/images/travel_images/IMG_6353.JPG": __vite_glob_0_4, "/src/assets/images/travel_images/IMG_6357.JPG": __vite_glob_0_5, "/src/assets/images/travel_images/IMG_6365.JPG": __vite_glob_0_6, "/src/assets/images/travel_images/IMG_6366.JPG": __vite_glob_0_7, "/src/assets/images/travel_images/IMG_6369.JPG": __vite_glob_0_8, "/src/assets/images/travel_images/IMG_6370.JPG": __vite_glob_0_9, "/src/assets/images/travel_images/IMG_6371.JPG": __vite_glob_0_10, "/src/assets/images/travel_images/IMG_6372.JPG": __vite_glob_0_11, "/src/assets/images/travel_images/IMG_6373.JPG": __vite_glob_0_12, "/src/assets/images/travel_images/IMG_6379.JPG": __vite_glob_0_13, "/src/assets/images/travel_images/IMG_6383.JPG": __vite_glob_0_14, "/src/assets/images/travel_images/IMG_6385.JPG": __vite_glob_0_15, "/src/assets/images/travel_images/IMG_6393.JPG": __vite_glob_0_16, "/src/assets/images/travel_images/IMG_6395.JPG": __vite_glob_0_17, "/src/assets/images/travel_images/IMG_6398.JPG": __vite_glob_0_18, "/src/assets/images/travel_images/IMG_6401.JPG": __vite_glob_0_19, "/src/assets/images/travel_images/IMG_6407.JPG": __vite_glob_0_20, "/src/assets/images/travel_images/IMG_6422.JPG": __vite_glob_0_21, "/src/assets/images/travel_images/IMG_6430.JPG": __vite_glob_0_22, "/src/assets/images/travel_images/IMG_6441.JPG": __vite_glob_0_23, "/src/assets/images/travel_images/IMG_6449.JPG": __vite_glob_0_24, "/src/assets/images/travel_images/IMG_6459.JPG": __vite_glob_0_25, "/src/assets/images/travel_images/IMG_6462.JPG": __vite_glob_0_26, "/src/assets/images/travel_images/IMG_6464.JPG": __vite_glob_0_27, "/src/assets/images/travel_images/IMG_6470.JPG": __vite_glob_0_28, "/src/assets/images/travel_images/IMG_6487.JPG": __vite_glob_0_29, "/src/assets/images/travel_images/IMG_6499.JPG": __vite_glob_0_30, "/src/assets/images/travel_images/IMG_6503.JPG": __vite_glob_0_31, "/src/assets/images/travel_images/IMG_6511.JPG": __vite_glob_0_32, "/src/assets/images/travel_images/IMG_6512.JPG": __vite_glob_0_33, "/src/assets/images/travel_images/IMG_6515.JPG": __vite_glob_0_34, "/src/assets/images/travel_images/IMG_6524.JPG": __vite_glob_0_35, "/src/assets/images/travel_images/IMG_6528.JPG": __vite_glob_0_36, "/src/assets/images/travel_images/IMG_6533.JPG": __vite_glob_0_37, "/src/assets/images/travel_images/IMG_6541.JPG": __vite_glob_0_38, "/src/assets/images/travel_images/IMG_6552.JPG": __vite_glob_0_39, "/src/assets/images/travel_images/IMG_6553.JPG": __vite_glob_0_40, "/src/assets/images/travel_images/IMG_6577.JPG": __vite_glob_0_41, "/src/assets/images/travel_images/IMG_6584.JPG": __vite_glob_0_42, "/src/assets/images/travel_images/IMG_6585.JPG": __vite_glob_0_43, "/src/assets/images/travel_images/IMG_6588.JPG": __vite_glob_0_44, "/src/assets/images/travel_images/IMG_6593.JPG": __vite_glob_0_45, "/src/assets/images/travel_images/IMG_7411.jpg": __vite_glob_0_46, "/src/assets/images/travel_images/IMG_7430.jpg": __vite_glob_0_47, "/src/assets/images/travel_images/IMG_7446.jpg": __vite_glob_0_48 });
function useTravelImages() {
  const getImageUrl = (path) => {
    if (!path) return "";
    if (travelImages[path]) {
      return travelImages[path].default;
    }
    const filename = path.split("/").pop();
    if (!filename) return "";
    const matchingKey = Object.keys(travelImages).find((key) => key.endsWith(filename));
    if (matchingKey) {
      return travelImages[matchingKey].default;
    }
    console.warn(`Image not found for path: ${path} (Filename: ${filename})`);
    return "";
  };
  return {
    getImageUrl
  };
}
const _sfc_main$2 = {
  __name: "TravelView",
  __ssrInlineRender: true,
  setup(__props) {
    const { getImageUrl } = useTravelImages();
    const stateData = computed(() => {
      return Object.entries(travelPhotos).filter(([state]) => state !== "Unknown").map(([state, photos]) => {
        const photo = photos.find((p) => p.hasGPS) || photos[0];
        return {
          name: state,
          count: photos.length,
          // Use resolved image URL
          thumbnail: photo ? getImageUrl(photo.path) : "",
          slug: state.toLowerCase().replace(/\s+/g, "-")
        };
      }).sort((a, b) => b.count - a.count);
    });
    const totalPhotos = computed(() => {
      return Object.values(travelPhotos).filter((photos, index) => Object.keys(travelPhotos)[index] !== "Unknown").reduce((sum, photos) => sum + photos.length, 0);
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<main${ssrRenderAttrs(mergeProps({ class: "travel-container" }, _attrs))} data-v-484d0938><div class="hero-section" data-v-484d0938><h1 class="page-title" data-v-484d0938>Travel Gallery</h1><p class="page-subtitle" data-v-484d0938> Exploring life through ${ssrInterpolate(totalPhotos.value)} photos across ${ssrInterpolate(stateData.value.length)} ${ssrInterpolate(stateData.value.length === 1 ? "state" : "states")}</p></div><div class="states-grid" data-v-484d0938><!--[-->`);
      ssrRenderList(stateData.value, (state) => {
        _push(ssrRenderComponent(unref(RouterLink), {
          key: state.name,
          to: `/travel/${state.slug}`,
          class: "state-card glass-panel"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<div class="state-card-image" data-v-484d0938${_scopeId}><img${ssrRenderAttr("src", state.thumbnail)}${ssrRenderAttr("alt", `${state.name} travel photos`)} loading="lazy" data-v-484d0938${_scopeId}><div class="state-overlay" data-v-484d0938${_scopeId}></div></div><div class="state-info" data-v-484d0938${_scopeId}><h2 class="state-name" data-v-484d0938${_scopeId}>${ssrInterpolate(state.name)}</h2><p class="photo-count" data-v-484d0938${_scopeId}>${ssrInterpolate(state.count)} ${ssrInterpolate(state.count === 1 ? "photo" : "photos")}</p></div>`);
            } else {
              return [
                createVNode("div", { class: "state-card-image" }, [
                  createVNode("img", {
                    src: state.thumbnail,
                    alt: `${state.name} travel photos`,
                    loading: "lazy"
                  }, null, 8, ["src", "alt"]),
                  createVNode("div", { class: "state-overlay" })
                ]),
                createVNode("div", { class: "state-info" }, [
                  createVNode("h2", { class: "state-name" }, toDisplayString(state.name), 1),
                  createVNode("p", { class: "photo-count" }, toDisplayString(state.count) + " " + toDisplayString(state.count === 1 ? "photo" : "photos"), 1)
                ])
              ];
            }
          }),
          _: 2
        }, _parent));
      });
      _push(`<!--]--></div></main>`);
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/views/TravelView.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const Travel = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-484d0938"]]);
const _sfc_main$1 = {
  __name: "PhotoLightbox",
  __ssrInlineRender: true,
  props: {
    photo: {
      type: Object,
      required: true
    }
  },
  emits: ["close", "next", "prev"],
  setup(__props, { emit: __emit }) {
    const { getImageUrl } = useTravelImages();
    const emit = __emit;
    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        emit("close");
      } else if (e.key === "ArrowRight") {
        emit("next");
      } else if (e.key === "ArrowLeft") {
        emit("prev");
      }
    };
    onMounted(() => {
      document.addEventListener("keydown", handleKeydown);
      document.body.style.overflow = "hidden";
    });
    onBeforeUnmount(() => {
      document.removeEventListener("keydown", handleKeydown);
      document.body.style.overflow = "";
    });
    function formatDate(dateString) {
      if (!dateString) return null;
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "lightbox-overlay" }, _attrs))} data-v-df307dd4><div class="lightbox-container glass-panel" data-v-df307dd4><button class="close-button" aria-label="Close" data-v-df307dd4> ✕ </button><button class="nav-button nav-prev" aria-label="Previous photo" data-v-df307dd4> ‹ </button><button class="nav-button nav-next" aria-label="Next photo" data-v-df307dd4> › </button><div class="image-container" data-v-df307dd4><img${ssrRenderAttr("src", unref(getImageUrl)(__props.photo.path))}${ssrRenderAttr("alt", __props.photo.filename)} data-v-df307dd4></div><div class="photo-metadata" data-v-df307dd4>`);
      if (__props.photo.city && __props.photo.city !== "Unknown") {
        _push(`<div class="metadata-row" data-v-df307dd4><span class="metadata-icon" data-v-df307dd4>📍</span><span data-v-df307dd4>${ssrInterpolate(__props.photo.city)}, ${ssrInterpolate(__props.photo.state)}</span></div>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.photo.date) {
        _push(`<div class="metadata-row" data-v-df307dd4><span class="metadata-icon" data-v-df307dd4>📅</span><span data-v-df307dd4>${ssrInterpolate(formatDate(__props.photo.date))}</span></div>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.photo.camera) {
        _push(`<div class="metadata-row" data-v-df307dd4><span class="metadata-icon" data-v-df307dd4>📷</span><span data-v-df307dd4>${ssrInterpolate(__props.photo.camera)}</span></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/PhotoLightbox.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const PhotoLightbox = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-df307dd4"]]);
const _sfc_main = {
  __name: "TravelStateView",
  __ssrInlineRender: true,
  setup(__props) {
    const { getImageUrl } = useTravelImages();
    const route = useRoute();
    const mapContainer = ref(null);
    const map = ref(null);
    const selectedPhoto = ref(null);
    const lightboxOpen = ref(false);
    const stateName = computed(() => {
      const slug = route.params.state;
      return Object.keys(travelPhotos).find(
        (state) => state.toLowerCase().replace(/\s+/g, "-") === slug
      ) || slug;
    });
    const statePhotos = computed(() => {
      return stateName.value ? travelPhotos[stateName.value] || [] : [];
    });
    const photosWithGPS = computed(() => {
      return statePhotos.value.filter((p) => p.hasGPS && p.lat && p.lng);
    });
    useHead({
      title: computed(() => `${stateName.value} Travel Gallery - Sam Townsend`),
      meta: [
        {
          name: "description",
          content: computed(() => `Explore ${statePhotos.value.length} travel photos from ${stateName.value} by Sam Townsend.`)
        },
        {
          property: "og:title",
          content: computed(() => `${stateName.value} Travel Gallery`)
        },
        {
          property: "og:description",
          content: computed(() => `View ${statePhotos.value.length} photos and locations from my trip to ${stateName.value}.`)
        },
        {
          property: "og:image",
          content: computed(() => {
            if (statePhotos.value.length > 0) {
              const firstPhoto = statePhotos.value[0];
              const imgPath = getImageUrl(firstPhoto.path);
              if (imgPath.startsWith("http")) return imgPath;
              return `https://sft3hy.github.io${imgPath}`;
            }
            return "https://sft3hy.github.io/sam-townsend/assets/surfingOBX.jpeg";
          })
        },
        {
          property: "og:url",
          content: computed(() => `https://sft3hy.github.io/sam-townsend/travel/${route.params.state}`)
        }
      ]
    });
    onMounted(() => {
      if (photosWithGPS.value.length > 0 && mapContainer.value) {
        map.value = L.map(mapContainer.value).setView(
          [photosWithGPS.value[0].lat, photosWithGPS.value[0].lng],
          8
        );
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19
        }).addTo(map.value);
        const photoIcon = L.divIcon({
          className: "custom-photo-marker",
          html: '<div class="marker-dot"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        const markers = [];
        photosWithGPS.value.forEach((photo) => {
          const marker = L.marker([photo.lat, photo.lng], { icon: photoIcon }).addTo(map.value);
          marker.on("click", () => {
            openLightbox(photo);
          });
          markers.push(marker);
        });
        if (markers.length > 0) {
          const group = L.featureGroup(markers);
          map.value.fitBounds(group.getBounds().pad(0.1));
        }
      }
    });
    onBeforeUnmount(() => {
      if (map.value) {
        map.value.remove();
      }
    });
    function openLightbox(photo) {
      selectedPhoto.value = photo;
      lightboxOpen.value = true;
    }
    function closeLightbox() {
      lightboxOpen.value = false;
      selectedPhoto.value = null;
    }
    function nextPhoto() {
      const currentIndex = statePhotos.value.findIndex((p) => p.filename === selectedPhoto.value.filename);
      const nextIndex = (currentIndex + 1) % statePhotos.value.length;
      selectedPhoto.value = statePhotos.value[nextIndex];
    }
    function prevPhoto() {
      const currentIndex = statePhotos.value.findIndex((p) => p.filename === selectedPhoto.value.filename);
      const prevIndex = (currentIndex - 1 + statePhotos.value.length) % statePhotos.value.length;
      selectedPhoto.value = statePhotos.value[prevIndex];
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<main${ssrRenderAttrs(mergeProps({ class: "state-view-container" }, _attrs))} data-v-22cd77b5><div class="header-section" data-v-22cd77b5>`);
      _push(ssrRenderComponent(unref(RouterLink), {
        to: "/travel",
        class: "back-button"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` ← Back to Travel `);
          } else {
            return [
              createTextVNode(" ← Back to Travel ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<h1 class="state-title" data-v-22cd77b5>${ssrInterpolate(stateName.value)}</h1><p class="state-subtitle" data-v-22cd77b5>${ssrInterpolate(statePhotos.value.length)} ${ssrInterpolate(statePhotos.value.length === 1 ? "photo" : "photos")}</p></div>`);
      if (photosWithGPS.value.length > 0) {
        _push(`<div class="map-section glass-panel" data-v-22cd77b5><div class="map-container" data-v-22cd77b5></div></div>`);
      } else {
        _push(`<div class="no-map-notice" data-v-22cd77b5><p data-v-22cd77b5>No location data available for these photos</p></div>`);
      }
      _push(`<div class="photos-grid" data-v-22cd77b5><!--[-->`);
      ssrRenderList(statePhotos.value, (photo) => {
        _push(`<div class="photo-card" data-v-22cd77b5><img${ssrRenderAttr("src", unref(getImageUrl)(photo.path))}${ssrRenderAttr("alt", photo.filename)} loading="lazy" data-v-22cd77b5><div class="photo-overlay" data-v-22cd77b5>`);
        if (photo.city && photo.city !== "Unknown") {
          _push(`<p class="photo-location" data-v-22cd77b5> 📍 ${ssrInterpolate(photo.city)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      });
      _push(`<!--]--></div>`);
      if (lightboxOpen.value && selectedPhoto.value) {
        _push(ssrRenderComponent(PhotoLightbox, {
          photo: selectedPhoto.value,
          onClose: closeLightbox,
          onNext: nextPhoto,
          onPrev: prevPhoto
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</main>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/views/TravelStateView.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const TravelState = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-22cd77b5"]]);
const metaOgTitleHome = "Sam Townsend - Software Engineer & Data Scientist";
const metaDescriptionHome = "Sam Townsend is a Software Engineer and Data Science Master's student at UC Irvine. Expert in full-stack development, Python, and cloud technologies. View his portfolio and projects.";
const metaOgTitleAbout = "About Sam Townsend - Software Engineer";
const metaDescriptionAbout = "Learn about Sam Townsend, a software engineer with a passion for surfing, climbing, and technology. Discover his background, education, and interests.";
const metaOgDescriptionAbout = "Biography of Sam Townsend, Software Engineer and Data Science student.";
const metaOgTitleContact = "Contact Sam Townsend";
const metaDescriptionContact = "Connect with Sam Townsend. Reach out via Email, LinkedIn, GitHub, or Instagram for collaboration or inquiries.";
const metaOgDescriptionContact = "Contact information for Sam Townsend.";
const metaOgTitlePortfolio = "Sam Townsend - Portfolio & Projects";
const metaDescriptionPortfolio = "Explore Sam Townsend's software engineering portfolio. Featuring projects in web development, data science, and more.";
const metaOgDescriptionPortfolio = "Sam Townsend's project portfolio.";
const metaOgTitleTravel = "Travel Gallery - Sam Townsend";
const metaDescriptionTravel = "Browse Sam Townsend's travel photography from adventures across different states. View photos on interactive maps.";
const metaOgDescriptionTravel = "Sam Townsend's travel photo gallery.";
const ogUrlHome = "https://sft3hy.github.io/sam-townsend/";
const ogUrlAbout = "https://sft3hy.github.io/sam-townsend/about/";
const ogUrlContact = "https://sft3hy.github.io/sam-townsend/contact/";
const ogUrlPortfolio = "https://sft3hy.github.io/sam-townsend/portfolio/";
const ogUrlTravel = "https://sft3hy.github.io/sam-townsend/travel/";
const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
    meta: {
      title: metaOgTitleHome,
      description: metaDescriptionHome,
      ogDescription: metaDescriptionHome,
      ogUrl: ogUrlHome,
      canonical: ogUrlHome,
      ogImage: homeImg
    }
  },
  {
    path: "/about/",
    name: "About",
    component: About,
    meta: {
      title: metaOgTitleAbout,
      description: metaDescriptionAbout,
      ogDescription: metaOgDescriptionAbout,
      ogUrl: ogUrlAbout,
      canonical: ogUrlAbout,
      ogImage: aboutImg
    }
  },
  {
    path: "/contact/",
    name: "Contact",
    component: Contact,
    meta: {
      title: metaOgTitleContact,
      description: metaDescriptionContact,
      ogDescription: metaOgDescriptionContact,
      ogUrl: ogUrlContact,
      canonical: ogUrlContact,
      ogImage: contactImg
    }
  },
  {
    path: "/portfolio/",
    name: "Portfolio",
    component: Portfolio,
    meta: {
      title: metaOgTitlePortfolio,
      description: metaDescriptionPortfolio,
      ogDescription: metaOgDescriptionPortfolio,
      ogUrl: ogUrlPortfolio,
      canonical: ogUrlPortfolio,
      ogImage: portfolioImg
    }
  },
  {
    path: "/travel/",
    name: "Travel",
    component: Travel,
    meta: {
      title: metaOgTitleTravel,
      description: metaDescriptionTravel,
      ogDescription: metaOgDescriptionTravel,
      ogUrl: ogUrlTravel,
      canonical: ogUrlTravel,
      ogImage: travelImg
    }
  },
  {
    path: "/travel/:state",
    name: "TravelState",
    component: TravelState,
    meta: {
      title: metaOgTitleTravel,
      description: metaDescriptionTravel,
      ogDescription: metaOgDescriptionTravel,
      ogUrl: ogUrlTravel,
      canonical: ogUrlTravel,
      ogImage: travelImg
      // Fallback, will be overridden by component
    }
  }
];
const createApp = ViteSSG(
  App,
  { routes, base: "/sam-townsend/" },
  ({ app, router, routes: routes2, isClient, initialState }) => {
    if (isClient) {
      router.beforeEach((to, from, next) => {
        removeTags();
        const ogTitle = to.meta.title || "Default Description";
        createTag("meta", "property", "og:title", ogTitle);
        const ogDescription = to.meta.ogDescription || "Default Description";
        createTag("meta", "property", "og:description", ogDescription);
        const siteName = to.meta.title || "Default Title";
        createTag("meta", "property", "og:site_name", siteName);
        const ogUrl = to.meta.ogUrl || "Default Title";
        createTag("meta", "property", "og:url", ogUrl);
        const description = to.meta.description || "Default Description";
        createTag("meta", "name", "description", description);
        document.title = to.meta.title || "Default Title";
        const canon = document.createElement("link");
        canon.setAttribute("rel", "canonical");
        canon.setAttribute("href", to.meta.canonical);
        document.head.insertBefore(canon, document.head.firstChild);
        next();
      });
    }
  }
);
export {
  createApp
};
