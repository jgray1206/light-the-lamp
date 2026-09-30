import { useSyncExternalStore } from "react";

// A tiny global store. Route loaders run outside React, so state they read
// (auth token, selected season, ...) lives here instead of in React state.
export function createStore(initialState) {
    let state = initialState;
    const listeners = new Set();

    const get = () => state;
    const set = (patch) => {
        state = { ...state, ...patch };
        listeners.forEach((listener) => listener());
    };
    const subscribe = (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    };
    const useStore = () => useSyncExternalStore(subscribe, get);

    return { get, set, subscribe, useStore };
}
