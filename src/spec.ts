import {
    Spec,
    NodeSpec,
    ComponentSpec,
    Component,
    Child,
    NodeAttrs,
    RecursiveArray,
} from './defs';

export function m(tag: string, attrs: NodeAttrs, ...children: RecursiveArray<Child>): NodeSpec;
export function m<T>(component: Component<T>, props: T, ...children: RecursiveArray<Child>): ComponentSpec<T>;
export function m(
    tagOrComponent: string | Component<any>,
    props: any,
    ...children: RecursiveArray<Child>
): Spec {
    props = props || {};
    if (typeof tagOrComponent === 'string') {
        const tag = tagOrComponent;
        return {type: tag, props, children};
    }
    if (typeof tagOrComponent === 'function') {
        const component = tagOrComponent;
        return {type: component, props, children};
    }
    throw new Error('Unsupported spec type');
}
