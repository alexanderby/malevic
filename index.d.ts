declare namespace Malevic {
    /**
     * Specification for a DOM element
     */
    interface NodeSpec {
        /**
         * Tag name.
         */
        type: string;
        /**
         * Attributes and event listeners.
         */
        props: NodeAttrs;
        /**
         * Child specifications.
         */
        children: RecursiveArray<Child>;
    }

    /**
     * Specification for a component virtual node
     */
    interface ComponentSpec<T = any, K = any> {
        /**
         * A component function.
         */
        type: Component<T, K>;
        /**
         * Properties of a component.
         */
        props: T & {key?: any};
        /**
         * Child specifications.
         */
        children: RecursiveArray<Child>;
    }

    /**
     * Specification for a DOM element or a component.
     */
    type Spec = NodeSpec | ComponentSpec;

    /**
     * Component function.
     */
    type Component<T = any, K = Child> = (
        props: T & {key?: any},
        ...children: RecursiveArray<Child>
    ) => K | RecursiveArray<K> | any;

    /**
     * A function that returns a spec.
     */
    type InlineFunction<T = any, R = any> = (context: T) => R;

    /**
     * Possible specification child type.
     */
    type Child = Spec | string | Node | InlineFunction | null;

    interface DOMEventListener {
        (this: Element, e: Event): void;
    }

    /**
     * Attributes and event listeners of a DOM element.
     */
    interface NodeAttrs<E = Element, T = Element> {
        key?: any;
        class?:
            | string
            | {[cls: string]: any}
            | (string | {[cls: string]: any})[];
        style?: string | {[prop: string]: any};
        /**
         * Is invoked when DOM node was inserted into DOM.
         */
        attached?: (el: Element) => void;
        /**
         * Is invoked when DOM node and all descendants was updated.
         */
        updated?: (el: Element) => void;
        /**
         * Is invoked when DOM node was removed.
         */
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

    /**
     * Creates a DOM node specification.
     * @param tag Tag name.
     * @param attrs Attributes and event listeners.
     * @param children Child specifications.
     */
    function m(
        tag: string,
        attrs: NodeAttrs,
        ...children: RecursiveArray<Child>
    ): NodeSpec;
    /**
     * Creates a component specification.
     * @param component Component function.
     * @param props Properties of a component.
     * @param children Child specifications.
     */
    function m<T>(
        component: Component<T>,
        props: T & {key?: any},
        ...children: RecursiveArray<Child>
    ): ComponentSpec<T>;

    namespace Animation {
        interface AnimationDeclaration<T = any, R = any> {
            /**
             * Sets the value to start animation from.
             * @param from Value to start animation from.
             */
            from(from: T): this;
            /**
             * Adds a new keyframe.
             * @param to Keyframe value.
             * @param timing Transition timing parameters.
             */
            to(to: T, timing?: Partial<TimingSpec>): this;
            /**
             * Sets the initial value, that will be to start
             * animation from if there were no previous value.
             * @param from Initial value.
             */
            initial(from: T): this;
            /**
             * Sets a function, that interpolates between
             * start and end transition values.
             * @param interpolate Interpolator function.
             */
            interpolate(interpolate: Interpolator<any>): this;
            /**
             * Sets a function that transforms interpolated value
             * into an attribute or CSS value.
             * @param transformer A transformer function.
             */
            output(transformer: (value: T) => R): this;
        }

        interface Interpolator<T> {
            (from: T, to: T): (t: number) => T;
        }

        interface TimingSpec {
            /**
             * Delay (milliseconds).
             */
            delay: number;
            /**
             * Duration (milliseconds).
             */
            duration: number;
            /**
             * Easing function name or custom function.
             */
            easing:
                | 'linear'
                | 'ease'
                | 'ease-in'
                | 'ease-out'
                | 'ease-in-out'
                | ((t: number) => number);
        }

        /**
         * Creates a new animation declaration.
         * @param to End transition value.
         * @param timing Animation timing parameters.
         */
        function animate(
            to?: any,
            timing?: Partial<TimingSpec>,
        ): AnimationDeclaration;

        /**
         * Makes component's DOM nodes to be animatable.
         * @param type Component function.
         */
        function withAnimation<T extends Component>(type: T): T;
    }

    namespace Canvas {
        /**
         * Draws a spec on canvas.
         * @param context Canvas rendering context.
         * @param spec Component spec to draw on canvas.
         */
        function draw<T extends RenderingContext>(
            context: T,
            spec: Child | RecursiveArray<Child>,
        ): void;

        /**
         * Returns component context.
         */
        function getContext<
            T extends RenderingContext = CanvasRenderingContext2D
        >(): T;

        type RenderingContext =
            | CanvasRenderingContext2D
            | OffscreenCanvasRenderingContext2D
            | ImageBitmapRenderingContext
            | WebGLRenderingContext;
    }

    namespace DOM {
        /**
         * Creates or updates child DOM nodes of an element.
         * @param element Target element.
         * @param spec Child specification or multiple specifications.
         */
        function render<T extends Element>(
            element: T,
            spec: Child | Child[],
        ): T;

        /**
         * Synchronizes DOM element with specification.
         * @param element Target DOM element.
         * @param spec Specification.
         */
        function sync<T extends Element>(element: T, spec: Spec): T;
        /**
         * Sets text node content.
         * @param node Target text node.
         * @param spec Specification or string.
         */
        function sync(node: Text, spec: Spec | string): Text;

        /**
         * Destroys virtual DOM assigned to a DOM node.
         * @param node Target DOM node.
         */
        function teardown(node: Element | Text): void;

        interface ComponentContext {
            /**
             * Specification of a component.
             */
            spec: Spec;
            /**
             * Previous specification of a component.
             */
            prev: Spec;
            /**
             * Store of a component.
             * Used to save values between re-renders.
             */
            store: any;
            /**
             * Returns a rendered DOM node.
             */
            node: Node;
            /**
             * Returns a list of rendered DOM siblings.
             */
            nodes: Node[];
            /**
             * Parent DOM node.
             */
            parent: Element;
            /**
             * Sets a callback, that will be invoked when
             * DOM node and all descendants will be attached.
             * @param fn Event listener.
             */
            attached(fn: (node: Node) => void): void;
            /**
             * Sets a callback, that will be invoked
             * when DOM node will be removed.
             * @param fn Event listener.
             */
            detached(fn: (node: Node) => void): void;
            /**
             * Sets a callback, that will be invoked when
             * DOM node and all descendants will be updated.
             * @param fn Event listener.
             */
            updated(fn: (node: Node) => void): void;
            /**
             * Refreshes the component subtree.
             */
            refresh(): void;
            /**
             * Returns a special key, that stops
             * updating the component subtree.
             */
            leave(): any;
        }

        interface InlineFunctionContext {
            /**
             * Parent DOM element.
             */
            parent: Element;
            /**
             * Returns a rendered DOM node.
             */
            node: Node;
            /**
             * Returns rendered DOM nodes.
             */
            nodes: Node[];
        }

        /**
         * Returns a context of a component being unboxed.
         */
        function getContext(): ComponentContext;

        interface PluginCreateElementProps {
            /**
             * DOM element specification.
             */
            spec: NodeSpec;
            /**
             * Parent DOM element.
             */
            parent: Element;
        }

        interface PluginSetAttributeProps {
            /**
             * DOM element.
             */
            element: Element;
            /**
             * Attribute name.
             */
            attr: string;
            /**
             * Value.
             */
            value: any;
            /**
             * Previous value.
             */
            prev: any;
        }

        const plugins: {
            /**
             * Plugins for creating DOM elements.
             */
            createElement: PluginsAPI<PluginCreateElementProps>;
            /**
             * Plugins for setting DOM attribute value.
             */
            setAttribute: PluginsAPI<PluginSetAttributeProps>;
        };
    }

    namespace Forms {
        /**
         * Makes component's input fields react on value attribute.
         * @param type Component function.
         */
        function withForms<T extends Component>(type: T): T;
    }

    namespace State {
        /**
         * Returns component's state and a function
         * for updating state.
         * @param initialState Initial state of a component.
         */
        function useState<S extends {[prop: string]: any}>(
            initialState: S,
        ): {
            /**
             * Component's state.
             */
            state: S;
            /**
             * Sets state and refreshes the component.
             */
            setState: (newState: Partial<S>) => void;
        };

        /**
         * Provides an API for reacting on state changes.
         * @param type Component function.
         */
        function withState<T extends Component>(type: T): T;
    }

    namespace String {
        /**
         * Converts specification into a string.
         * @param spec DOM element or component specification.
         * @param options Stringifying options.
         */
        function stringify(
            spec: Spec,
            options?: Partial<StringifyOptions>,
        ): string;

        /**
         * Returns `true` if component
         * is being converted to string.
         */
        function isStringifying(): boolean;

        interface StringifyOptions {
            /**
             * Characters used for indentation.
             */
            indent: string;
            /**
             * Component's depth
             * (count of initial indents)
             */
            depth: number;
        }

        interface PluginStringifyAttributeProps {
            /**
             * Attribute name.
             */
            attr: string;
            /**
             * Attribute value.
             */
            value: any;
        }

        interface PluginSkipAttributeProps {
            /**
             * Attribute name.
             */
            attr: string;
            /**
             * Attribute value.
             */
            value: any;
        }

        const plugins: {
            /**
             * Plugins for converting attribute
             * value to string.
             */
            stringifyAttribute: PluginsAPI<
                PluginStringifyAttributeProps,
                string
            >;
            /**
             * Plugins for skipping attributes.
             */
            skipAttribute: PluginsAPI<PluginSkipAttributeProps, boolean>;
            /**
             * Plugins for determining if DOM element is void (empty).
             */
            isVoidTag: PluginsAPI<string, boolean>;
        };

        /**
         * Converts string into a value which is safe
         * to insert into HTML document.
         * @param s Unsafe string value.
         */
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

    type Element = any;
}
