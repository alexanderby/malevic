import {flatten} from './utils';

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
    tagOrComponent: string | ((attrs, ...children: any[]) => Child),
    attrs: NodeAttrs,
    ...children: Array<Child>
) {
    if (typeof tagOrComponent === 'string') {
        return {tag: tagOrComponent, attrs, children} as NodeDeclaration;
    }
    if (typeof tagOrComponent === 'function') {
        return tagOrComponent(
            // Note: When there are no attributes, JSX produces `null`
            // and it prevents from assigning default value
            attrs == null ? undefined : attrs,
            ...flatten(children)
        );
    }
    return null;
}

