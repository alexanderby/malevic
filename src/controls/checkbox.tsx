import { html, classes/*, NodeAttrs*/ } from 'malevic';
import { getPrefix } from './prefix';
import { NodeAttrs } from '../defs';

const managedAttrs = [
    'class',
    'checked',
    'onChange',
    'readonly',
    'text',
].reduce((map, key) => map.add(key), new Set());

interface CheckboxAttrs extends NodeAttrs {
    checked?: boolean;
    onChange?: (chacked: boolean) => void;
    readonly?: boolean;
    text?: string;
}

export default function CheckBox(props: CheckboxAttrs, text?: string) {
    props = props || {};
    const cls = classes(`${getPrefix()}checkbox`, ...(Array.isArray(props.class) ? props.class : [props.class]));
    const textClass = classes(
        `${cls}__text`,
        (props.text || text ? null : `${cls}__text--hidden`)
    );
    const attrs = props == null ? null : Object.keys(props)
        .filter((key) => !managedAttrs.has(key))
        .reduce((map, key) => (map[key] = props[key], map), {});

    return (
        <label class={cls} {...attrs}>
            <input
                class={`${cls}__input`}
                type="checkbox"
                checked={props.checked}
                readonly={props.readonly}
                onchange={(e) => {
                    if (props.onChange) {
                        props.onChange.call(null, e.target.checked);
                    }
                }}
            />
            <span class={`${cls}__checkmark`}></span>
            <label class={textClass}>{props.text || text}</label>
        </label>
    );
}
