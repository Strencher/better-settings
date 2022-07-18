type ButtonSizes = { ICON: string, LARGE: string, MAX: string, MEDIUM: string, MIN: string, NONE: string, SMALL: string, TINY: string, XLARGE: string };

type ButtonLooks = { BLANK: string, FILLED: string, INVERTED: string, LINK: string, OUTLINED: string };

type DropdownSizes = { LARGE: "LARGE", MEDIUM: "MEDIUM", SMALL: "SMALL" };

type ButtonColors = { BLACK: string; BRAND: string; GREEN: string; GREY: string; LINK: string; PRIMARY: string; RED: string; TRANSPARENT: string; WHITE: string; YELLOW: string; }

export type Button = React.FC<{className?: string; disabled?: boolean; children?: any, look?: string, size?: string, dropdownSize?: string, color?: string, onClick?: (event: React.MouseEvent) => any}> & {
    Sizes: ButtonSizes,
    Looks: ButtonLooks,
    Colors: ButtonColors,
    DropdownSizes: DropdownSizes
};
