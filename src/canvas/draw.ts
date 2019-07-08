import {Component, Child, RecursiveArray} from '../defs';
import {isNodeSpec, isComponentSpec} from '../spec';
import {unbox} from './unbox';

const primitives = new Map<string, Component>();
const textType: Component = null;

export function draw(context: any, spec: Child | RecursiveArray<Child>) {
    if (spec == null) {
        return;
    }

    if (isNodeSpec(spec)) {
        const type = primitives.get(spec.type);
        draw(context, {...spec, type});
    } else if (isComponentSpec(spec)) {
        if (spec.type === Array) {
            spec.children.forEach((s) => draw(context, s));
        } else {
            unbox(context, spec, (unboxed) => draw(context, unboxed));
        }
    } else if (typeof spec === 'string') {
        const type = textType;
        draw(context, {type, props: {value: spec}, children: []});
    } else if (Array.isArray(spec)) {
        spec.forEach((s) => draw(context, s));
    } else {
        throw new Error('Unable to draw spec');
    }
}
