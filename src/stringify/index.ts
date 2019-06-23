import {Spec} from '../defs';
import {createPluginsAPI} from '../plugins';
import {isSpec} from '../utils/spec';
import {PLUGINS_STRINGIFY_ATTRIBUTE} from './attr';
import {PLUGINS_SKIP_ATTRIBUTE} from './skip-attr';
import {buildVDOM, getStringifyContext} from './vdom';
import {PLUGINS_IS_VOID_TAG} from './void';

export function stringify(spec: Spec, {indent = '    ', level = 0} = {}) {
    if (isSpec(spec)) {
        const vnodes = buildVDOM(spec);
        return vnodes.map((vnode) => vnode.stringify({indent, level})).join('\n');
    }
    throw new Error('Not a spec');
}

export const plugins = {
    stringifyAttribute: createPluginsAPI(PLUGINS_STRINGIFY_ATTRIBUTE),
    skipAttribute: createPluginsAPI(PLUGINS_SKIP_ATTRIBUTE),
    isVoidTag: createPluginsAPI(PLUGINS_IS_VOID_TAG),
};

export function isStringifying() {
    return getStringifyContext() != null;
}
