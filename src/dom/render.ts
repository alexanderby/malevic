import {Spec, Child, NodeSpec} from '../defs';
import {createVDOM, VDOM, VNodeContext} from './vdom';
import {createVNode, createDOMVNode, VNode} from './vnode';

const roots = new WeakMap<Node, VNode>();
const vdoms = new WeakMap<Node, VDOM>();

function realize(node: Node, vnode: VNode): VNodeContext {
    const old = roots.get(node) || null;
    roots.set(node, vnode);

    let vdom: VDOM;
    if (vdoms.has(node)) {
        vdom = vdoms.get(node);
    } else {
        vdom = createVDOM(node);
        vdoms.set(node, vdom);
    }

    vdom.execute(vnode, old);

    return vdom.getVNodeContext(vnode);
}

export function render<T extends Element>(
    element: T,
    spec: Child | Child[],
): T {
    const vnode = createDOMVNode(
        element,
        Array.isArray(spec) ? spec : [spec],
        null,
    );
    realize(element, vnode);
    return element;
}

export function sync(node: Text, spec: Spec | string): Text;
export function sync<T extends Element>(node: T, spec: Spec): T;
export function sync<T extends Node>(node: T, spec: Spec | string): T {
    const vnode = createVNode(spec, null);
    const context = realize(node, vnode);
    const {nodes} = context;
    if (nodes.length !== 1 || nodes[0] !== node) {
        throw new Error('Spec does not match the node');
    }
    return nodes[0] as T;
}

export function teardown(node: Element) {
    roots.delete(node);
    vdoms.delete(node);
}
