import {Component} from './defs';

export type Plugin<P, R = any> = (props: P) => R;

export interface PluginsStore<P, R = any> {
    add(plugin: Plugin<P, R>): this;
    apply(props: P): R;
    delete(plugin: Plugin<P, R>): void;
    empty(): boolean;
}

export function createPluginsStore<P, R = any>(): PluginsStore<P, R> {
    const plugins: Plugin<P, R>[] = [];
    return {
        add(plugin) {
            plugins.push(plugin);
            return this;
        },
        apply(props) {
            let result: R;
            let plugin: Plugin<P, R>;
            const usedPlugins = new Set<Plugin<P, R>>();
            for (let i = plugins.length - 1; i >= 0; i--) {
                plugin = plugins[i];

                if (usedPlugins.has(plugin)) {
                    continue;
                }

                result = plugin(props);
                if (result != null) {
                    return result;
                }

                usedPlugins.add(plugin);
            }
            return null;
        },
        delete(plugin) {
            for (let i = plugins.length - 1; i >= 0; i--) {
                if (plugins[i] === plugin) {
                    plugins.splice(i, 1);
                    break;
                }
            }
            return this;
        },
        empty() {
            return plugins.length === 0;
        },
    };
}

function iterateComponentPlugins(
    type: Component,
    pairs: [symbol, PluginsStore<any>][],
    iterator: (plugins: PluginsStore<any>, plugin: Plugin<any>) => void,
) {
    pairs
        .filter(([key]) => type[key])
        .forEach(([key, plugins]) => {
            return type[key].forEach((plugin) => iterator(plugins, plugin));
        });
}

export function addComponentPlugins(
    type: Component,
    pairs: [symbol, PluginsStore<any>][],
) {
    iterateComponentPlugins(type, pairs, (plugins, plugin) =>
        plugins.add(plugin),
    );
}

export function deleteComponentPlugins(
    type: Component,
    pairs: [symbol, PluginsStore<any>][],
) {
    iterateComponentPlugins(type, pairs, (plugins, plugin) =>
        plugins.delete(plugin),
    );
}

interface PluginsAPI<T, K = any> {
    add(type: Component, plugin: Plugin<T, K>): PluginsAPI<T, K>;
}

export function createPluginsAPI<T, K = any>(key: symbol): PluginsAPI<T, K> {
    const api = {
        add(type: Component, plugin: Plugin<T, K>) {
            if (!type[key]) {
                type[key] = [];
            }
            type[key].push(plugin);
            return api;
        },
    };
    return api;
}
