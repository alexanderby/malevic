import { flatten } from './utils';

import {
    NodeDeclaration,
    ChildDeclaration,
    ChildFunction,
    DomEventListener,
    NodeAttrs,
    RecursiveArray,
} from './defs';

type Child = ChildDeclaration | ChildFunction | RecursiveArray<ChildDeclaration | ChildFunction>;

export function html(
    tagOrComponent: string | ((attrs) => Child),
    attrs: NodeAttrs,
    ...children: Array<Child>
) {
    if (typeof tagOrComponent === 'string') {
        return { tag: tagOrComponent, attrs, children } as NodeDeclaration;
    }
    if (typeof tagOrComponent === 'function') {
        return tagOrComponent(attrs, ...flatten(children));
    }
    return null;
}

