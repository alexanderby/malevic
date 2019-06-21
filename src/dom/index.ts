import {Component} from '../defs';
import {Plugin} from '../plugins';
import {PLUGINS_SET_ATTR, PluginSetAttrProps} from './sync-attrs';

export {render, teardown} from './render';;

export {getComponentContext as getContext} from './vnode';

export const plugins = {
    setAttribute: {
        add(component: Component, plugin: Plugin<PluginSetAttrProps>) {
            if (!component[PLUGINS_SET_ATTR]) {
                component[PLUGINS_SET_ATTR] = [];
            }
            component[PLUGINS_SET_ATTR].push(plugin);
        },
    },
};
