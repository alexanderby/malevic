import { DomEventListener } from './defs';

interface EventListenersCollection {
    [evt: string]: DomEventListener;
}

const eventListeners = new WeakMap<Element, EventListenersCollection>();

export function addListener(node: Element, event: string, listener: DomEventListener) {
    let listeners: EventListenersCollection;
    if (eventListeners.has(node)) {
        listeners = eventListeners.get(node);
    } else {
        listeners = {};
        eventListeners.set(node, listeners);
    }
    if (listeners[event] !== listener) {
        if (event in listeners) {
            node.removeEventListener(event, listeners[event]);
        }
        node.addEventListener(event, listener);
        listeners[event] = listener;
    }
}

export function removeListener(node: Element, event: string) {
    let listeners: EventListenersCollection;
    if (eventListeners.has(node)) {
        listeners = eventListeners.get(node);
    } else {
        return;
    }
    if (event in listeners) {
        node.removeEventListener(event, listeners[event]);
        delete listeners[event];
    }
}
