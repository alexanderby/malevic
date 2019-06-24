import {DOMEventListener} from '../defs';

const eventListeners = new WeakMap<Element, Map<string, DOMEventListener>>();

export function addEventListener(element: Element, event: string, listener: DOMEventListener) {
    let listeners: Map<string, DOMEventListener>;
    if (eventListeners.has(element)) {
        listeners = eventListeners.get(element);
    } else {
        listeners = new Map();
        eventListeners.set(element, listeners);
    }
    if (listeners.get(event) !== listener) {
        if (listeners.has(event)) {
            element.removeEventListener(event, listeners.get(event));
        }
        element.addEventListener(event, listener);
        listeners.set(event, listener);
    }
}

export function removeEventListener(element: Element, event: string) {
    const listeners = eventListeners.get(element);
    element.removeEventListener(event, listeners.get(event));
    listeners.delete(event);
}
