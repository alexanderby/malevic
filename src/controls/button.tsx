import { html, classes/*, NodeAttrs*/ } from 'malevic';
import { getPrefix } from './prefix';
import { NodeAttrs } from '../defs';

const managedAttrs = [
    'class',
    'iconClass',
    'iconImage',
    'style',
    'text',
].reduce((map, key) => map.add(key), new Set());

interface ButtonAttrs extends NodeAttrs {
    iconClass?: string;
    iconImage?: string;
    text?: string;
}

export default function Button(props: ButtonAttrs, text?: string) {
    props = props || {};
    const cls = classes(`${getPrefix()}button`, ...(Array.isArray(props.class) ? props.class : [props.class]));
    const iconClass = classes(
        `${cls}__icon`,
        props.iconClass,
        (props.iconClass || props.iconImage ? null : `${cls}__icon--hidden`)
    );
    const iconStyle = (props.iconImage ? { 'background-image': props.iconImage } : null);
    const textClass = classes(
        `${cls}__text`,
        (props.text || text ? null : `${cls}__text--hidden`)
    );
    const attrs = props == null ? null : Object.keys(props)
        .filter((key) => !managedAttrs.has(key))
        .reduce((map, key) => (map[key] = props[key], map), {});

    return (
        <button class={cls} type="button" {...attrs}>
            <span class={`${cls}__wrapper`}>
                <span class={iconClass} style={iconStyle}></span>
                <span class={textClass}>{props.text || text}</span>
            </span>
        </button>
    );
}
