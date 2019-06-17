import {Spec} from '../defs';
import {matchChildren} from './match-children';
import {createVNode, VNode} from './vnode';
import {createDOMContext, DOMContext} from './context';

export const LEAVE = Symbol();

export function exec(
    vnode: VNode,
    old: VNode,
    domContext: DOMContext,
) {
    vnode && domContext.addVNode(vnode);
    const context = domContext.getVNodeContext(vnode);
    const oldContext = domContext.getVNodeContext(old);

    const didMatch = vnode && old && vnode.matches(old);

    if (old && !didMatch) {
        old.detach(oldContext);
        old.children().forEach((v) => exec(null, v, domContext));
        old.detached(oldContext);
    }

    if (vnode && !didMatch) {
        vnode.attach(context);
        vnode.children().forEach((v) => exec(v, null, domContext));
        vnode.attached(context);
    }

    if (didMatch) {
        const result = vnode.update(old, oldContext);
        if (result === LEAVE) {
            old.children().forEach((child) => child.parent(vnode));
        } else {
            const {matches, unmatched} = matchChildren(vnode, old);

            unmatched.forEach((v) => exec(null, v, domContext));
            matches.forEach(([v, o]) => exec(v, o, domContext));
            vnode.updated(context);
        }
    }
}

const roots = new WeakMap<Node, VNode>();
const domContexts = new WeakMap<Node, DOMContext>();

export function render(node: Element, spec: Spec): Element {
    const vnode = createVNode(spec, null);
    const old = roots.get(node) || null;
    roots.set(node, vnode);

    let domContext: DOMContext;
    if (domContexts.has(node)) {
        domContext = domContexts.get(node);
    } else {
        domContext = createDOMContext(node);
        domContexts.set(node, domContext);
    }

    exec(vnode, old, domContext);

    return domContext.getVNodeContext(vnode).node as Element;
}
