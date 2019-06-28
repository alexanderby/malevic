import {escapeHTML, PluginStringifyAttributeProps} from 'malevic/string';
import {styles} from '../utils/attrs';
import {last} from '../utils/misc';
import {AnimationDeclaration} from './declaration';
import {AnimationSpec} from './defs';
import {isAnimatedStyleObj} from './utils';

function getStartOutput(spec: AnimationSpec) {
    return spec.output(
        spec.timeline[0].from != null
            ? spec.timeline[0].from
            : spec.initial != null
            ? spec.initial
            : last(spec.timeline).to,
    );
}

export const stringifyAttributePlugin = ({
    value,
}: PluginStringifyAttributeProps) => {
    if (value instanceof AnimationDeclaration) {
        const spec = value.spec();
        return escapeHTML(String(getStartOutput(spec)));
    }

    return null;
};

export const stringifyStyleAttrPlugin = ({attr, value}) => {
    if (attr === 'style' && isAnimatedStyleObj(value)) {
        const style = {};
        Object.keys(value).forEach((prop) => {
            const v = value[prop];
            if (v instanceof AnimationDeclaration) {
                const spec = v.spec();
                style[prop] = getStartOutput(spec);
            } else {
                style[prop] = v;
            }
        });

        return escapeHTML(styles(style));
    }
    return null;
};
