import {Component} from 'malevic';
import * as malevicDOM from 'malevic/dom';
import * as malevicString from 'malevic/string';
import {AnimationDeclaration} from './declaration';
import {TimingSpec} from './defs';
import {setAttributePlugin, setStyleAttributePlugin} from './set-attr-plugins';
import {
    stringifyAttributePlugin,
    stringifyStyleAttrPlugin,
} from './stringify-plugins';

export function animate<T = any>(to?: T, timing?: Partial<TimingSpec>) {
    const declaration = new AnimationDeclaration<T>();
    if (to != null) {
        declaration.to(to, timing);
    }
    return declaration;
}

export function withAnimation<T extends Component>(type: T): T {
    // TODO: Some other way to declare optional modules.
    /* istanbul ignore next */
    if (malevicDOM) {
        const domPlugins = malevicDOM.plugins;
        domPlugins.setAttribute.add(type, setAttributePlugin);
        domPlugins.setAttribute.add(type, setStyleAttributePlugin);
    }
    /* istanbul ignore next */
    if (malevicString) {
        const stringPlugins = malevicString.plugins;
        stringPlugins.stringifyAttribute.add(type, stringifyAttributePlugin);
        stringPlugins.stringifyAttribute.add(type, stringifyStyleAttrPlugin);
    }

    return type;
}
