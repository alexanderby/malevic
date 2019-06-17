import {DomEventListener} from './defs';

interface EventListenersCollection {
    [evt: string]: DomEventListener;
}

const eventListeners = new WeakMap<Element, EventListenersCollection>();

export function addListener(element: Element, event: string, listener: DomEventListener) {
    let listeners: EventListenersCollection;
    if (eventListeners.has(element)) {
        listeners = eventListeners.get(element);
    } else {
        listeners = {};
        eventListeners.set(element, listeners);
    }
    if (listeners[event] !== listener) {
        if (listeners.hasOwnProperty(event)) {
            element.removeEventListener(event, listeners[event]);
        }
        element.addEventListener(event, listener);
        listeners[event] = listener;
    }
}

export function removeListener(element: Element, event: string) {
    let listeners: EventListenersCollection;
    if (eventListeners.has(element)) {
        listeners = eventListeners.get(element);
    } else {
        return;
    }
    if (listeners.hasOwnProperty(event)) {
        element.removeEventListener(event, listeners[event]);
        delete listeners[event];
    }
}
