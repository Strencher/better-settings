export namespace Flux {
    export type Dispatcher = {
        dirtyDispatch(event: any): void;
    };
    
    export class Store {
        constructor(dispatcher: any, dispatches: any);
        _dispatchToken: string;
        addChangeListener(listener: Function): void;
        removeChangeListener(listener: Function): void;
        emitChange(): void;
    }
}
