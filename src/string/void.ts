import {createPluginsStore} from '../plugins';

export const PLUGINS_IS_VOID_TAG = Symbol();

export const pluginsIsVoidTag = createPluginsStore<string, boolean>();

export function isVoidTag(tag: string) {
    if (!pluginsIsVoidTag.empty()) {
        const result = pluginsIsVoidTag.apply(tag);
        if (result != null) {
            return result;
        }
    }

    return voidTags.has(tag);
}

const voidTags = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'menuitem',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
]);
