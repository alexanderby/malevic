interface Plugin<P, R> {
    (props: P): R;
}

interface PluginsCollection<P, R> {
    add(plugin: Plugin<P, R>): this;
    apply(props: P): R;
}

export function createPlugins<P, R>() {
    const plugins: Plugin<P, R>[] = [];
    return <PluginsCollection<P, R>>{
        add(plugin) {
            plugins.push(plugin);
            return this;
        },
        apply(props) {
            let result: R;
            let plugin: Plugin<P, R>;
            for (let i = plugins.length - 1; i >= 0; i--) {
                plugin = plugins[i];
                result = plugin(props);
                if (result != null) {
                    return result;
                }
            }
            return null;
        }
    };
}
