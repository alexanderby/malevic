import {Child, RecursiveArray} from '../defs';
import {isComponentSpec} from '../spec';
import {unbox} from './unbox';

export function draw(context: any, spec: Child | RecursiveArray<Child>) {
    if (spec == null) {
        return;
    }

    if (isComponentSpec(spec)) {
        if (spec.type === Array) {
            spec.children.forEach((s) => draw(context, s));
        } else {
            unbox(context, spec, (unboxed) => draw(context, unboxed));
        }
    } else if (Array.isArray(spec)) {
        spec.forEach((s) => draw(context, s));
    } else {
        throw new Error('Unable to draw spec');
    }
}
