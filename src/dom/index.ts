import {Component} from '../defs';
import {Plugin} from '../plugins';
import {PLUGINS_CREATE_ELEMENT, PluginCreateElementProps} from './create-element';
import {PLUGINS_SET_ATTRIBUTE, PluginSetAttributeProps} from './sync-attrs';

export {render, teardown} from './render';;

export {getComponentContext as getContext} from './vnode';

function plug<T>(key: symbol) {
    return {
        add(component: Component, plugin: Plugin<T>) {
            if (!component[key]) {
                component[key] = [];
            }
            component[key].push(plugin);
        },
    };
}

export const plugins = {
    createElement: plug<PluginCreateElementProps>(PLUGINS_CREATE_ELEMENT),
    setAttribute: plug<PluginSetAttributeProps>(PLUGINS_SET_ATTRIBUTE),
};
