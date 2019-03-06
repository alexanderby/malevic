declare namespace Malevic {

    interface NodeDeclaration {
        type: string;
        attrs: NodeAttrs;
        children: Child[];
    }

    interface ComponentDeclaration<T = any> {
        type: Component<T>;
        attrs: T;
        children: Child[];
    }

    type Declaration = NodeDeclaration | ComponentDeclaration;

    type Component<T = any> = (props: T, ...children: Child[]) => Declaration;

    type Child = string | Declaration;

    interface DomEventListener<T = Element> {
        (this: Element, e: Event & {target: T}): void;
    }

    interface NodeAttrs<E = Element, T = Element> {
        data?: any;
        class?: string | {[cls: string]: any;} | (string | {[cls: string]: any;})[];
        style?: string | {[prop: string]: any;};
        native?: boolean;
        didmount?: (el: E) => void;
        didupdate?: (el: E) => void;
        willunmount?: (el: E) => void;

        onclick?: (this: E, e: MouseEvent & {target: T}) => void;
        ondblclick?: (this: E, e: MouseEvent & {target: T}) => void;
        oncontextmenu?: (this: E, e: MouseEvent & {target: T}) => void;
        onmousedown?: (this: E, e: MouseEvent & {target: T}) => void;
        onmousemove?: (this: E, e: MouseEvent & {target: T}) => void;
        onmouseenter?: (this: E, e: MouseEvent & {target: T}) => void;
        onmouseleave?: (this: E, e: MouseEvent & {target: T}) => void;
        onmouseup?: (this: E, e: MouseEvent & {target: T}) => void;
        ontouchstart?: (this: E, e: TouchEvent & {target: T}) => void;
        ontouchmove?: (this: E, e: TouchEvent & {target: T}) => void;
        ontouchend?: (this: E, e: TouchEvent & {target: T}) => void;
        onkeydown?: (this: E, e: KeyboardEvent & {target: T}) => void;
        onkeyup?: (this: E, e: KeyboardEvent & {target: T}) => void;
        onkeypress?: (this: E, e: KeyboardEvent & {target: T}) => void;

        [attr: string]: any | DomEventListener<T>;
    }

    function m(tag: string, attrs: NodeAttrs, ...children: Child[]): NodeDeclaration;
    function m<T>(component: Component<T>, props: T, ...children: Child[]): ComponentDeclaration<T>;

    function render(
        target: Element,
        declaration: Declaration
    ): Element;
    function render(
        target: Element,
        text: string
    ): Text;
    function render(
        target: Element,
        declaration: Child | Child[]
    ): Node[];

    function sync(
        target: Element,
        declaration: Declaration
    ): Element;
    function sync(
        target: Text,
        text: string
    ): Text;

    function getAttrs(element: Element): NodeAttrs;

    function getDOMNode(): Node;

    function getParentDOMNode(): Element;

    function classes(
        ...args: Array<string | {[cls: string]: boolean}>
    ): string;

    function styles(
        declarations: {[cssProp: string]: string}
    ): string;

    function getData(node: Element): any;

    function renderToString(declaration: Declaration): string;

    function escapeHtml(s: any): string;

    interface Plugin<P, R> {
        (props: P): R;
    }

    interface PluginsCollection<P, R> {
        add(plugin: Plugin<P, R>): this;
        apply(props: P): R;
    }

    const plugins: {
        render: {
            createNode: PluginsCollection<{d: NodeDeclaration | string, parent: Node}, Node>;
            matchNodes: PluginsCollection<{d: Declaration; element: Element;}, [Declaration, Node][]>;
            mountNode: PluginsCollection<{node: Node; parent: Node; next: Node;}, boolean>;
            setAttribute: PluginsCollection<{element: Element; attr: string; value: any;}, boolean>;
            unmountNode: PluginsCollection<{node: Node; parent: Node;}, boolean>;
        },
        static: {
            isVoidTag: PluginsCollection<string, boolean>;
            processText: PluginsCollection<string, string>;
            skipAttr: PluginsCollection<{attr: string; value: any;}, boolean>;
            stringifyAttr: PluginsCollection<{attr: string; value: any;}, string>;
        }
    };

    namespace Animation {

        interface AnimationDeclaration {
            duration(duration: number): this;
            easing(easing: string | number[]): this;
            initial(from: any): this;
            interpolate(interpolate: Interpolator<any>): this;
        }

        interface Interpolator<T> {
            (from: T, to: T): (t: number) => T;
        }

        function animate(to: any): AnimationDeclaration;
    }

    function Animation(): void;

    namespace Forms { }

    function Forms(): void;

    namespace State { }

    function State(fn: (attrs, ...children) => NodeDeclaration, initialState?): (attrs, ...children) => NodeDeclaration;

}

declare module 'malevic' {
    export = Malevic;
}

declare module 'malevic/animation' {
    export const animate: typeof Malevic.Animation.animate;
    export default Malevic.Animation;
}

declare module 'malevic/forms' {
    export default Malevic.Forms;
}

declare module 'malevic/state' {
    export default Malevic.State;
}

declare namespace JSX {

    interface IntrinsicElements {
        [tag: string]: Malevic.NodeAttrs;
        input: Malevic.NodeAttrs<HTMLInputElement, HTMLInputElement> & {
            onchange?: (this: HTMLInputElement, e: Event & {target: HTMLInputElement}) => void;
            oninput?: (this: HTMLInputElement, e: Event & {target: HTMLInputElement}) => void;
        };
        textarea: Malevic.NodeAttrs<HTMLTextAreaElement, HTMLTextAreaElement> & {
            onchange?: (this: HTMLTextAreaElement, e: Event & {target: HTMLTextAreaElement}) => void;
            oninput?: (this: HTMLTextAreaElement, e: Event & {target: HTMLTextAreaElement}) => void;
        };
        form: Malevic.NodeAttrs<HTMLFormElement, HTMLFormElement> & {
            onsubmit?: (this: HTMLFormElement, e: Event & {target: HTMLFormElement}) => void;
        };
    }

    type Element = Malevic.Declaration;

}
