interface Plugin<P, R> {
    (props: P): R;
}

export function createPlugins<P, R>() {
    const plugins: Plugin<P, R>[] = [];
    return {
        add(plugin: Plugin<P, R>) {
            plugins.push(plugin);
            return this;
        },
        apply(props: P): R {
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
