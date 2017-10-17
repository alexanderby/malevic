import { html, classes/*, NodeAttrs*/ } from 'malevic';
import { getPrefix } from './prefix';
import { NodeAttrs } from '../defs';

const managedAttrs = [
    'class',
    'didmount',
    'didupdate',
    'value',
].reduce((map, key) => map.add(key), new Set());

interface TextAreaAttrs extends NodeAttrs {
    onchange?: (this: HTMLTextAreaElement, e: Event & { target: HTMLTextAreaElement }) => void;
    oninput?: (this: HTMLTextAreaElement, e: Event & { target: HTMLTextAreaElement }) => void;
    readonly?: boolean;
    value?: string;
}

export default function TextArea(props: TextAreaAttrs, value?: string | number) {
    props = props || {};
    const cls = classes(`${getPrefix()}textarea`, ...(Array.isArray(props.class) ? props.class : [props.class]));
    const attrs = props == null ? null : Object.keys(props)
        .filter((key) => !managedAttrs.has(key))
        .reduce((map, key) => (map[key] = props[key], map), {});

    const result = value != null ? value : props.value != null ? props.value : '';

    return (
        <textarea
            class={cls}
            didmount={(domNode: HTMLTextAreaElement) => {
                domNode.textContent = String(result);
                if (props.didmount) {
                    props.didmount.call(null, domNode);
                }
            }}
            didupdate={(domNode: HTMLTextAreaElement) => {
                domNode.value = String(result);
                if (props.didupdate) {
                    props.didupdate.call(null, domNode);
                }
            }}
            {...attrs}
        />
    );
}
