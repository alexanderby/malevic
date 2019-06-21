import {Spec, NodeSpec, ComponentSpec} from '../defs';
import {isObject} from './misc';

export function isSpec(x: any): x is Spec {
    return isObject(x) && x.type != null;
}

export function isNodeSpec(x: any): x is NodeSpec {
    return isSpec(x) && typeof x.type === 'string';
}

export function isComponentSpec(x: any): x is ComponentSpec {
    return isSpec(x) && typeof x.type === 'function';
}
