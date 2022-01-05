import {createPluginsAPI} from '../plugins';
import {
    PLUGINS_CREATE_ELEMENT,
    PluginCreateElementProps,
} from './create-element';
import {PLUGINS_SET_ATTRIBUTE, PluginSetAttributeProps} from './sync-attrs';

export {render, sync, teardown} from './render';

export {getComponentContext as getContext} from './vnode';

export {createComponent as component} from './component';

export {tags, createTagFunction as tag} from './tags';

export const plugins = {
    createElement: createPluginsAPI<PluginCreateElementProps, Element>(
        PLUGINS_CREATE_ELEMENT,
    ),
    setAttribute: createPluginsAPI<PluginSetAttributeProps>(
        PLUGINS_SET_ATTRIBUTE,
    ),
};
