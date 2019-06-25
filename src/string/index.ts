import {Spec} from '../defs';
import {createPluginsAPI} from '../plugins';
import {isSpec} from '../spec';
import {
    PLUGINS_STRINGIFY_ATTRIBUTE,
    PluginStringifyAttributeProps,
} from './attr';
import {PLUGINS_SKIP_ATTRIBUTE, PluginSkipAttributeProps} from './skip-attr';
import {buildVDOM, getStringifyContext} from './vdom';
import {PLUGINS_IS_VOID_TAG} from './void';

export function stringify(spec: Spec, {indent = '    ', depth = 0} = {}) {
    if (isSpec(spec)) {
        const vnodes = buildVDOM(spec);
        return vnodes
            .map((vnode) => vnode.stringify({indent, depth}))
            .join('\n');
    }
    throw new Error('Not a spec');
}

export const plugins = {
    stringifyAttribute: createPluginsAPI<PluginStringifyAttributeProps, string>(
        PLUGINS_STRINGIFY_ATTRIBUTE,
    ),
    skipAttribute: createPluginsAPI<PluginSkipAttributeProps, boolean>(
        PLUGINS_SKIP_ATTRIBUTE,
    ),
    isVoidTag: createPluginsAPI<string, boolean>(PLUGINS_IS_VOID_TAG),
};

export function isStringifying() {
    return getStringifyContext() != null;
}

export {escapeHTML} from './escape';
