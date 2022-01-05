import type {RecursiveArray, Child, NodeAttrs, NodeSpec} from '../defs';
import {m, isSpec} from '../spec';
import {isObject} from '../utils/misc';

interface TagFunction {
    (attrs: NodeAttrs, ...children: RecursiveArray<Child>): NodeSpec;
}
interface TagFunction {
    (...children: RecursiveArray<Child>): NodeSpec;
}

export const tags: {[tag: string]: TagFunction} = new Proxy(
    {},
    {
        get: (_, tag: string) => {
            return (
                attrsOrChild: NodeAttrs | Child,
                ...children: RecursiveArray<Child>
            ) => {
                const attrs =
                    isObject(attrsOrChild) && !isSpec(attrsOrChild)
                        ? attrsOrChild
                        : null;
                const allChildren =
                    attrs == null
                        ? [attrsOrChild as Child].concat(children as Child[])
                        : children;
                return m(tag, attrs, allChildren);
            };
        },
    },
);
