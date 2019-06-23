import {createPluginsStore} from '../plugins';

export interface PluginSkipAttributeProps {
    attr: string;
    value: any;
}

export const PLUGINS_SKIP_ATTRIBUTE = Symbol();

export const pluginsSkipAttribute = createPluginsStore<PluginSkipAttributeProps, boolean>();

const specialAttrs = new Set([
    'key',
    'attached',
    'detached',
    'updated',
]);

export function shouldSkipAttribute(attr: string, value: any) {
    if (!pluginsSkipAttribute.empty()) {
        const result = pluginsSkipAttribute.apply({attr, value});
        if (result != null) {
            return result;
        }
    }

    return (
        specialAttrs.has(attr) ||
        attr.startsWith('on') ||
        value == null ||
        value === false
    );
}
