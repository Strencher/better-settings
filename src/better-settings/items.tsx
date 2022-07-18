import React from "react";
import {getByDisplayName, getByProps} from "@webpack";
import {SearchBar} from "./search";
import SettingsSearchStore from "./store";

const FluxUtils = getByProps<any>("useStateFromStores");
const SearchBar = getByDisplayName<SearchBar>("SearchBar");

const SearchItems = [
    {section: "HEADER", label: "SEARCH"},
    {
        section: "CUSTOM",
        element() {
            const query = FluxUtils.useStateFromStores([SettingsSearchStore], () => SettingsSearchStore.getQuery());

            return (
                <SearchBar
                    size={SearchBar.Sizes.SMALL}
                    className="bs-search"
                    query={query}
                    placeholder="Search Settings..."
                    onClear={() => SettingsSearchStore.clearQuery()}
                    onQueryChange={q => SettingsSearchStore.setQuery(q)}
                />
            );
        }
    },
    {section: "DIVIDER"}
];

for (const item of SearchItems) {
    Object.assign(item, {__search: true});
}

export default SearchItems;
