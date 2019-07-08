import {ComponentSpec} from '../defs';
import {
    addComponentPlugins,
    deleteComponentPlugins,
    PluginsStore,
} from '../plugins';
import {ComponentContext} from './context';

const canvasPlugins = [] as [symbol, PluginsStore<any>][];

export function unbox(
    context: any,
    spec: ComponentSpec,
    callback: (unboxed: any) => void,
) {
    const {type: Component, props, children} = spec;

    addComponentPlugins(Component, canvasPlugins);
    const prevContext = ComponentContext.renderingContext;
    const prevToken = ComponentContext.callbackToken;
    const token = {};
    ComponentContext.renderingContext = context;
    ComponentContext.callbackToken = token;

    const unboxed = Component(props, ...children);
    callback(unboxed);

    if (ComponentContext.callbacks.has(token)) {
        ComponentContext.callbacks.get(token).call(null);
    }
    ComponentContext.callbackToken = prevToken;
    ComponentContext.renderingContext = prevContext;
    deleteComponentPlugins(Component, canvasPlugins);
}
