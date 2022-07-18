/// <reference path="../../Builder/types.d.ts" />

import React, {Component} from "react";
import {Plugin} from "@structs";
import {after, unpatchAll} from "@patcher";
import {getByDisplayName, getByProps} from "@webpack";
import SettingsSearchStore from "./store";
import {filterSections, getSectionIndex, hexToRGBA, highlightQuery} from "./util";
import SearchItems from "./items";
import Style from "./style.scss";
import ModalStyle from "./components/modal.scss";
import {Caret} from "./caret";
import Modal from "./components/modal";
import ColorPicker from "./components/colorpicker.scss";
import {getSetting} from "@settings";

Style.concat(ModalStyle, ColorPicker);

const ModalActions = getByProps<{openModal(render: any): string}>("openModal", "useModalsStore");
const {UserSettingsSections} = getByProps<{UserSettingsSections: {PREMIUM: string}}>("UserSettingsSections");
const Caret = getByDisplayName<Caret>("Caret");

export default class BetterSettings extends Plugin {
    public onStart(): void {
        Style.load();
        this.patchSettingsView();
        this.patchSettingsItem();
    }

    public patchSettingsView(): void {
        const SettingsView = getByDisplayName<typeof Component>("SettingsView");

        type Component = React.Component<{sections: any[]}, {query: string, collapsedStates: any}> & {
            handleChange: () => void,
            renderSettingsSectionTabBarItem: () => React.ReactElement;
        };

        after<Component, any[], void>(SettingsView.prototype, "componentDidMount", _this => {
            _this.handleChange = () => {
                _this.setState({
                    query: SettingsSearchStore.getQuery(),
                    collapsedStates: Object.assign({}, SettingsSearchStore.getState())
                });
            };

            SettingsSearchStore.addChangeListener(_this.handleChange);
        });

        after<any, any[], void>(SettingsView.prototype, "componentDidMount", _this => {
            SettingsSearchStore.removeChangeListener(_this.update);
            SettingsSearchStore.clearQuery();
        });

        const ArrayFind = Array.prototype.find;
        after<Component, object[], any[]>(SettingsView.prototype, "getPredicateSections", (_this, _, res) => {
            res.unshift(...SearchItems);

            let clone: any[];

            if (_this.state.query) {
                clone = res.filter((e: any, i) => filterSections(e, _this.state.query, i))

                for (let i = 0, insertDivider = false; i < clone.length; i++) {
                    if (clone[i]?.__search) continue;
    
                    const index = getSectionIndex(res, clone[i].__index);
                    if (index == -1 || clone.indexOf(res[index]) > -1) continue;
                    const items = [res[index]];
    
                    if (insertDivider) items.unshift({section: "DIVIDER"});
    
                    clone.splice(i++, 0, ...items);
                    insertDivider ||= true;
                }
            } else {
                clone = [...res];
            }

            // But it works
            clone.find = (...args) => {
                return ArrayFind.apply(res, args) ?? ArrayFind.apply(clone, args);
            };
            clone.map = (factory) => {
                return Array.prototype.map.call(clone, (item: any, index: number) => {
                    if (item.section !== "HEADER") {
                        const sectionIndex = getSectionIndex(clone, index);
                        const section = clone[sectionIndex];

                        if (section && SettingsSearchStore.isCollapsed(section.label)) return null;
                    };

                    const res = factory(item, index, clone) as any;

                    if (!res || typeof res !== "object") return res;
                    
                    try {
                        res.props.item = item;
                        
                        if (item.section === "HEADER" && !res.props.item.__search) {
                            const opened = !SettingsSearchStore.isCollapsed(res.props.item.label);

                            res.props.onClick = () => {
                                SettingsSearchStore.toggleCollapsed(res.props.item.label);
                            };

                            res.props.children = (
                                <div className="bs-header-wrapper">
                                    {res.props.children}
                                    <Caret
                                        width="16"
                                        height="16"
                                        className="bs-header-caret"
                                        direction={opened ? Caret.Directions.DOWN : Caret.Directions.LEFT}
                                    />
                                </div>
                            );
                        }
                    } catch (error) {
                        console.error(error);
                    }
                    
                    return res;
                });
            };

            return clone;
        });
    }

    public patchSettingsItem(): void {
        const {Item} = getByProps<{Item: typeof React.Component}>("Item", "Separator", "Header");
        const ContextMenu = getByProps<any>("openContextMenu");
        const {default: Menu, MenuItem} = getByProps<any>("MenuItem", "default");
        
        function SettingsItemContextMenu({item, updateTarget}) {
            return (
                <Menu navId="settings-item-contextmenu" onClose={ContextMenu.closeContextMenu}>
                    <MenuItem
                        label="Configure"
                        action={() => {
                            ModalActions.openModal((props) => (
                                <Modal item={item} modalProps={props} updateTarget={updateTarget} />
                            ));
                        }}
                        id="configure"
                    />
                </Menu>
            );
        };

        after<React.Component<{selectedItem: string, item: any, __preview?: boolean, __settings: {color: {fg: string, bg: string}, name: string}}, {active: boolean, hovered: boolean}>, any[], React.ReactElement>(Item.prototype, "render", (_this, _, res) => {
            const section = _this.props.item;
            const showBackground = _this.props.selectedItem === section.section || _this.state.hovered;
            const settings = _this.props.__settings || getSetting(["customItems", section.section].join("."), {color: {fg: null, bg: null}, name: _this.props.item.label});
            
            if (section?.label) {
                try {
                    const isNitro = section.section === UserSettingsSections.PREMIUM;
                    const tree = typeof res.props.children === "string"
                        ? res.props
                        : isNitro
                            ? res.props.children.props
                            : res.props.children.props.children;
                    
                    const label = highlightQuery(settings.name, SettingsSearchStore.getQuery());

                    if (Array.isArray(tree)) {
                        tree[0] = label;
                    } else if (isNitro) {
                        tree.label = label;

                        if (settings.color.bg && tree.isSelected) {
                            tree.isSelected = false;
                        }
                    } else {
                        tree.children = label;
                    }
                } catch (error) {
                    console.error(error);
                }
            }

            res.props.onContextMenu = (e: MouseEvent) => {
                if (_this.props.__preview) return;

                ContextMenu.openContextMenu(e, () => (
                    <SettingsItemContextMenu item={_this.props.item} updateTarget={() => _this.forceUpdate()} />
                ));
            };

            res.props.style = Object.assign({}, res.props.style, {
                backgroundColor: (showBackground ? true : null) && settings.color.bg && hexToRGBA(settings.color.bg, "0.4"),
                color: settings.color.fg
            });
            
            return res;
        });
    }

    public onStop(): void {
        unpatchAll();
        Style.unload();
        SettingsSearchStore.destroy();
    }
}