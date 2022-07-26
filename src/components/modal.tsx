import {getSetting, onChange, setSetting} from "@settings";
import {getByDisplayName, getByProps} from "@webpack";
import React from "react";
import {fixStupidity, getSectionId} from "../util";
import {Button} from "./button.d";
import ColorPicker from "./colorpicker";

const {Heading} = getByProps<any>("Heading");
const {Item} = getByProps<any>("Item", "Separator", "Header");
const {ModalRoot, ModalHeader, ModalFooter, ModalContent, ModalCloseButton} = getByProps<any>("ModalRoot");
const Button = getByProps<Button>("BorderColors", "Colors");
const {FormItem} = getByProps<any>("FormItem");
const classes = Object.assign({},
    getByProps<any>("item", "topPill"),
    getByProps("tabBarItemContainer")
);
const TextInput = getByDisplayName<any>("TextInput");

type Setting = {
    name: string,
    color: null | {
        bg: number,
        fg: number
    },
};

class SettingsConfigurationModal extends React.Component<{
    item: any,
    modalProps: {
        onClose(): void;
    },
    settings?: Setting,
    updateTarget(): void;
}, Setting> {
    constructor(props) {
        super(props);

        this.state = props.settings;
    }

    public handleSave = () => {
        setSetting(["customItems", getSectionId(this.props.item)].join("."), this.state);

        this.props.modalProps.onClose();
        this.props.updateTarget();
    }

    public handleReset = (e) => {
        e.preventDefault();
        e.stopPropagation();

        this.setState({
            name: fixStupidity(this.props.item),
            color: {
                bg: null,
                fg: null
            }
        });
    }

    public renderPreview() {
        const {item} = this.props;

        let children: JSX.Element | string; {
            if (React.isValidElement(item.icon)) {
                children = (
                    <div className={classes.tabBarItemContainer}>
                        {item.label}
                        {item.icon}
                    </div>
                );
            } else {
                children = item.label;
            }
        };

        return (
            <div className={`bs-modal-preview ${classes.side}`}>
                <span className="bs-modal-blankslate first" />
                <Item
                    __preview
                    __settings={this.state}
                    item={item}
                    onItemSelect={() => {}}
                    itemType={classes.side}
                    selectedItem={getSectionId(item)}
                    className="bs-sidebar-item"
                    id={getSectionId(item)}
                    look={0}
                >{children}</Item>
                <span className="bs-modal-blankslate last" />
            </div>
        );
    }

    public render() {
        const {item, modalProps} = this.props;

        return (
            <ModalRoot {...modalProps}>
                <ModalHeader separator={false}>
                    <Heading level="20" variant="heading-lg/medium">Configure "{fixStupidity(item)}"</Heading>
                    <ModalCloseButton
                        onClick={modalProps.onClose}
                        className="bs-modal-close"
                    />
                </ModalHeader>
                <ModalContent className="bs-modal-content">
                    <FormItem title="preview" className="bs-form-item">
                        {this.renderPreview()}
                    </FormItem>
                    <FormItem title="name" className="bs-form-item">
                        <TextInput
                            defaultValue={this.state.name || item.label}
                            placeholder="Custom name"
                            onChange={value => {
                                this.setState({name: value});
                            }}
                        />
                    </FormItem>
                    <FormItem title="foreground color" className="bs-form-item">
                        <ColorPicker
                            isDefault={this.state.color.fg === null}
                            defaultValue={0}
                            onChange={(val) => {
                                this.setState(prev => ({
                                    color: {
                                        ...prev.color,
                                        fg: val
                                    }
                                }));
                            }}
                            value={"#ed4245"}
                        />
                    </FormItem>
                    <FormItem title="background color" className="bs-form-item">
                        <ColorPicker
                            isDefault={this.state.color.bg === null}
                            defaultValue={0}
                            onChange={(val) => {
                                this.setState(prev => ({
                                    color: {
                                        ...prev.color,
                                        bg: val
                                    }
                                }));
                            }}
                            value={"#ffffff"}
                        />
                    </FormItem>
                    <span className="bsm-reset-text">Don't like your changes? Just <a onClick={this.handleReset}>Reset</a> them!</span>
                </ModalContent>
                <ModalFooter>
                    <Button onClick={this.handleSave}>Save</Button>
                    <Button
                        look={Button.Looks.LINK}
                        onClick={modalProps.onClose}
                        color={Button.Colors.WHITE}
                    >Cancel</Button>
                </ModalFooter>
            </ModalRoot>
        );
    }
}

const WrappedModal = (props: any) => {
    const forceUpdate = React.useReducer(n => !n, false)[1];

    React.useEffect(() =>
        onChange(() =>
            forceUpdate()
        )
    );

    return (
        <SettingsConfigurationModal
            {...props}
            settings={getSetting(
                ["customItems", getSectionId(props.item)].join("."),
                {
                    name: fixStupidity(props.item),
                    color: {
                        bg: null,
                        fg: null
                    }
                }
            )}
        />
    );
};

export default WrappedModal as unknown as typeof SettingsConfigurationModal;
