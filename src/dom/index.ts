import {createPluginsAPI} from '../plugins';
import {PLUGINS_CREATE_ELEMENT, PluginCreateElementProps} from './create-element';
import {PLUGINS_SET_ATTRIBUTE, PluginSetAttributeProps} from './sync-attrs';

export {render, teardown} from './render';;

export {getComponentContext as getContext} from './vnode';

export const plugins = {
    createElement: createPluginsAPI<PluginCreateElementProps>(PLUGINS_CREATE_ELEMENT),
    setAttribute: createPluginsAPI<PluginSetAttributeProps>(PLUGINS_SET_ATTRIBUTE),
};
