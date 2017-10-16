import { html, classes/*, NodeAttrs*/ } from 'malevic';
import { getPrefix } from './prefix';
import { NodeAttrs } from '../defs';

const managedAttrs = [
    'class',
    'didmount',
    'didupdate',
    'onChange',
    'onInput',
    'onchange',
    'oninput',
    'text',
    'value',
].reduce((map, key) => map.add(key), new Set());

interface TextBoxAttrs extends NodeAttrs {
    max?: number;
    min?: number;
    onChange?: (value: string | number) => void;
    onInput?: (value: string | number) => void;
    onchange?: (this: HTMLInputElement, e: Event) => void;
    oninput?: (this: HTMLInputElement, e: Event) => void;
    readonly?: boolean;
    step?: number;
    text?: string;
    type?: 'text' | 'number';
    value?: string | number;
}

export default function TextBox(props: TextBoxAttrs, value?: string | number) {
    props = props || {};
    const cls = classes(`${getPrefix()}textbox`, ...(Array.isArray(props.class) ? props.class : [props.class]));
    const attrs = props == null ? null : Object.keys(props)
        .filter((key) => !managedAttrs.has(key))
        .reduce((map, key) => (map[key] = props[key], map), {});

    const result = value || props.value || props.text;

    return (
        <input
            class={cls}
            type={props.type || 'text'}
            didmount={(domNode: HTMLInputElement) => {
                domNode.setAttribute('value', String(result));
                if (props.didmount) {
                    props.didmount.call(null, domNode);
                }
            }}
            didupdate={(domNode: HTMLInputElement) => {
                domNode.value = String(result);
                if (props.didupdate) {
                    props.didupdate.call(null, domNode);
                }
            }}
            onchange={function (e) {
                if (props.onChange) {
                    props.onChange.call(null, e.target.value);
                }
                if (props.onchange) {
                    props.onchange.call(this, e);
                }
            }}
            oninput={function (e) {
                if (props.onInput) {
                    props.onInput.call(null, e.target.value);
                }
                if (props.oninput) {
                    props.oninput.call(this, e);
                }
            }}
            {...attrs}
        />
    );
}
