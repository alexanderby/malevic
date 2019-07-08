import {ComponentSpec, Child, RecursiveArray} from '../defs';
import {
    addComponentPlugins,
    deleteComponentPlugins,
    PluginsStore,
} from '../plugins';
import {isComponentSpec} from '../spec';

const canvasPlugins = [] as [symbol, PluginsStore<any>][];

let currentContext: any = null;

type RenderingContext =
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | ImageBitmapRenderingContext
    | WebGLRenderingContext;

export function getContext<
    T extends RenderingContext = CanvasRenderingContext2D
>() {
    return currentContext as T;
}

function unbox(context: any, spec: ComponentSpec) {
    const {type: Component, props, children} = spec;

    addComponentPlugins(Component, canvasPlugins);
    const prevContext = currentContext;
    currentContext = context;

    const unboxed = Component(props, ...children);
    draw(context, unboxed);

    currentContext = prevContext;
    deleteComponentPlugins(Component, canvasPlugins);
}

export function draw<T extends RenderingContext>(
    context: T,
    spec: Child | RecursiveArray<Child>,
) {
    if (spec == null) {
        return;
    }

    if (isComponentSpec(spec)) {
        if (spec.type === Array) {
            spec.children.forEach((s) => draw(context, s));
        } else {
            unbox(context, spec);
        }
    } else if (Array.isArray(spec)) {
        spec.forEach((s) => draw(context, s));
    } else if (typeof spec === 'function') {
        spec(context);
    } else {
        throw new Error('Unable to draw spec');
    }
}
