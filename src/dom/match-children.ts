import {VNode} from './vnode';

export function matchChildren(vnode: VNode, old: VNode) {
    const oldChildren = old.children();
    const oldChildrenByKey = new Map<any, VNode>();
    const oldChildrenWithoutKey: VNode[] = [];
    oldChildren.forEach((v) => {
        const key = v.key();
        if (key == null) {
            oldChildrenWithoutKey.push(v);
        } else {
            oldChildrenByKey.set(key, v);
        }
    });

    const children = vnode.children();
    const matches: [VNode, VNode][] = [];
    const unmatched = new Set(oldChildren);
    const keys = new Set();
    children.forEach((v) => {
        let match: VNode = null;
        const key = v.key();
        if (key != null) {
            if (keys.has(key)) {
                throw new Error('Duplicate key');
            }
            keys.add(key);
            if (oldChildrenByKey.has(key)) {
                const old = oldChildrenByKey.get(key);
                if (v.matches(old)) {
                    match = old;
                }
            }
        } else if (oldChildrenWithoutKey.length > 0) {
            let guess;
            while (guess = oldChildrenWithoutKey.shift()) {
                if (v.matches(guess)) {
                    match = guess;
                    break;
                }
            }
        }
        matches.push([v, match]);
        if (match) {
            unmatched.delete(match);
        }
    });

    return {matches, unmatched};
}
