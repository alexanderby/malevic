import { html, classes/*, NodeAttrs*/ } from 'malevic';
import { getPrefix } from './prefix';
import { NodeAttrs } from '../defs';

const managedAttrs = [
    'class',
    'column',
    'row',
].reduce((map, key) => map.add(key), new Set());

interface FlexAttrs extends NodeAttrs {
    column?: boolean;
    row?: boolean;
}

export default function Flex(props: FlexAttrs, ...children) {
    props = props || {};
    const cls = classes(
        `${getPrefix()}flex`,
        ...(Array.isArray(props.class) ? props.class : [props.class]),
        {
            [`${getPrefix()}flex--row`]: props.row,
            [`${getPrefix()}flex--column`]: props.column,
        }
    );

    return (
        <div class={cls}>
            {...children}
        </div>
    );
}
