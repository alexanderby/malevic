import {createPluginsStore} from '../plugins';
import {classes, styles} from '../utils/attrs';
import {isObject} from '../utils/misc';
import {escapeHTML} from './escape';

export interface PluginStringifyAttributeProps {
    attr: string;
    value: any;
}

export const PLUGINS_STRINGIFY_ATTRIBUTE = Symbol();

export const pluginsStringifyAttribute = createPluginsStore<PluginStringifyAttributeProps, string>();

export function stringifyAttribute(attr: string, value: any) {
    if (!pluginsStringifyAttribute.empty()) {
        const result = pluginsStringifyAttribute.apply({attr, value});
        if (result != null) {
            return result;
        }
    }

    if (attr === 'class' && isObject(value)) {
        const cls = Array.isArray(value) ? classes(...value) : classes(value);
        return escapeHTML(cls);
    }

    if (attr === 'style' && isObject(value)) {
        return escapeHTML(styles(value));
    }

    if (value === true) {
        return '';
    }

    return escapeHTML(String(value));
}
