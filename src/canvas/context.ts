type RenderingContext =
    | CanvasRenderingContext2D
    | ImageBitmapRenderingContext
    | OffscreenCanvasRenderingContext2D
    | WebGLRenderingContext;

export class ComponentContext<T extends RenderingContext> {
    readonly renderingContext: T;

    constructor(renderingContext: T) {
        this.renderingContext = renderingContext;
    }

    get canvas(): HTMLCanvasElement | OffscreenCanvas {
        return this.renderingContext.canvas;
    }

    rendered(callback: () => void) {
        ComponentContext.callbacks.set(
            ComponentContext.callbackToken,
            callback,
        );
    }

    static renderingContext: any = null;
    static callbackToken: any = null;
    static callbacks = new WeakMap<any, () => void>();
}

export function getContext<T extends RenderingContext>(): ComponentContext<T> {
    return new ComponentContext(ComponentContext.renderingContext);
}
