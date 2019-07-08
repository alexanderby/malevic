export class ComponentContext {
    readonly renderingContext: any;

    constructor(renderingContext: any) {
        this.renderingContext = renderingContext;
    }

    get canvas(): HTMLCanvasElement {
        return this.renderingContext.canvas;
    }

    get context2d() {
        return this.renderingContext as
            | CanvasRenderingContext2D
            | OffscreenCanvasRenderingContext2D;
    }

    get webgl() {
        return this.renderingContext as WebGLRenderingContext;
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

export function getContext(): ComponentContext {
    return new ComponentContext(ComponentContext.renderingContext);
}
