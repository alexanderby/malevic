export type Plugin<P, R = any> = (props: P) => R;

interface PluginsStore<P, R> {
    add(plugin: Plugin<P, R>): this;
    apply(props: P): R;
    delete(plugin: Plugin<P, R>): void;
    length(): number;
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
        },
        length() {
            return plugins.length;
        },
    };
}
