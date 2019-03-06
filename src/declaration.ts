import {
    Declaration,
    NodeDeclaration,
    ComponentDeclaration,
    Component,
    Child,
    NodeAttrs,
} from './defs';

export function m(tag: string, attrs: NodeAttrs, ...children: Child[]): NodeDeclaration;
export function m<T>(component: Component<T>, props: T, ...children: Child[]): ComponentDeclaration<T>;
export function m(
    tagOrComponent: string | Component<any>,
    attrs: any,
    ...children: Child[]
): Declaration {
    if (typeof tagOrComponent === 'string') {
        const tag = tagOrComponent;
        return {type: tag, attrs, children};
    }
    if (typeof tagOrComponent === 'function') {
        const component = tagOrComponent;
        return {type: component, attrs, children};
    }
    return null;
}

