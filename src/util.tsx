import {getSetting} from "@settings";
import {find, getByProps} from "@webpack";
import React from "react";

type Constants = {
    UserSettingsSections: {PREMIUM: string},
    GuildSettingsSections: {GUILD_AUTOMOD: string, GUILD_TEMPLATES: string}
};

const i18n = find<{Messages: any}>(m => m?.Messages?.CLOSE);
const {GuildSettingsSections} = getByProps<Constants>("UserSettingsSections");

export function filterSections(section: any, query: string, index: number) {
    if (!section) return false;
    if (section.__search) return true;
    if (section.section === "HEADER") return false;
    
    if (typeof section.label === "string") {
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

export function fixStupidity(section) {
    if (typeof section.label === "string") return section.label;
    if (section.section === GuildSettingsSections.GUILD_AUTOMOD) return section?.label?.props?.children?.[0];
    if (section.section === GuildSettingsSections.GUILD_TEMPLATES) return i18n.Messages[section.section];

    return section;
}

let idCache = {};
export function getLabelId(label: string) {
    if (idCache[label]) return idCache[label];

    const id = Object.entries(i18n.Messages).find(([, v]) => v === label)?.[0];
    idCache[label] = id;

    return id;
}

export function getSectionId(item) {
    if (item.section === "DELETE") {
        return getLabelId(item.label) || item.section;
    }

    return item.section;
}
