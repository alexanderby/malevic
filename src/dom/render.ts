import {Spec} from '../defs';
import createVDOM, {VDOM} from './vdom';
import {createVNode, VNode} from './vnode';

const roots = new WeakMap<Node, VNode>();
const vdoms = new WeakMap<Node, VDOM>();

export default function render(node: Element, spec: Spec): Element {
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

    return vdom.getVNodeContext(vnode).node as Element;
}
