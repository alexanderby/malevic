import { html, classes/*, NodeAttrs*/ } from 'malevic';
import { getPrefix } from './prefix';
import { NodeAttrs } from '../defs';

const managedAttrs = [
    'class',
    'text',
].reduce((map, key) => map.add(key), new Set());

interface LabelAttrs extends NodeAttrs {
    text?: string;
}

export default function Label(props: LabelAttrs, text?: string) {
    props = props || {};
    const cls = classes(`${getPrefix()}label`, ...(Array.isArray(props.class) ? props.class : [props.class]));
    const attrs = props == null ? null : Object.keys(props)
        .filter((key) => !managedAttrs.has(key))
        .reduce((map, key) => (map[key] = props[key], map), {});

    return (
        <label class={cls} {...attrs}>
            {text || props.text}
        </label>
    );
}
