import {
    Spec,
    NodeSpec,
    ComponentSpec,
    InlineFunction,
    Child,
    RecursiveArray,
} from '../defs';
import {
    addComponentPlugins,
    deleteComponentPlugins,
    PluginsStore,
} from '../plugins';
import {isNodeSpec, isComponentSpec} from '../spec';
import {
    createElement,
    pluginsCreateElement,
    PLUGINS_CREATE_ELEMENT,
} from './create-element';
import {XHTML_NS} from './namespace';
import {
    syncAttrs,
    pluginsSetAttribute,
    PLUGINS_SET_ATTRIBUTE,
} from './sync-attrs';
import {VNodeContext, VDOM} from './vdom';

export interface VNode {
    matches(other: VNode): boolean;
    key(): any;
    parent(): VNode;
    parent(vnode: VNode): void;
    children(): VNode[];
    attach(context: VNodeContext): void;
    detach(context: VNodeContext): void;
    update(prev: VNode, context: VNodeContext): any;
    attached(context: VNodeContext): void;
    detached(context: VNodeContext): void;
    updated(context: VNodeContext): void;
}

abstract class VNodeBase implements VNode {
    private parentVNode: VNode;

    constructor(parent: VNode) {
        this.parentVNode = parent;
    }

    abstract matches(other: VNode): boolean;

    key() {
        return null;
    }

    parent(vnode?: VNode) {
        if (vnode) {
            this.parentVNode = vnode;
            return;
        }
        return this.parentVNode;
    }

    children() {
        return [];
    }

    attach(context: VNodeContext) {}

    detach(context: VNodeContext) {}

    update(old: VNodeBase, context: VNodeContext) {
        return null;
    }

    attached(context: VNodeContext) {}

    detached(context: VNodeContext) {}

    updated(context: VNodeContext) {}
}

function nodeMatchesSpec(node: Node, spec: NodeSpec): boolean {
    return (
        node instanceof Element &&
        ((node.namespaceURI === XHTML_NS &&
            spec.type === node.tagName.toLocaleLowerCase()) ||
            (node.namespaceURI !== XHTML_NS && spec.type === node.tagName))
    );
}

const refinedElements = new WeakMap<VDOM, WeakSet<Node>>();

function markElementAsRefined(element: Element, vdom: VDOM) {
    let refined: WeakSet<Node>;
    if (refinedElements.has(vdom)) {
        refined = refinedElements.get(vdom);
    } else {
        refined = new WeakSet();
        refinedElements.set(vdom, refined);
    }
    refined.add(element);
}

function isElementRefined(element: Element, vdom: VDOM) {
    return refinedElements.has(vdom) && refinedElements.get(vdom).has(element);
}

class ElementVNode extends VNodeBase {
    private spec: NodeSpec;
    private child: DOMVNode;

    constructor(spec: NodeSpec, parent: VNode) {
        super(parent);
        this.spec = spec;
    }

    matches(other: VNode) {
        return (
            other instanceof ElementVNode && this.spec.type === other.spec.type
        );
    }

    key() {
        return this.spec.props.key;
    }

    children() {
        return [this.child];
    }

    private getExistingElement(context: VNodeContext) {
        const parent = context.parent;
        const existing = context.node as Element;

        let element: Element;
        if (nodeMatchesSpec(existing, this.spec)) {
            element = existing;
        } else if (
            !isElementRefined(parent, context.vdom) &&
            context.vdom.isDOMNodeCaptured(parent)
        ) {
            const sibling = context.sibling;
            const guess = sibling
                ? (sibling as Element).nextElementSibling
                : parent.firstElementChild;

            if (guess && !context.vdom.isDOMNodeCaptured(guess)) {
                if (nodeMatchesSpec(guess, this.spec)) {
                    element = guess;
                } else {
                    parent.removeChild(guess);
                }
            }
        }

        return element;
    }

    attach(context: VNodeContext) {
        let element: Element;
        const existing = this.getExistingElement(context);
        if (existing) {
            element = existing;
        } else {
            element = createElement(this.spec, context.parent);
            markElementAsRefined(element, context.vdom);
        }

        syncAttrs(element, this.spec.props, null);
        this.child = createDOMVNode(element, this.spec.children, this, false);
    }

    update(prev: ElementVNode, context: VNodeContext) {
        const prevContext = context.vdom.getVNodeContext(prev);
        const element = prevContext.node as Element;
        syncAttrs(element, this.spec.props, prev.spec.props);
        this.child = createDOMVNode(element, this.spec.children, this, false);
    }

    attached(context: VNodeContext) {
        const {oncreate, onrender} = this.spec.props;
        if (oncreate) {
            oncreate(context.node as Element);
        }
        if (onrender) {
            onrender(context.node as Element);
        }
    }

    detached(context: VNodeContext) {
        const {onremove} = this.spec.props;
        if (onremove) {
            onremove(context.node as Element);
        }
    }

    updated(context: VNodeContext) {
        const {onupdate, onrender} = this.spec.props;
        if (onupdate) {
            onupdate(context.node as Element);
        }
        if (onrender) {
            onrender(context.node as Element);
        }
    }
}

interface ComponentContext {
    spec: Spec;
    prev: Spec;
    store: {[key: string]: any};
    node: Node;
    nodes: Node[];
    parent: Element;
    onCreate(fn: (node: Node) => void): void;
    onUpdate(fn: (node: Node) => void): void;
    onRender(fn: (node: Node) => void): void;
    onRemove(fn: (node: Node) => void): void;
    refresh(): void;
    leave(): any;
    getStore<T extends object>(defaults?: T): T;
}

const symbols = {
    CREATED: Symbol(),
    REMOVED: Symbol(),
    UPDATED: Symbol(),
    RENDERED: Symbol(),
    ACTIVE: Symbol(),
    DEFAULTS_ASSIGNED: Symbol(),
};

const domPlugins = [
    [PLUGINS_CREATE_ELEMENT, pluginsCreateElement],
    [PLUGINS_SET_ATTRIBUTE, pluginsSetAttribute],
] as [symbol, PluginsStore<any>][];

class ComponentVNode extends VNodeBase {
    static context: ComponentContext = null;

    private spec: ComponentSpec;
    private prev: ComponentSpec;
    private store: any;
    private child: VNode;

    constructor(spec: ComponentSpec, parent: VNode) {
        super(parent);
        this.spec = spec;
        this.prev = null;
        this.store = {};
        this.store[symbols.ACTIVE] = this;
    }

    matches(other: VNode) {
        return (
            other instanceof ComponentVNode &&
            this.spec.type === other.spec.type
        );
    }

    key() {
        return this.spec.props.key;
    }

    children() {
        return [this.child];
    }

    private createContext(context: VNodeContext): ComponentContext {
        const {parent} = context;
        const {spec, prev, store} = this;

        return {
            spec,
            prev,
            store,
            get node() {
                return context.node;
            },
            get nodes() {
                return context.nodes;
            },
            parent,
            onCreate: (fn) => (store[symbols.CREATED] = fn),
            onUpdate: (fn) => (store[symbols.UPDATED] = fn),
            onRemove: (fn) => (store[symbols.REMOVED] = fn),
            onRender: (fn) => (store[symbols.RENDERED] = fn),
            refresh: () => {
                const activeVNode = store[symbols.ACTIVE] as ComponentVNode;
                activeVNode.refresh(context);
            },
            leave: () => context.vdom.LEAVE,
            getStore: (defaults?) => {
                if (defaults && !store[symbols.DEFAULTS_ASSIGNED]) {
                    Object.entries(defaults).forEach(([prop, value]) => {
                        store[prop] = value;
                    });
                    store[symbols.DEFAULTS_ASSIGNED] = true;
                }
                return store;
            },
        };
    }

    private lock = false;

    private unbox(context: VNodeContext) {
        const Component = this.spec.type;
        const props = this.spec.props;
        const children = this.spec.children;

        this.lock = true;
        const prevContext = ComponentVNode.context;
        ComponentVNode.context = this.createContext(context);
        let unboxed = null;
        try {
            unboxed = Component(props, ...children);
        } finally {
            ComponentVNode.context = prevContext;
            this.lock = false;
        }
        return unboxed;
    }

    private refresh(context: VNodeContext) {
        if (this.lock) {
            throw new Error(
                'Calling refresh during unboxing causes infinite loop',
            );
        }

        this.prev = this.spec;
        const latestContext = context.vdom.getVNodeContext(this);
        const unboxed = this.unbox(latestContext);
        if (unboxed === context.vdom.LEAVE) {
            return;
        }

        const prevChild = this.child;
        this.child = createVNode(unboxed, this);
        context.vdom.execute(this.child, prevChild);
        this.updated(context);
    }

    private addPlugins() {
        addComponentPlugins(this.spec.type, domPlugins);
    }

    private deletePlugins() {
        deleteComponentPlugins(this.spec.type, domPlugins);
    }

    attach(context: VNodeContext) {
        this.addPlugins();
        const unboxed = this.unbox(context);
        const childSpec = unboxed === context.vdom.LEAVE ? null : unboxed;
        this.child = createVNode(childSpec, this);
    }

    update(prev: ComponentVNode, context: VNodeContext) {
        this.store = prev.store;
        this.prev = prev.spec;
        this.store[symbols.ACTIVE] = this;
        const prevContext = context.vdom.getVNodeContext(prev);

        this.addPlugins();
        const unboxed = this.unbox(prevContext);
        let result = null;

        if (unboxed === context.vdom.LEAVE) {
            result = unboxed;
            this.child = prev.child;
            context.vdom.adoptVNode(this.child, this);
        } else {
            this.child = createVNode(unboxed, this);
        }

        return result;
    }

    private handle(event: symbol, context: VNodeContext) {
        const fn = this.store[event];
        if (fn) {
            const nodes = context.nodes.length === 0 ? [null] : context.nodes;
            fn(...nodes);
        }
    }

    attached(context: VNodeContext) {
        this.deletePlugins();
        this.handle(symbols.CREATED, context);
        this.handle(symbols.RENDERED, context);
    }

    detached(context: VNodeContext) {
        this.handle(symbols.REMOVED, context);
    }

    updated(context: VNodeContext) {
        this.deletePlugins();
        this.handle(symbols.UPDATED, context);
        this.handle(symbols.RENDERED, context);
    }
}

export function getComponentContext() {
    return ComponentVNode.context;
}

class TextVNode extends VNodeBase {
    private text: string;
    private child: VNode;

    constructor(text: string, parent: VNode) {
        super(parent);
        this.text = text;
    }

    matches(other: VNode) {
        return other instanceof TextVNode;
    }

    children() {
        return [this.child];
    }

    private getExistingNode(context: VNodeContext) {
        const {parent} = context;
        let node: Node;
        if (context.node instanceof Text) {
            node = context.node;
        } else if (
            !isElementRefined(parent, context.vdom) &&
            context.vdom.isDOMNodeCaptured(parent)
        ) {
            const sibling = context.sibling;
            const guess = sibling ? sibling.nextSibling : parent.firstChild;
            if (
                guess &&
                !context.vdom.isDOMNodeCaptured(guess) &&
                guess instanceof Text
            ) {
                node = guess;
            }
        }
        return node;
    }

    attach(context: VNodeContext) {
        const existing = this.getExistingNode(context);
        let node: Node;
        if (existing) {
            node = existing;
            node.textContent = this.text;
        } else {
            node = document.createTextNode(this.text);
        }

        this.child = createVNode(node, this);
    }

    update(prev: TextVNode, context: VNodeContext) {
        const prevContext = context.vdom.getVNodeContext(prev);
        const {node} = prevContext;
        if (this.text !== prev.text) {
            node.textContent = this.text;
        }
        this.child = createVNode(node, this);
    }
}

class InlineFunctionVNode extends VNodeBase {
    private fn: InlineFunction;
    private child: VNode;

    constructor(fn: InlineFunction, parent: VNode) {
        super(parent);
        this.fn = fn;
    }

    matches(other: VNode) {
        return other instanceof InlineFunctionVNode;
    }

    children() {
        return [this.child];
    }

    private call(context: VNodeContext) {
        const fn = this.fn;
        const inlineFnContext = {
            parent: context.parent,
            get node() {
                return context.node;
            },
            get nodes() {
                return context.nodes;
            },
        };
        const result = fn(inlineFnContext);
        this.child = createVNode(result, this);
    }

    attach(context: VNodeContext) {
        this.call(context);
    }

    update(prev: VNode, context: VNodeContext) {
        const prevContext = context.vdom.getVNodeContext(prev);
        this.call(prevContext);
    }
}

class NullVNode extends VNodeBase {
    matches(other: VNode) {
        return other instanceof NullVNode;
    }
}

class DOMVNode extends VNodeBase {
    readonly node: Node;
    private childSpecs: RecursiveArray<Child>;
    private childVNodes: VNode[];
    private isNative: boolean;

    constructor(
        node: Node,
        childSpecs: RecursiveArray<Child>,
        parent: VNode,
        isNative: boolean,
    ) {
        super(parent);
        this.node = node;
        this.childSpecs = childSpecs;
        this.isNative = isNative;
    }

    matches(other: VNode) {
        return other instanceof DOMVNode && this.node === other.node;
    }

    private wrap() {
        this.childVNodes = this.childSpecs.map((spec) =>
            createVNode(spec, this),
        );
    }

    private insertNode(context: VNodeContext) {
        const {parent, sibling} = context;
        const shouldInsert = !(
            parent === this.node.parentElement &&
            sibling === this.node.previousSibling
        );
        if (shouldInsert) {
            const target = sibling ? sibling.nextSibling : parent.firstChild;
            parent.insertBefore(this.node, target);
        }
    }

    attach(context: VNodeContext) {
        this.wrap();
        this.insertNode(context);
    }

    detach(context: VNodeContext) {
        // TODO: Do not remove every node in subtree.
        context.parent.removeChild(this.node);
    }

    update(prev: DOMVNode, context: VNodeContext) {
        this.wrap();
        this.insertNode(context);
    }

    private cleanupDOMChildren(context: VNodeContext) {
        const element = this.node as Element;
        for (let current: Node = element.lastChild; current != null; ) {
            if (context.vdom.isDOMNodeCaptured(current)) {
                current = current.previousSibling;
            } else {
                const prev = current.previousSibling;
                element.removeChild(current);
                current = prev;
            }
        }
    }

    private refine(context: VNodeContext) {
        if (!this.isNative) {
            this.cleanupDOMChildren(context);
        }

        const element = this.node as Element;
        markElementAsRefined(element, context.vdom);
    }

    attached(context: VNodeContext) {
        const {node} = this;
        if (
            node instanceof Element &&
            !isElementRefined(node, context.vdom) &&
            context.vdom.isDOMNodeCaptured(node)
        ) {
            this.refine(context);
        }
    }

    children() {
        return this.childVNodes;
    }
}

export function isDOMVNode(v: any): v is DOMVNode {
    return v instanceof DOMVNode;
}

export function createDOMVNode(
    node: Node,
    childSpecs: RecursiveArray<Child>,
    parent: VNode,
    isNative: boolean,
) {
    return new DOMVNode(node, childSpecs, parent, isNative);
}

class ArrayVNode extends VNodeBase {
    private items: RecursiveArray<Child>;
    private id: any;
    private childVNodes: VNode[];

    constructor(items: RecursiveArray<Child>, key: any, parent: VNode) {
        super(parent);
        this.items = items;
        this.id = key;
    }

    matches(other: VNode) {
        return other instanceof ArrayVNode;
    }

    key() {
        return this.id;
    }

    children() {
        return this.childVNodes;
    }

    private wrap() {
        this.childVNodes = this.items.map((spec) => createVNode(spec, this));
    }

    attach() {
        this.wrap();
    }

    update() {
        this.wrap();
    }
}

export function createVNode(
    spec: Child | RecursiveArray<Child>,
    parent: VNode,
): VNode {
    if (isNodeSpec(spec)) {
        return new ElementVNode(spec, parent);
    }

    if (isComponentSpec(spec)) {
        if (spec.type === Array) {
            return new ArrayVNode(spec.children, spec.props.key, parent);
        }
        return new ComponentVNode(spec, parent);
    }

    if (typeof spec === 'string') {
        return new TextVNode(spec, parent);
    }

    if (spec == null) {
        return new NullVNode(parent);
    }

    if (typeof spec === 'function') {
        return new InlineFunctionVNode(spec, parent);
    }

    if (spec instanceof Node) {
        return createDOMVNode(spec, [], parent, true);
    }

    if (Array.isArray(spec)) {
        return new ArrayVNode(spec, null, parent);
    }

    throw new Error('Unable to create virtual node for spec');
}
