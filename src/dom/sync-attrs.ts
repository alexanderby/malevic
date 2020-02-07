import {NodeAttrs, DOMEventListener} from '../defs';
import {createPluginsStore} from '../plugins';
import {classes, setInlineCSSPropertyValue} from '../utils/attrs';
import {isObject} from '../utils/misc';
import {addEventListener, removeEventListener} from './events';

interface ClassObject {
    [cls: string]: any;
}

function setClassObject(
    element: Element,
    classObj: ClassObject | (string | ClassObject)[],
) {
    const cls = Array.isArray(classObj)
        ? classes(...classObj)
        : classes(classObj);
    if (cls) {
        element.setAttribute('class', cls);
    } else {
        element.removeAttribute('class');
    }
}

function mergeValues<T extends {[prop: string]: any}>(obj: T, old: T) {
    const values = new Map<string, any>();

    const newProps = new Set(Object.keys(obj));
    const oldProps = Object.keys(old);
    oldProps
        .filter((prop) => !newProps.has(prop))
        .forEach((prop) => values.set(prop, null));
    newProps.forEach((prop) => values.set(prop, obj[prop]));

    return values;
}

interface StyleObject {
    [prop: string]: string;
}

function setStyleObject(
    element: HTMLElement,
    styleObj: StyleObject,
    prev: StyleObject | string | null,
) {
    let prevObj: StyleObject;
    if (isObject(prev)) {
        prevObj = prev;
    } else {
        prevObj = {};
        element.removeAttribute('style');
    }

    const declarations = mergeValues(styleObj, prevObj);
    declarations.forEach(($value, prop) =>
        setInlineCSSPropertyValue(element, prop, $value),
    );
}

function setEventListener(
    element: Element,
    event: string,
    listener: DOMEventListener,
) {
    if (typeof listener === 'function') {
        addEventListener(element, event, listener);
    } else {
        removeEventListener(element, event);
    }
}

const specialAttrs = new Set([
    'key',
    'oncreate',
    'onupdate',
    'onrender',
    'onremove',
]);

export interface PluginSetAttributeProps {
    element: Element;
    attr: string;
    value: any;
    prev: any;
}

export const PLUGINS_SET_ATTRIBUTE = Symbol();

export const pluginsSetAttribute = createPluginsStore<
    PluginSetAttributeProps
>();

function getPropertyValue(obj: any, prop: string) {
    return obj && obj.hasOwnProperty(prop) ? obj[prop] : null;
}

export function syncAttrs(element: Element, attrs: NodeAttrs, prev: NodeAttrs) {
    const values = mergeValues(attrs, prev || {});
    values.forEach((value, attr) => {
        if (!pluginsSetAttribute.empty()) {
            const result = pluginsSetAttribute.apply({
                element,
                attr,
                value,
                get prev() {
                    return getPropertyValue(prev, attr);
                },
            });
            if (result != null) {
                return;
            }
        }

        if (attr === 'class' && isObject(value)) {
            setClassObject(element, value);
        } else if (attr === 'style' && isObject(value)) {
            const prevValue = getPropertyValue(prev, attr);
            setStyleObject(element as HTMLElement, value, prevValue);
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
