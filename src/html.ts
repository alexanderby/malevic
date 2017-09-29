import { NodeDeclaration, DomEventListener, Attrs } from './defs';

export function html(
    tagOrComponent: string | ((attrs) => NodeDeclaration),
    attrs: Attrs,
    ...children: Array<NodeDeclaration | string | Array<NodeDeclaration | string>>
) {
    const normalized: Array<NodeDeclaration | string> = [];
    children.forEach(c => {
        if (Array.isArray(c)) {
            c.forEach(c => normalized.push(c))
        } else if (c) {
            normalized.push(c);
        }
    });
    if (typeof tagOrComponent === 'string') {
        return { tag: tagOrComponent, attrs, children: normalized };
    }
    if (typeof tagOrComponent === 'function') {
        return tagOrComponent(attrs, ...normalized);
    }
    return null;
}

