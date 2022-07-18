import type React from "react";

export type Caret = React.FC<{
    direction: string;
    className?: string;
    width?: string;
    height?: string;
}> & {
    Directions: {
        DOWN: string;
        LEFT: string;
        RIGHT: string;
        UP: string;
    }
};
