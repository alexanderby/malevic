import {
    Spec,
    NodeSpec,
    ComponentSpec,
    Component,
    Child,
    NodeAttrs,
    RecursiveArray,
} from './defs';
import {isObject} from './utils/misc';

export function m(tag: string, attrs: NodeAttrs, ...children: RecursiveArray<Child>): NodeSpec;
export function m<T>(component: Component<T>, props: T & {key?: any}, ...children: RecursiveArray<Child>): ComponentSpec<T>;
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

export function isSpec(x: any): x is Spec {
    return isObject(x) && x.type != null && x.nodeType == null;
}

export function isNodeSpec(x: any): x is NodeSpec {
    return isSpec(x) && typeof x.type === 'string';
}

export function isComponentSpec(x: any): x is ComponentSpec {
    return isSpec(x) && typeof x.type === 'function';
}
