import {Component} from 'malevic';
import {plugins as domPlugins} from 'malevic/dom';
import {plugins as stringPlugins} from 'malevic/string';
import {AnimationDeclaration} from './declaration';
import {setAttributePlugin, setStyleAttributePlugin} from './set-attr-plugins';
import {
    stringifyAttributePlugin,
    stringifyStyleAttrPlugin,
} from './stringify-plugins';

export function animate<T = any>(to?: T) {
    const declaration = new AnimationDeclaration<T>();
    if (to != null) {
        declaration.to(to);
    }
    return declaration;
}

export function withAnimation<T extends Component>(type: T): T {
    domPlugins.setAttribute.add(type, setAttributePlugin);
    domPlugins.setAttribute.add(type, setStyleAttributePlugin);
    stringPlugins.stringifyAttribute.add(type, stringifyAttributePlugin);
    stringPlugins.stringifyAttribute.add(type, stringifyStyleAttrPlugin);

    return type;
}
