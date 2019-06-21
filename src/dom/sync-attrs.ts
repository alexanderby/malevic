import {NodeAttrs, DOMEventListener} from '../defs';
import {createPluginsStore} from '../plugins';
import {classes, styles} from '../utils/attrs';
import {isObject} from '../utils/misc';
import {addEventListener, removeEventListener} from './events';

interface ClassObject {
    [cls: string]: any;
}

function setClassObject(element: Element, classObj: ClassObject | (string | ClassObject)[]) {
    const cls = Array.isArray(classObj) ? classes(...classObj) : classes(classObj);
    if (cls) {
        element.setAttribute('class', cls);
    } else {
        element.removeAttribute('class');
    }
}

interface StyleObject {
    [prop: string]: string;
}

function setStyleObject(element: Element, styleObj: StyleObject) {
    // TODO: Use `style.setProperty` and `style.removeProperty`.
    const style = styles(styleObj);
    if (style) {
        element.setAttribute('style', style);
    } else {
        element.removeAttribute('style');
    }
}

function setEventListener(element: Element, event: string, listener: DOMEventListener) {
    if (typeof listener === 'function') {
        addEventListener(element, event, listener);
    } else {
        removeEventListener(element, event);
    }
}

const specialAttrs = new Set([
    'key',
    'attached',
    'detached',
    'updated',
]);

export interface PluginSetAttributeProps {
    element: Element;
    attr: string;
    value: any;
    prev: any;
}

export const PLUGINS_SET_ATTRIBUTE = Symbol();
export const pluginsSetAttribute = createPluginsStore<PluginSetAttributeProps>();

export function syncAttrs(element: Element, attrs: NodeAttrs, prev: NodeAttrs) {
    const values = new Map<string, any>();

    const newKeys = new Set(Object.keys(attrs || {}));
    const oldKeys = prev ? Object.keys(prev) : [];
    oldKeys
        .filter((key) => !newKeys.has(key))
        .forEach((key) => values.set(key, null));
    newKeys.forEach((key) => values.set(key, attrs[key]));

    const hasPlugins = pluginsSetAttribute.length() > 0;

    values.forEach((value, attr) => {
        if (hasPlugins) {
            const result = pluginsSetAttribute.apply({
                element,
                attr,
                value,
                get prev() {
                    return prev && prev.hasOwnProperty(attr) ? prev[attr] : null;
                },
            });
            if (result != null) {
                return;
            }
        }

        if (attr === 'class' && isObject(value)) {
            setClassObject(element, value);
        } else if (attr === 'style' && isObject(value)) {
            setStyleObject(element, value);
        } else if (attr.startsWith('on')) {
            const event = attr.substring(2);
            setEventListener(element, event, value);
        } else if (specialAttrs.has(attr)) {
        } else if (value == null || value === false) {
            element.removeAttribute(attr);
        } else {
            element.setAttribute(attr, value === true ? '' : String(value));
        }
    });
}
