import {Spec} from '../defs';
import {createVDOM, VDOM} from './vdom';
import {createVNode, VNode} from './vnode';

const roots = new WeakMap<Node, VNode>();
const vdoms = new WeakMap<Node, VDOM>();

export function render(node: Text, spec: Spec | string): Text;
export function render<T extends Element>(node: T, spec: Spec): T;
export function render<T extends Node>(node: T, spec: Spec | string): T {
    const vnode = createVNode(spec, null);
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

    return vdom.getVNodeContext(vnode).node as T;
}

export function teardown(node: Element) {
    roots.delete(node);
    vdoms.delete(node);
}
