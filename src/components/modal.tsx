import {getSetting, onChange, setSetting} from "@settings";
import {getByDisplayName, getByProps} from "@webpack";
import React from "react";
import {Button} from "./button.d";
import ColorPicker from "./colorpicker";

const {Heading} = getByProps<any>("Heading");
const {Item} = getByProps<any>("Item", "Separator", "Header");
const {ModalRoot, ModalHeader, ModalFooter, ModalContent, ModalCloseButton} = getByProps<any>("ModalRoot");
const Button = getByProps<Button>("BorderColors", "Colors");
const {FormItem} = getByProps<any>("FormItem");
const classes = getByProps<any>("item", "topPill");
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
        setSetting(["customItems", this.props.item.section].join("."), this.state);

        this.props.modalProps.onClose();
        this.props.updateTarget();
    }

    public handleReset = (e) => {
        e.preventDefault();
        e.stopPropagation();

        this.setState({
            name: this.props.item.label,
            color: {
                bg: null,
                fg: null
            }
        });

        this.props.updateTarget();
    }

    public renderPreview() {
        const {item} = this.props;

        return (
            <div className={`bs-modal-preview ${classes.side}`}>
                <span className="bs-modal-blankslate first" />
                <Item
                    __preview
                    __settings={this.state}
                    item={item}
                    onItemSelect={() => {}}
                    itemType={classes.side}
                    selectedItem={item.section}
                    className="bs-sidebar-item"
                    id={item.section}
                    look={0}
                >{item.label}</Item>
                <span className="bs-modal-blankslate last" />
            </div>
        );
    }

    public render() {
        const {item, modalProps} = this.props;

        return (
            <ModalRoot {...modalProps}>
                <ModalHeader separator={false}>
                    <Heading level="20" variant="heading-lg/medium">Configure "{item.label}"</Heading>
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
                    <span className="bsm-reset-text">Don't like your changes? Just <a onClick={this.handleReset}>Reset</a> it!</span>
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
                ["customItems", props.item.section].join("."),
                {
                    name: props.item.label,
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
