import {getSetting} from "@settings";
import React from "react";

export function filterSections(section: any, query: string, index: number) {
    if (!section) return false;
    if (section.__search) return true;
    if (section.section === "HEADER") return false;
    
    if (section.label) {
        const settings = getSetting(["customItems", section.section].join("."), {name: section.label});

        if (!fuzzyMatch(settings.name, query)) return false;
        
        section.__index = index;
        return true;
    };

    return false;
};

export function getSectionIndex(sections: any[], index: number) {
    for (let i = index;i > 0;i--) {
        if (sections[i]?.section === "DIVIDER") break;
        if (sections[i]?.section === "HEADER") return i;
    }

    return -1;
};

export function fuzzyMatch(input: string, query: string) {
    let index = 0;
    input = input.toLowerCase();

    return query
        .toLowerCase()
        .split("")
        .every(c => (index = input.indexOf(c, index)) > -1);
}

export function highlightQuery(input: string, query: string) {
    const chars = new Set(query.toLowerCase());
    const items = [];

    for (let i = 0; i < input.length; i++) {
        items.push(
            <span key={input[i]} className={chars.has(input[i].toLowerCase()) && "highlight"}>{input[i]}</span>
        );
    }

    return (
        <div className="bs-search-highlight">{items}</div>
    );
}

export function hexToRGBA(hex: string, A = "1") {
    const rgb = [];

    for (let i = 1; i < hex.length; i += 2) {
        rgb.push(parseInt(hex[i] + hex[i + 1], 16));
    }

    rgb.push(A);

    return `rgba(${rgb})`;
}
