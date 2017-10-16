import {
    NodeDeclaration,
    ChildDeclaration,
    ChildFunction,
    DomEventListener,
    NodeAttrs
} from './defs';

export function html(
    tagOrComponent: string | ((attrs) => ChildDeclaration | ChildFunction | (ChildDeclaration | ChildFunction)[]),
    attrs: NodeAttrs,
    ...children: Array<ChildDeclaration | ChildFunction | (ChildDeclaration | ChildFunction)[]>
) {
    const normalized: Array<ChildDeclaration | ChildFunction> = [];
    children.forEach(c => {
        if (Array.isArray(c)) {
            c.forEach(c => normalized.push(c))
        } else if (c) {
            normalized.push(c);
        }
    });
    if (typeof tagOrComponent === 'string') {
        return { tag: tagOrComponent, attrs, children: normalized } as NodeDeclaration;
    }
    if (typeof tagOrComponent === 'function') {
        return tagOrComponent(attrs, ...normalized);
    }
    return null;
}

