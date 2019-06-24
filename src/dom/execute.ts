import {matchChildren} from './match-children';
import {VDOM} from './vdom';
import {VNode} from './vnode';

export function execute(
    vnode: VNode,
    old: VNode,
    vdom: VDOM,
) {
    const didMatch = vnode && old && vnode.matches(old);

    if (didMatch && vnode.parent() === old.parent()) {
        vdom.replaceVNode(old, vnode);
    } else if (vnode) {
        vdom.addVNode(vnode);
    }

    const context = vdom.getVNodeContext(vnode);
    const oldContext = vdom.getVNodeContext(old);

    if (old && !didMatch) {
        old.detach(oldContext);
        old.children().forEach((v) => execute(null, v, vdom));
        old.detached(oldContext);
    }

    if (vnode && !didMatch) {
        vnode.attach(context);
        vnode.children().forEach((v) => execute(v, null, vdom));
        vnode.attached(context);
    }

    if (didMatch) {
        const result = vnode.update(old, context);
        if (result !== vdom.LEAVE) {
            const {matches, unmatched} = matchChildren(vnode, old);

            unmatched.forEach((v) => execute(null, v, vdom));
            matches.forEach(([v, o]) => execute(v, o, vdom));
            vnode.updated(context);
        }
    }
}
