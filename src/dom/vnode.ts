import {Spec, NodeSpec, ComponentSpec, Child, RecursiveArray} from '../defs';
import {isNodeSpec, isComponentSpec} from '../utils/spec';
import createElement from './create-element';
import {syncAttrs, pluginsSetAttr, PLUGINS_SET_ATTR} from './sync-attrs';
import {VNodeContext} from './vdom';

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

    attach(context: VNodeContext) {
    }

    detach(context: VNodeContext) {
    }

    update(old: VNodeBase, context: VNodeContext) {
        return null;
    }

    attached(context: VNodeContext) {
    }

    detached(context: VNodeContext) {
    }

    updated(context: VNodeContext) {
    }
}

function nodeMatchesSpec(node: Node, spec: NodeSpec): node is Element {
    return node instanceof Element && spec.type === node.tagName.toLowerCase();
}

class ElementVNode extends VNodeBase {
    private spec: NodeSpec;
    private child: DOMVNode;

    constructor(spec: NodeSpec, parent: VNode) {
        super(parent);
        this.spec = spec;
    }

    matches(other: VNode) {
        return other instanceof ElementVNode && this.spec.type === other.spec.type;
    }

    key() {
        return this.spec.props.key;
    }

    children() {
        return [this.child];
    }

    attach(context: VNodeContext) {
        const parent = context.parentNode as Element;
        const existing = context.node as Element;
        const element = nodeMatchesSpec(existing, this.spec) ?
            existing :
            createElement(this.spec, parent);
        syncAttrs(element, this.spec.props, null);
        this.child = new DOMVNode(element, this.spec.children, this);
    }

    update(prev: ElementVNode, context: VNodeContext) {
        const prevContext = context.vdom.getVNodeContext(prev);
        const element = prevContext.node as Element;
        syncAttrs(element, this.spec.props, prev.spec.props);
        this.child = new DOMVNode(element, this.spec.children, this);
    }

    attached(context: VNodeContext) {
        const {attached} = this.spec.props;
        if (attached) {
            attached(context.node as Element);
        }
    }

    detached(context: VNodeContext) {
        const {detached} = this.spec.props;
        if (detached) {
            detached(context.node as Element);
        }
    }

    updated(context: VNodeContext) {
        const {updated} = this.spec.props;
        if (updated) {
            updated(context.node as Element);
        }
    }
}

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

const symbols = {
    ATTACHED: Symbol(),
    DETACHED: Symbol(),
    UPDATED: Symbol(),
};

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
    }

    matches(other: VNode) {
        return other instanceof ComponentVNode && this.spec.type === other.spec.type;
    }

    key() {
        return this.spec.props.key;
    }

    children() {
        return this.child ? [this.child] : [];
    }

    private createContext(context: VNodeContext) {
        const {parentNode} = context;
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
            parent: parentNode as Element,
            attached: (fn) => store[symbols.ATTACHED] = fn,
            detached: (fn) => store[symbols.DETACHED] = fn,
            updated: (fn) => store[symbols.UPDATED] = fn,
            refresh: () => {
                this.prev = this.spec;
                const unboxed = this.unbox(context);
                if (unboxed === context.vdom.LEAVE) {
                    return;
                }

                const prevChild = this.child;
                this.child = createVNode(unboxed, this);
                context.vdom.execute(this.child, prevChild || null);
            },
            leave: () => context.vdom.LEAVE,
        };
    }

    private unbox(context: VNodeContext) {
        const Component = this.spec.type;
        const props = this.spec.props;
        const children = this.spec.children;

        const prevContext = ComponentVNode.context;
        ComponentVNode.context = this.createContext(context);
        const unboxed = Component(props, ...children);
        ComponentVNode.context = prevContext;

        return unboxed;
    }

    private addPlugins() {
        if (this.spec.type[PLUGINS_SET_ATTR]) {
            this.spec.type[PLUGINS_SET_ATTR].forEach((plugin) => pluginsSetAttr.add(plugin));
        }
    }

    private deletePlugins() {
        if (this.spec.type[PLUGINS_SET_ATTR]) {
            this.spec.type[PLUGINS_SET_ATTR].forEach((plugin) => pluginsSetAttr.delete(plugin));
        }
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
        this.handle(symbols.ATTACHED, context);
    }

    detached(context: VNodeContext) {
        this.handle(symbols.DETACHED, context);
    }

    updated(context: VNodeContext) {
        this.deletePlugins();
        this.handle(symbols.UPDATED, context);
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

    attach(context: VNodeContext) {
        const existing = context.node;
        const node = existing instanceof Text ? existing : document.createTextNode(this.text);
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

class NullVNode extends VNodeBase {
    matches(other: VNode) {
        return other instanceof NullVNode;
    }
}

class DOMVNode extends VNodeBase {
    readonly node: Node;
    private childSpecs: RecursiveArray<Child>;
    private childVNodes: VNode[];

    constructor(node: Node, childSpecs: RecursiveArray<Child>, parent: VNode) {
        super(parent);
        this.node = node;
        this.childSpecs = childSpecs;
    }

    matches(other: VNode) {
        return other instanceof DOMVNode && this.node === other.node;
    }

    private wrap() {
        this.childVNodes = this.childSpecs.map((spec) => createVNode(spec, this));
    }

    private insertNode(context: VNodeContext) {
        const shouldInsert = !(
            context.parentNode === this.node.parentElement &&
            context.sibling == this.node.previousSibling
        );
        if (shouldInsert) {
            const target = context.sibling ?
                context.sibling.nextSibling :
                context.parentNode.firstChild;
            context.parentNode.insertBefore(this.node, target);
        }
    }

    attach(context: VNodeContext) {
        this.wrap();
        this.insertNode(context);
    }

    detach(context: VNodeContext) {
        if (this.node.isConnected) {
            context.parentNode.removeChild(this.node);
        }
    }

    update(prev: DOMVNode, context: VNodeContext) {
        this.wrap();
        this.insertNode(context);
    }

    children() {
        return this.childVNodes;
    }
}

export function isDOMVNode(v: any): v is DOMVNode {
    return v instanceof DOMVNode;
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

export function createVNode(spec: Child | RecursiveArray<Child>, parent: VNode): VNode {
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

    if (spec instanceof Node) {
        return new DOMVNode(spec, [], parent);
    }

    if (Array.isArray(spec)) {
        return new ArrayVNode(spec, null, parent);
    }

    throw new Error('Unable to create virtual node for spec');
}
