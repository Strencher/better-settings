"use strict";
// #region manifest.json
const manifest = Object.freeze({
  "name": "Better Settings",
  "id": "better-settings",
  "description": "Enhances discord's settings ui by adding a search feature & more. Originally made by mr_miner.",
  "author": "Strencher",
  "version": "1.0.0"
});
// #endregion manifest.json

// #region @settings
const Settings = unbound.apis.settings.makeStore(manifest.id);
const changeCallbacks = /* @__PURE__ */ new Set();
function emitChange(id) {
  changeCallbacks.forEach((fn) => fn(id));
}
function onChange(callback, options = { once: false }) {
  if (options.once) {
    const originalCallback = callback;
    callback = function() {
      changeCallbacks.delete(callback);
      originalCallback.apply(this, arguments);
    };
  }
  changeCallbacks.add(callback);
  return () => void changeCallbacks.delete(callback);
}
function getSetting(id, defaultValue) {
  if (!id.includes("."))
    return Settings.get(id, defaultValue);
  const items = id.split(".");
  const first = items.shift();
  return items.reduce((curr, key) => curr?.[key], Settings.get(first)) ?? defaultValue;
}
function setSetting(id, newValue) {
  if (!id.includes("."))
    return Settings.set(id, newValue), emitChange(id);
  const items = id.split(".");
  const first = items.shift();
  const value = Settings.get(first, {});
  const last = items.pop();
  let curr = value;
  for (const key of items) {
    if (!curr[key])
      curr[key] = {};
    curr = curr[key];
  }
  curr[last] = newValue;
  Settings.set(first, value);
  emitChange(id);
}

// #endregion @settings

// #region @webpack
const { findByProps, findByDisplayName, getModule } = unbound.webpack;
function find(filter) {
  return getModule(filter);
}
function getByProps(...props) {
  return findByProps(...props);
}
function getByDisplayName(displayName, options = { default: true }) {
  return findByDisplayName(displayName, options);
}

// #endregion @webpack

// #region react
var React = unbound.webpack.React;
// #endregion react

// #region util.tsx
const i18n = find((m) => m?.Messages?.CLOSE);
const { GuildSettingsSections: GuildSettingsSections$1 } = getByProps("UserSettingsSections");
function filterSections(section, query, index) {
  if (!section)
    return false;
  if (section.__search)
    return true;
  if (section.section === "HEADER")
    return false;
  if (typeof section.label === "string") {
    const settings = getSetting(["customItems", section.section].join("."), { name: section.label });
    if (!fuzzyMatch(settings.name, query))
      return false;
    section.__index = index;
    return true;
  }
  return false;
}
function getSectionIndex(sections, index) {
  for (let i = index; i > 0; i--) {
    if (sections[i]?.section === "DIVIDER")
      break;
    if (sections[i]?.section === "HEADER")
      return i;
  }
  return -1;
}
function fuzzyMatch(input, query) {
  let index = 0;
  input = input.toLowerCase();
  return query.toLowerCase().split("").every((c) => (index = input.indexOf(c, index)) > -1);
}
function highlightQuery(input, query) {
  const chars = new Set(query.toLowerCase());
  const items = [];
  for (let i = 0; i < input.length; i++) {
    items.push(/* @__PURE__ */ React.createElement("span", {
      key: input[i],
      className: chars.has(input[i].toLowerCase()) && "highlight"
    }, input[i]));
  }
  return /* @__PURE__ */ React.createElement("div", {
    className: "bs-search-highlight"
  }, items);
}
function hexToRGBA(hex, A = "1") {
  const rgb = [];
  for (let i = 1; i < hex.length; i += 2) {
    rgb.push(parseInt(hex[i] + hex[i + 1], 16));
  }
  rgb.push(A);
  return `rgba(${rgb})`;
}
function fixStupidity(section) {
  if (typeof section.label === "string")
    return section.label;
  if (section.section === GuildSettingsSections$1.GUILD_AUTOMOD)
    return section?.label?.props?.children?.[0];
  if (section.section === GuildSettingsSections$1.GUILD_TEMPLATES)
    return i18n.Messages[section.section];
  return section;
}
let idCache = {};
function getLabelId(label) {
  if (idCache[label])
    return idCache[label];
  const id = Object.entries(i18n.Messages).find(([, v]) => v === label)?.[0];
  idCache[label] = id;
  return id;
}
function getSectionId(item) {
  if (item.section === "DELETE") {
    return getLabelId(item.label) || item.section;
  }
  return item.section;
}

// #endregion util.tsx

// #region @patcher
const patcher = unbound.patcher.create(manifest.name);
function after(module, method, callback) {
  return patcher.after(module, method, callback);
}
function unpatchAll() {
  patcher.unpatchAll();
}

// #endregion @patcher

// #region store.ts
const Flux = getByProps("Store", "connectStores");
const FluxDispatcher = getByProps("dispatch", "isDispatching");
let query = "";
let collapsedStates = getSetting("collapsedStates", {});
class SearchStore extends Flux.Store {
  getQuery() {
    return query;
  }
  setQuery(newQuery) {
    query = newQuery;
    this.emitChange();
  }
  clearQuery() {
    query = "";
    this.emitChange();
  }
  isCollapsed(name) {
    return Boolean(collapsedStates[name]);
  }
  toggleCollapsed(name) {
    if (this.isCollapsed(name)) {
      delete collapsedStates[name];
    } else {
      collapsedStates[name] = true;
    }
    setSetting("collapsedStates", collapsedStates);
    this.emitChange();
  }
  getState() {
    return collapsedStates;
  }
  destroy() {
    const actions = FluxDispatcher._actionHandlers;
    actions?._dependencyGraph.removeNode(this._dispatchToken);
    actions?._actionHandlers._invalidateCaches();
  }
}
const SettingsSearchStore = new SearchStore(FluxDispatcher, {});

// #endregion store.ts

// #region colorpicker.tsx
const Tooltip = getByDisplayName("Tooltip");
const Flex = getByDisplayName("Flex");
const ColorConverter = getByProps("hex2int", "int2hex");
const Checkmark = React.memo((props) => /* @__PURE__ */ React.createElement("svg", {
  width: "16",
  height: "16",
  viewBox: "0 0 24 24",
  ...props
}, /* @__PURE__ */ React.createElement("path", {
  fillRule: "evenodd",
  clipRule: "evenodd",
  fill: props.color ?? "#ddd",
  d: "M8.99991 16.17L4.82991 12L3.40991 13.41L8.99991 19L20.9999 7.00003L19.5899 5.59003L8.99991 16.17Z"
})));
const Dropper = React.memo((props) => /* @__PURE__ */ React.createElement("svg", {
  width: "14",
  height: "14",
  viewBox: "0 0 16 16",
  ...props
}, /* @__PURE__ */ React.createElement("g", {
  fill: "none"
}, /* @__PURE__ */ React.createElement("path", {
  d: "M-4-4h24v24H-4z"
}), /* @__PURE__ */ React.createElement("path", {
  fill: props.color ?? "#ddd",
  d: "M14.994 1.006C13.858-.257 11.904-.3 10.72.89L8.637 2.975l-.696-.697-1.387 1.388 5.557 5.557 1.387-1.388-.697-.697 1.964-1.964c1.13-1.13 1.3-2.985.23-4.168zm-13.25 10.25c-.225.224-.408.48-.55.764L.02 14.37l1.39 1.39 2.35-1.174c.283-.14.54-.33.765-.55l4.808-4.808-2.776-2.776-4.813 4.803z"
}))));
const defaultColors = [1752220, 3066993, 3447003, 10181046, 15277667, 15844367, 15105570, 15158332, 9807270, 6323595, 1146986, 2067276, 2123412, 7419530, 11342935, 12745742, 11027200, 10038562, 9936031, 5533306];
const resolveColor = (color, hex = true) => {
  switch (typeof color) {
    case (hex && "number"):
      return ColorConverter.int2hex(color);
    case (!hex && "string"):
      return ColorConverter.hex2int(color);
    case (!hex && "number"):
      return color;
    case (hex && "string"):
      return color;
    default:
      return color;
  }
};
const ColorPicker = ({ value, defaultValue, onChange, colors = defaultColors, isDefault }) => {
  const [color, setColor] = React.useState(resolveColor(value));
  const intValue = React.useMemo(() => resolveColor(color, false), [color]);
  const handleChange = React.useCallback(({ target: { value: value2 } }) => {
    setColor(value2);
    onChange(resolveColor(value2));
  }, []);
  return /* @__PURE__ */ React.createElement(Flex, {
    direction: Flex.Direction.HORIZONTAL
  }, /* @__PURE__ */ React.createElement("div", {
    className: "bsc-controls"
  }, /* @__PURE__ */ React.createElement(Tooltip, {
    text: "Default",
    position: "bottom"
  }, (props) => /* @__PURE__ */ React.createElement("div", {
    ...props,
    className: "bsc-defaultColor",
    style: { backgroundColor: defaultValue ? resolveColor(defaultValue) : "transparent" },
    onClick: () => handleChange({ target: { value: null } })
  }, isDefault ? /* @__PURE__ */ React.createElement(Checkmark, {
    width: "25",
    height: "25"
  }) : null)), /* @__PURE__ */ React.createElement(Tooltip, {
    text: "Custom Color",
    position: "bottom"
  }, (props) => /* @__PURE__ */ React.createElement("div", {
    ...props,
    className: "bsc-inputContainer",
    onClick: (e) => {
      (e.currentTarget?.children[1]).click();
    }
  }, /* @__PURE__ */ React.createElement(Dropper, null), /* @__PURE__ */ React.createElement("input", {
    style: { backgroundColor: resolveColor(color), visibility: isDefault ? "hidden" : void 0 },
    type: "color",
    className: "bsc-colorInput",
    value: resolveColor(color),
    onChange: handleChange
  })))), /* @__PURE__ */ React.createElement(Flex, {
    wrap: Flex.Wrap.WRAP,
    className: "bsc-colorSwatches"
  }, colors.map((int, index) => /* @__PURE__ */ React.createElement("div", {
    key: index,
    className: "bsc-colorSwatch",
    style: { backgroundColor: resolveColor(int) },
    onClick: () => handleChange({ target: { value: int } })
  }, intValue === int ? /* @__PURE__ */ React.createElement(Checkmark, null) : null))));
};

// #endregion colorpicker.tsx

// #region modal.tsx
const { Heading } = getByProps("Heading");
const { Item } = getByProps("Item", "Separator", "Header");
const { ModalRoot, ModalHeader, ModalFooter, ModalContent, ModalCloseButton } = getByProps("ModalRoot");
const Button = getByProps("BorderColors", "Colors");
const { FormItem } = getByProps("FormItem");
const classes = Object.assign({}, getByProps("item", "topPill"), getByProps("tabBarItemContainer"));
const TextInput = getByDisplayName("TextInput");
class SettingsConfigurationModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = props.settings;
  }
  handleSave = () => {
    setSetting(["customItems", getSectionId(this.props.item)].join("."), this.state);
    this.props.modalProps.onClose();
    this.props.updateTarget();
  };
  handleReset = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({
      name: fixStupidity(this.props.item),
      color: {
        bg: null,
        fg: null
      }
    });
  };
  renderPreview() {
    const { item } = this.props;
    let children;
    {
      if (React.isValidElement(item.icon)) {
        children = /* @__PURE__ */ React.createElement("div", {
          className: classes.tabBarItemContainer
        }, item.label, item.icon);
      } else {
        children = item.label;
      }
    }
    return /* @__PURE__ */ React.createElement("div", {
      className: `bs-modal-preview ${classes.side}`
    }, /* @__PURE__ */ React.createElement("span", {
      className: "bs-modal-blankslate first"
    }), /* @__PURE__ */ React.createElement(Item, {
      __preview: true,
      __settings: this.state,
      item,
      onItemSelect: () => {
      },
      itemType: classes.side,
      selectedItem: getSectionId(item),
      className: "bs-sidebar-item",
      id: getSectionId(item),
      look: 0
    }, children), /* @__PURE__ */ React.createElement("span", {
      className: "bs-modal-blankslate last"
    }));
  }
  render() {
    const { item, modalProps } = this.props;
    return /* @__PURE__ */ React.createElement(ModalRoot, {
      ...modalProps
    }, /* @__PURE__ */ React.createElement(ModalHeader, {
      separator: false
    }, /* @__PURE__ */ React.createElement(Heading, {
      level: "20",
      variant: "heading-lg/medium"
    }, 'Configure "', fixStupidity(item), '"'), /* @__PURE__ */ React.createElement(ModalCloseButton, {
      onClick: modalProps.onClose,
      className: "bs-modal-close"
    })), /* @__PURE__ */ React.createElement(ModalContent, {
      className: "bs-modal-content"
    }, /* @__PURE__ */ React.createElement(FormItem, {
      title: "preview",
      className: "bs-form-item"
    }, this.renderPreview()), /* @__PURE__ */ React.createElement(FormItem, {
      title: "name",
      className: "bs-form-item"
    }, /* @__PURE__ */ React.createElement(TextInput, {
      defaultValue: this.state.name || item.label,
      placeholder: "Custom name",
      onChange: (value) => {
        this.setState({ name: value });
      }
    })), /* @__PURE__ */ React.createElement(FormItem, {
      title: "foreground color",
      className: "bs-form-item"
    }, /* @__PURE__ */ React.createElement(ColorPicker, {
      isDefault: this.state.color.fg === null,
      defaultValue: 0,
      onChange: (val) => {
        this.setState((prev) => ({
          color: {
            ...prev.color,
            fg: val
          }
        }));
      },
      value: "#ed4245"
    })), /* @__PURE__ */ React.createElement(FormItem, {
      title: "background color",
      className: "bs-form-item"
    }, /* @__PURE__ */ React.createElement(ColorPicker, {
      isDefault: this.state.color.bg === null,
      defaultValue: 0,
      onChange: (val) => {
        this.setState((prev) => ({
          color: {
            ...prev.color,
            bg: val
          }
        }));
      },
      value: "#ffffff"
    })), /* @__PURE__ */ React.createElement("span", {
      className: "bsm-reset-text"
    }, "Don't like your changes? Just ", /* @__PURE__ */ React.createElement("a", {
      onClick: this.handleReset
    }, "Reset"), " them!")), /* @__PURE__ */ React.createElement(ModalFooter, null, /* @__PURE__ */ React.createElement(Button, {
      onClick: this.handleSave
    }, "Save"), /* @__PURE__ */ React.createElement(Button, {
      look: Button.Looks.LINK,
      onClick: modalProps.onClose,
      color: Button.Colors.WHITE
    }, "Cancel")));
  }
}
const WrappedModal = (props) => {
  const forceUpdate = React.useReducer((n) => !n, false)[1];
  React.useEffect(() => onChange(() => forceUpdate()));
  return /* @__PURE__ */ React.createElement(SettingsConfigurationModal, {
    ...props,
    settings: getSetting(["customItems", getSectionId(props.item)].join("."), {
      name: fixStupidity(props.item),
      color: {
        bg: null,
        fg: null
      }
    })
  });
};

// #endregion modal.tsx

// #region items.tsx
const FluxUtils = getByProps("useStateFromStores");
const SearchBar = getByDisplayName("SearchBar");
const SearchItems = [
  { section: "HEADER", label: "SEARCH" },
  {
    section: "CUSTOM",
    element() {
      const query = FluxUtils.useStateFromStores([SettingsSearchStore], () => SettingsSearchStore.getQuery());
      return /* @__PURE__ */ React.createElement(SearchBar, {
        size: SearchBar.Sizes.SMALL,
        className: "bs-search",
        query,
        placeholder: "Search Settings...",
        onClear: () => SettingsSearchStore.clearQuery(),
        onQueryChange: (q) => SettingsSearchStore.setQuery(q)
      });
    }
  },
  { section: "DIVIDER" }
];
for (const item of SearchItems) {
  Object.assign(item, { __search: true, __hideCaret: true });
}

// #endregion items.tsx

// #region @structs
const UPlugin = require("@entities/plugin");
class Plugin extends UPlugin {
  _settings = null;
  onStart() {
  }
  onStop() {
  }
  start() {
    if (typeof this.onStart === "function") {
      this.onStart();
    }
  }
  stop() {
    if (typeof this.onStop === "function") {
      this.onStop();
    }
  }
  registerSettings(settings) {
    this._settings = settings;
  }
  get getSettingsPanel() {
    if (!this._settings)
      return void 0;
    return () => this._settings;
  }
}

// #endregion @structs

// #region styles
var Style = {
    sheets: [],
    _element: null,
    load() {
        if (this._element) return;

        this._element = Object.assign(document.createElement("style"), {
            textContent: this.sheets.join("\n"),
            id: manifest.id
        });

        document.head.appendChild(this._element);
    },
    unload() {
        this._element?.remove();
        this._element = null;
    }
};
// #endregion styles

// #region style.scss

Style.sheets.push("/* style.scss */", 
`.bs-search {
  margin-left: 10px;
}

.bs-header-wrapper {
  display: flex;
}

.bs-header-caret {
  margin-left: auto;
}`);

// #endregion style.scss

// #region colorpicker.scss

Style.sheets.push("/* colorpicker.scss */", 
`.bsc-inputContainer {
  position: relative;
  border: thin solid hsla(0deg, 0%, 100%, 0.1);
  display: inline-table;
  cursor: pointer;
  border-radius: 4px;
}
.bsc-inputContainer svg {
  position: absolute;
  top: 5px;
  right: 5px;
}

.bsc-colorInput {
  outline: none;
  width: calc(var(--control-width) - 1px);
  height: var(--control-height);
  border: none;
  margin-top: 1px;
  border-radius: 4px;
  cursor: pointer;
}
.bsc-colorInput::-webkit-color-swatch {
  border: none;
}

.bsc-controls {
  --control-height: 47px;
  --control-width: 52px;
  padding-left: 1px;
  padding-top: 2px;
  display: flex;
}

.bsc-colorSwatch {
  cursor: pointer;
  border-radius: 4px;
  width: var(--swatch-size);
  height: var(--swatch-size);
  margin: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bsc-colorSwatches {
  --swatch-size: 20px;
  align-content: flex-start;
  margin-left: 5px !important;
  max-width: 340px;
}

.bsc-defaultColor {
  cursor: pointer;
  width: calc(var(--control-width) + 2px);
  height: calc(var(--control-height) + 2px);
  border: thin solid hsla(0deg, 0%, 100%, 0.1);
  border-radius: 4px;
  margin-right: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}`);

// #endregion colorpicker.scss

// #region modal.scss

Style.sheets.push("/* modal.scss */", 
`.bs-modal-close {
  margin-left: auto;
}

.bs-modal-content {
  color: #fff;
}

.bs-form-item, .bsm-reset-text {
  margin-bottom: 20px;
}

.bsm-reset-text {
  display: block;
}
.bsm-reset-text a:hover {
  text-decoration: underline;
}

.bs-modal-preview {
  background: var(--background-secondary-alt);
  padding: 15px 10px;
  border-radius: 4px;
}
.bs-modal-preview .bs-modal-blankslate {
  background: var(--background-accent);
  width: 100px;
  height: 5px;
  border-radius: 8px;
}
.bs-modal-preview .bs-modal-blankslate.first {
  margin-bottom: 10px;
}
.bs-modal-preview .bs-modal-blankslate.last {
  margin-top: 10px;
}
.bs-modal-preview .bs-sidebar-item {
  max-width: 192px;
}`);

// #endregion modal.scss

// #region index.tsx
const ModalActions = getByProps("openModal", "useModalsStore");
const { UserSettingsSections, GuildSettingsSections } = getByProps("UserSettingsSections");
const Caret = getByDisplayName("Caret");
class BetterSettings extends Plugin {
  onStart() {
    Style.load();
    this.patchSettingsView();
    this.patchSettingsItem();
    this.patchGuildTemplateLabel();
  }
  patchSettingsView() {
    const SettingsView = getByDisplayName("SettingsView");
    after(SettingsView.prototype, "componentDidMount", (_this) => {
      _this.flush = /* @__PURE__ */ new Set();
      _this.handleChange = () => {
        _this.setState({
          query: SettingsSearchStore.getQuery(),
          collapsedStates: Object.assign({}, SettingsSearchStore.getState())
        });
      };
      SettingsSearchStore.addChangeListener(_this.handleChange);
      _this.flush.add(() => SettingsSearchStore.removeChangeListener(_this.handleChange));
      _this.flush.add(onChange((id) => {
        switch (id) {
          case "favorites":
            _this.forceUpdate();
        }
      }));
    });
    after(SettingsView.prototype, "componentWillUnmount", (_this) => {
      _this._flush?.forEach((e) => e());
      SettingsSearchStore.clearQuery();
    });
    const ArrayFind = Array.prototype.find;
    after(SettingsView.prototype, "getPredicateSections", (_this, _, res) => {
      const items = [].concat(SearchItems);
      {
        const settings = getSetting("favorites", []).map((id) => res.findIndex((r) => getSectionId(r) === id)).filter((i) => i > -1);
        if (settings.length) {
          items.push({ section: "HEADER", label: "Favorites", __search: true });
          for (const section of settings) {
            items.push(res.splice(section, 1)[0]);
          }
          items.push({ section: "DIVIDER" });
        }
      }
      res.unshift(...items);
      let clone;
      if (_this.state.query) {
        clone = res.filter((e, i) => filterSections(e, _this.state.query, i));
        for (let i = 0, insertDivider = false; i < clone.length; i++) {
          if (clone[i]?.__search)
            continue;
          const index = getSectionIndex(res, clone[i].__index);
          if (index == -1 || clone.indexOf(res[index]) > -1)
            continue;
          const items2 = [res[index]];
          if (insertDivider)
            items2.unshift({ section: "DIVIDER" });
          clone.splice(i++, 0, ...items2);
          insertDivider ||= true;
        }
      } else {
        clone = [...res];
      }
      clone.find = (...args) => {
        return ArrayFind.apply(res, args) ?? ArrayFind.apply(clone, args);
      };
      clone.map = (factory) => {
        return Array.prototype.map.call(clone, (item, index) => {
          if (item.section !== "HEADER") {
            const sectionIndex = getSectionIndex(clone, index);
            const section = clone[sectionIndex];
            if (section && SettingsSearchStore.isCollapsed(section.label))
              return null;
          }
          const res2 = factory(item, index, clone);
          if (!res2 || typeof res2 !== "object")
            return res2;
          try {
            res2.props.item = item;
            if (item.section === "HEADER" && !res2.props.item.__hideCaret) {
              const opened = !SettingsSearchStore.isCollapsed(res2.props.item.label);
              res2.props.onClick = () => {
                SettingsSearchStore.toggleCollapsed(res2.props.item.label);
              };
              res2.props.children = /* @__PURE__ */ React.createElement("div", {
                className: "bs-header-wrapper"
              }, res2.props.children, /* @__PURE__ */ React.createElement(Caret, {
                width: "16",
                height: "16",
                className: "bs-header-caret",
                direction: opened ? Caret.Directions.DOWN : Caret.Directions.LEFT
              }));
            }
          } catch (error) {
            console.error(error);
          }
          return res2;
        });
      };
      return clone;
    });
  }
  patchSettingsItem() {
    const { Item } = getByProps("Item", "Separator", "Header");
    const ContextMenu = getByProps("openContextMenu");
    const { default: Menu, MenuItem } = getByProps("MenuItem", "default");
    function SettingsItemContextMenu({ item, updateTarget }) {
      const current = getSetting("favorites", []);
      const id = getSectionId(item);
      const favoritesIndex = current.indexOf(id);
      const isFavorite = favoritesIndex > -1;
      return /* @__PURE__ */ React.createElement(Menu, {
        navId: "settings-item-contextmenu",
        onClose: ContextMenu.closeContextMenu
      }, /* @__PURE__ */ React.createElement(MenuItem, {
        label: "Configure",
        action: () => {
          ModalActions.openModal((props) => /* @__PURE__ */ React.createElement(WrappedModal, {
            item,
            modalProps: props,
            updateTarget
          }));
        },
        id: "configure"
      }), /* @__PURE__ */ React.createElement(MenuItem, {
        label: isFavorite ? "Unfavorite" : "Favorite",
        color: isFavorite ? "colorDanger" : void 0,
        id: "favorite",
        action: () => {
          if (isFavorite) {
            setSetting("favorites", current.slice(0, favoritesIndex).concat(current.slice(favoritesIndex + 1)));
          } else {
            current.push(id);
            setSetting("favorites", [...current]);
          }
        }
      }));
    }
    after(Item.prototype, "render", (_this, _, res) => {
      const section = _this.props.item;
      if (!section)
        return;
      const showBackground = _this.props.selectedItem === getSectionId(section) || _this.state.hovered;
      const settings = _this.props.__settings || getSetting(["customItems", getSectionId(section)].join("."), { color: { fg: null, bg: null }, name: fixStupidity(_this.props.item) });
      if (section?.label) {
        try {
          const isGuildTemplates = getSectionId(section) === GuildSettingsSections.GUILD_TEMPLATES;
          const isNitro = getSectionId(section) === UserSettingsSections.PREMIUM;
          const tree = typeof res.props.children === "string" ? res.props : isNitro || isGuildTemplates ? res.props.children.props : res.props.children.props.children;
          const label = SettingsSearchStore.getQuery() ? highlightQuery(settings.name, SettingsSearchStore.getQuery()) : settings.name;
          if (Array.isArray(tree)) {
            tree[0] = label;
          } else if (isNitro) {
            tree.label = label;
            if (settings.color.bg && tree.isSelected) {
              tree.isSelected = false;
            }
          } else if (tree) {
            tree.children = label;
          }
        } catch (error) {
          console.error(error);
        }
      }
      res.props.onContextMenu = (e) => {
        if (_this.props.__preview)
          return;
        ContextMenu.openContextMenu(e, () => /* @__PURE__ */ React.createElement(SettingsItemContextMenu, {
          item: _this.props.item,
          updateTarget: () => _this.forceUpdate()
        }));
      };
      res.props.style = Object.assign({}, res.props.style, {
        backgroundColor: (showBackground ? true : null) && settings.color.bg && hexToRGBA(settings.color.bg, "0.4"),
        color: settings.color.fg
      });
      return res;
    });
  }
  patchGuildTemplateLabel() {
    const GuildSettingsTemplateLabel = getByDisplayName("GuildSettingsTemplateLabel", { default: false });
    after(GuildSettingsTemplateLabel, "default", (_, [{ children }], res) => {
      if (Array.isArray(res?.props?.children)) {
        res.props.children[0] = children;
      } else if (res?.props) {
        res.props.children = children;
      }
    });
  }
  onStop() {
    unpatchAll();
    Style.unload();
    SettingsSearchStore.destroy();
  }
}

// #endregion index.tsx

module.exports = BetterSettings;
