import {NodeAttrs, DomEventListener} from '../defs';
import {addListener, removeListener} from '../events';
import {isObject, classes, styles} from '../utils';

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
    const style = styles(styleObj);
    if (style) {
        element.setAttribute('style', style);
    } else {
        element.removeAttribute('style');
    }
}

function setEventListener(element: Element, event: string, listener: DomEventListener) {
    if (typeof listener === 'function') {
        addListener(element, event, listener);
    } else {
        removeListener(element, event);
    }
}

export function syncAttrs(element: Element, attrs: NodeAttrs, prev: NodeAttrs) {
    const values = new Map<string, any>();

    const newKeys = new Set(Object.keys(attrs || {}));
    const oldKeys = prev ? Object.keys(prev) : [];
    oldKeys
        .filter((key) => !newKeys.has(key))
        .forEach((key) => values.set(key, null));
    newKeys.forEach((key) => values.set(key, attrs[key]));

    values.forEach((value, attr) => {
        if (attr === 'class' && isObject(value)) {
            setClassObject(element, value);
        } else if (attr === 'style' && isObject(value)) {
            setStyleObject(element, value);
        } else if (attr.startsWith('on')) {
            const event = attr.substring(2);
            setEventListener(element, event, value);
        } else if (attr === 'key') {
        } else if (value == null || value === false) {
            element.removeAttribute(attr);
        } else {
            element.setAttribute(attr, value === true ? '' : String(value));
        }
    });
}
