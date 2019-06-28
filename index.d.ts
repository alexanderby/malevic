declare namespace Malevic {
    interface NodeSpec {
        type: string;
        props: NodeAttrs;
        children: RecursiveArray<Child>;
    }

    interface ComponentSpec<T = any, K = any> {
        type: Component<T, K>;
        props: T & {key?: any};
        children: RecursiveArray<Child>;
    }

    type Spec = NodeSpec | ComponentSpec;

    type Component<T = any, K = Child> = (
        props: T & {key?: any},
        ...children: RecursiveArray<Child>
    ) => K | RecursiveArray<K>;

    type Child = Spec | string | Node | null;

    interface DOMEventListener {
        (this: Element, e: Event): void;
    }

    interface NodeAttrs<E = Element, T = Element> {
        key?: any;
        class?:
            | string
            | {[cls: string]: any}
            | (string | {[cls: string]: any})[];
        style?: string | {[prop: string]: any};
        attached?: (el: Element) => void;
        updated?: (el: Element) => void;
        detached?: (el: Element) => void;
        [attr: string]: any | DOMEventListener;

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
        onscroll?: (this: E, e: Event & {target: T}) => void;
    }

    type Plugin<P, R = any> = (props: P) => R;

    interface PluginsAPI<T, K = any> {
        add(type: Component, plugin: Plugin<T, K>): PluginsAPI<T, K>;
    }

    interface RecursiveArray<T> extends Array<T | RecursiveArray<T>> {}

    function m(
        tag: string,
        attrs: NodeAttrs,
        ...children: RecursiveArray<Child>
    ): NodeSpec;
    function m<T>(
        component: Component<T>,
        props: T & {key?: any},
        ...children: RecursiveArray<Child>
    ): ComponentSpec<T>;

    namespace Animation {
        interface AnimationDeclaration<T = any, R = any> {
            from(from: T): this;
            to(from: T, timing?: Partial<TimingSpec>): this;
            initial(from: T): this;
            interpolate(interpolate: Interpolator<any>): this;
            output(transformer: (value: T) => R): this;
        }

        interface Interpolator<T> {
            (from: T, to: T): (t: number) => T;
        }

        interface TimingSpec {
            delay: number;
            duration: number;
            easing:
                | 'linear'
                | 'ease'
                | 'ease-in'
                | 'ease-out'
                | 'ease-in-out'
                | ((t: number) => number);
        }

        function animate(
            to?: any,
            timing?: Partial<TimingSpec>,
        ): AnimationDeclaration;

        function withAnimation<T extends Component>(type: T): T;
    }

    namespace DOM {
        function render<T extends Element>(
            element: T,
            spec: Child | Child[],
        ): T;

        function sync<T extends Element>(node: T, spec: Spec): T;
        function sync(node: Text, spec: Spec | string): Text;

        function teardown(node: Element | Text): void;

        interface ComponentContext {
            spec: Spec;
            prev: Spec;
            store: any;
            node: Node;
            nodes: Node[];
            parent: Element;
            attached(fn: (node: Node) => void): void;
            detached(fn: (node: Node) => void): void;
            updated(fn: (node: Node) => void): void;
            refresh(): void;
            leave(): any;
        }

        function getContext(): ComponentContext;

        interface PluginCreateElementProps {
            spec: NodeSpec;
            parent: Element;
        }

        interface PluginSetAttributeProps {
            element: Element;
            attr: string;
            value: any;
            prev: any;
        }

        const plugins: {
            createElement: PluginsAPI<PluginCreateElementProps>;
            setAttribute: PluginsAPI<PluginSetAttributeProps>;
        };
    }

    namespace Forms {
        function withForms<T extends Component>(type: T): T;
    }

    namespace State {
        function useState<S extends {[prop: string]: any}>(
            initialState: S,
        ): {
            state: S;
            setState: (newState: Partial<S>) => void;
        };

        function withState<T extends Component>(type: T): T;
    }

    namespace String {
        function stringify(
            spec: Spec,
            options?: {indent?: string; depth?: number},
        ): string;

        function isStringifying(): boolean;

        interface PluginStringifyAttributeProps {
            attr: string;
            value: any;
        }

        interface PluginSkipAttributeProps {
            attr: string;
            value: any;
        }

        const plugins: {
            stringifyAttribute: PluginsAPI<
                PluginStringifyAttributeProps,
                string
            >;
            skipAttribute: PluginsAPI<PluginSkipAttributeProps, boolean>;
            isVoidTag: PluginsAPI<string, boolean>;
        };

        function escapeHTML(s: string): string;
    }
}

declare module 'malevic' {
    export = Malevic;
}

declare module 'malevic/animation' {
    export = Malevic.Animation;
}

declare module 'malevic/dom' {
    export = Malevic.DOM;
}

declare module 'malevic/forms' {
    export = Malevic.Forms;
}

declare module 'malevic/state' {
    export = Malevic.State;
}

declare module 'malevic/string' {
    export = Malevic.String;
}

declare namespace JSX {
    interface IntrinsicElements {
        [tag: string]: Malevic.NodeAttrs;
        input: Malevic.NodeAttrs<HTMLInputElement, HTMLInputElement> & {
            value?: any;
            onchange?: (
                this: HTMLInputElement,
                e: Event & {target: HTMLInputElement},
            ) => void;
            oninput?: (
                this: HTMLInputElement,
                e: Event & {target: HTMLInputElement},
            ) => void;
        };
        textarea: Malevic.NodeAttrs<
            HTMLTextAreaElement,
            HTMLTextAreaElement
        > & {
            onchange?: (
                this: HTMLTextAreaElement,
                e: Event & {target: HTMLTextAreaElement},
            ) => void;
            oninput?: (
                this: HTMLTextAreaElement,
                e: Event & {target: HTMLTextAreaElement},
            ) => void;
        };
        form: Malevic.NodeAttrs<HTMLFormElement, HTMLFormElement> & {
            onsubmit?: (
                this: HTMLFormElement,
                e: Event & {target: HTMLFormElement},
            ) => void;
        };
    }

    type Element = Malevic.Spec;
}
