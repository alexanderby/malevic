import {escapeHTML, PluginStringifyAttributeProps} from 'malevic/string';
import {styles} from '../utils/attrs';
import {last} from '../utils/misc';
import {AnimationDeclaration} from './declaration';
import {isAnimatedStyleObj} from './utils';

export const stringifyAttributePlugin = ({
    value,
}: PluginStringifyAttributeProps) => {
    if (value instanceof AnimationDeclaration) {
        const spec = value.spec();

        const {from} = spec.timeline[0];
        if (from != null) {
            return escapeHTML(String(spec.output(from)));
        }

        const {to} = last(spec.timeline);
        return to == null ? '' : escapeHTML(String(spec.output(to)));
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
                const {from} = spec.timeline[0];
                if (from != null) {
                    style[prop] = spec.output(from);
                } else {
                    const {to} = last(spec.timeline);
                    style[prop] = spec.output(to);
                }
            } else {
                style[prop] = v;
            }
        });

        return escapeHTML(styles(style));
    }
    return null;
};
