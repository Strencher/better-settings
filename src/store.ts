import {getSetting, setSetting} from "@settings";
import {getByProps} from "@webpack";
import type {Flux as FluxType} from "./flux";

const Flux = getByProps<{Store: typeof FluxType.Store}>("Store", "connectStores");
const FluxDispatcher = getByProps<FluxType.Dispatcher>("dispatch", "isDispatching");
let query = "";
let collapsedStates = getSetting("collapsedStates", {});

class SearchStore extends (Flux).Store {
    public getQuery(): string {return query;}

    public setQuery(newQuery: string): void {
        query = newQuery;
        this.emitChange();
    }

    public clearQuery(): void {
        query = "";
        this.emitChange();
    }

    public isCollapsed(name: string): boolean {
        return Boolean(collapsedStates[name]);
    }

    public toggleCollapsed(name: string): void {
        if (this.isCollapsed(name)) {
            delete collapsedStates[name];
        } else {
            collapsedStates[name] = true;
        }
        
        setSetting("collapsedStates", collapsedStates);
        
        this.emitChange();
    }

    public getState() {
        return collapsedStates;
    }

    public destroy(): void {
        const actions = (FluxDispatcher as any)._actionHandlers;
        actions?._dependencyGraph.removeNode(this._dispatchToken);
        actions?._actionHandlers._invalidateCaches();
    }
}

const SettingsSearchStore = new SearchStore(FluxDispatcher, {});

export default SettingsSearchStore;
