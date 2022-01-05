import type {RecursiveArray, Child, NodeAttrs, NodeSpec} from '../defs';
import {m, isSpec} from '../spec';
import {isObject} from '../utils/misc';

interface TagFunction {
    (attrs: NodeAttrs, ...children: RecursiveArray<Child>): NodeSpec;
}
interface TagFunction {
    (...children: RecursiveArray<Child>): NodeSpec;
}

function normalize(
    attrsOrChild: NodeAttrs | Child,
    ...otherChildren: RecursiveArray<Child>
) {
    const attrs =
        isObject(attrsOrChild) && !isSpec(attrsOrChild) ? attrsOrChild : null;
    const children =
        attrs == null
            ? [attrsOrChild as Child].concat(otherChildren as Child[])
            : otherChildren;
    return {attrs, children};
}

export function createTagFunction(tag: string) {
    return (
        attrsOrChild: NodeAttrs | Child,
        ...otherChildren: RecursiveArray<Child>
    ) => {
        const {attrs, children} = normalize(attrsOrChild, otherChildren);
        return m(tag, attrs, children);
    };
}

export const tags: {[tag: string]: TagFunction} = new Proxy(
    {},
    {
        get: (_, tag: string) => {
            return createTagFunction(tag);
        },
    },
);
