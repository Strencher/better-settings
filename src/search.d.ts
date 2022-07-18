import type React from "react";

export type SearchBar = React.FC<{
    size?: "SMALL" | "MEDIUM" | "LARGE";
    onQueryChange(query: string): void;
    placeholder: string;
    className?: string;
    onClear(): void;
    query: string;
}> & {
    Sizes: {
        SMALL: "SMALL",
        MEDIUM: "MEDIUM",
        LARGE: "LARGE",
    }
};
