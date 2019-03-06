import {setData} from './data';
import {addListener, removeListener} from './events';
import {createPlugins} from './plugins';
import {classes, styles, isObject, filterChildren, deepUnbox} from './utils';
import {Declaration, NodeDeclaration, NodeAttrs, Child, Component, ComponentDeclaration} from './defs';

const nativeContainers = new WeakMap<Element, boolean>();
const mountedElements = new WeakMap<Element, boolean>();
const didMountHandlers = new WeakMap<Element, (el: Element) => void>();
const didUpdateHandlers = new WeakMap<Element, (el: Element) => void>();
const willUnmountHandlers = new WeakMap<Element, (el: Element) => void>();
const lifecycleHandlers: {[event: string]: WeakMap<Element, (el: Element) => void>} = {
    'didmount': didMountHandlers,
    'didupdate': didUpdateHandlers,
    'willunmount': willUnmountHandlers
};

const XHTML_NS = 'http://www.w3.org/1999/xhtml';
const SVG_NS = 'http://www.w3.org/2000/svg';

export const pluginsCreateNode = createPlugins<{d: NodeDeclaration | string, parent: Element}, Text | Element>()
    .add(({d, parent}) => {
        if (!isObject(d)) {
            return document.createTextNode(d == null ? '' : String(d));
        }
        const tag = (d as NodeDeclaration).type;
        if (tag === 'svg') {
            return document.createElementNS(SVG_NS, 'svg');
        }
        if (parent.namespaceURI === XHTML_NS) {
            return document.createElement(tag);
        }
        return document.createElementNS(parent.namespaceURI, tag);
    });

export const pluginsMountNode = createPlugins<{node: Node; parent: Element; next: Node;}, boolean>()
    .add(({node, parent, next}) => {
        parent.insertBefore(node, next);
        return true;
    });

export const pluginsUnmountNode = createPlugins<{node: Node; parent: Element;}, boolean>()
    .add(({node, parent}) => {
        parent.removeChild(node);
        return true;
    });

export const pluginsSetAttribute = createPlugins<{element: Element; attr: string; value: any;}, boolean>()
    .add(({element, attr, value}) => {
        if (value == null || value === false) {
            element.removeAttribute(attr);
        } else {
            element.setAttribute(attr, value === true ? '' : String(value));
        }
        return true;
    })
    .add(({element, attr, value}) => {
        if (attr.indexOf('on') === 0) {
            const event = attr.substring(2);
            if (typeof value === 'function') {
                addListener(element, event, value);
            } else {
                removeListener(element, event);
            }
            return true;
        }
        return null;
    })
    .add(({element, attr, value}) => {
        if (attr === 'native') {
            if (value === true) {
                nativeContainers.set(element, true);
            } else {
                nativeContainers.delete(element);
            }
            return true;
        }
        if (attr in lifecycleHandlers) {
            const handlers = lifecycleHandlers[attr];
            if (value) {
                handlers.set(element, value);
            } else {
                handlers.delete(element);
            }
            return true;
        }
        return null;
    })
    .add(({element, attr, value}) => {
        if (attr === 'data') {
            setData(element, value);
            return true;
        }
        return null;
    })
    .add(({element, attr, value}) => {
        if (attr === 'class' && isObject(value)) {
            let cls: string;
            if (Array.isArray(value)) {
                cls = classes(...value);
            } else {
                cls = classes(value);
            }
            if (cls) {
                element.setAttribute('class', cls);
            } else {
                element.removeAttribute('class');
            }
            return true;
        }
        return null;
    })
    .add(({element, attr, value}) => {
        if (attr === 'style' && isObject(value)) {
            const style = styles(value);
            if (style) {
                element.setAttribute('style', style);
            } else {
                element.removeAttribute('style');
            }
            return true;
        }
        return null;
    });

const elementsAttrs = new WeakMap<Element, NodeAttrs>();

export function getAttrs(element: Element) {
    return elementsAttrs.get(element) || null;
}

let currentParentDOMNode: Element = null;
let currentDOMNode: Node = null;

export function getParentDOMNode() {
    return currentParentDOMNode;
}

export function getDOMNode() {
    return currentDOMNode;
}

function unboxComponent(d: ComponentDeclaration, parent: Element, node: Node) {
    const prevParentDOMNode = currentParentDOMNode;
    const prevDOMNode = currentDOMNode;
    currentParentDOMNode = parent;
    currentDOMNode = node;
    // Warning: Node type can change or return null.
    const u = deepUnbox(d);
    currentDOMNode = prevDOMNode;
    currentParentDOMNode = prevParentDOMNode;
    return u;
}

function createNode(c: Child, parent: Element, next: Node) {
    const isElement = isObject(c);
    const isComponent = isElement && typeof (c as Declaration).type === 'function';
    const d = isComponent ? unboxComponent(c as ComponentDeclaration, parent, null) : (c as NodeDeclaration | string);
    const node = pluginsCreateNode.apply({d, parent});
    if (isElement) {
        const element = node as Element;
        const elementAttrs: NodeAttrs = {};
        elementsAttrs.set(element, elementAttrs);
        if ((d as NodeDeclaration).attrs) {
            Object.keys((d as NodeDeclaration).attrs).forEach((attr) => {
                const value = (d as NodeDeclaration).attrs[attr];
                pluginsSetAttribute.apply({element, attr, value});
                elementAttrs[attr] = value;
            });
        }
    }
    pluginsMountNode.apply({node, parent, next});
    if (node instanceof Element && didMountHandlers.has(node)) {
        didMountHandlers.get(node)(node);
        mountedElements.set(node, true);
    }
    if (isElement && node instanceof Element && !nativeContainers.has(node)) {
        syncChildNodes(d as NodeDeclaration, node);
    }
    if (isComponent) {
        componentMatches.set(node as Element, (c as ComponentDeclaration).type);
    }
    return node;
}

function collectAttrs(element: Element): NodeAttrs {
    return Array.from(element.attributes)
        .reduce((obj, {name, value}) => {
            obj[name] = value;
            return obj;
        }, {} as NodeAttrs)
}

function syncNode(c: Child, existing: Element | Text) {
    if (!isObject(c)) {
        existing.textContent = c == null ? '' : String(c);
        return;
    }

    const d = typeof (c as Declaration).type === 'function' ? unboxComponent(c as ComponentDeclaration, existing.parentElement, existing) : c as NodeDeclaration;
    const element = existing as Element;
    const attrs = d.attrs || {};
    let existingAttrs = getAttrs(element);
    if (!existingAttrs) {
        existingAttrs = collectAttrs(element);
        elementsAttrs.set(element, existingAttrs);
    }
    Object.keys(existingAttrs).forEach((attr) => {
        if (!(attr in attrs)) {
            pluginsSetAttribute.apply({element, attr, value: null});
            delete existingAttrs[attr];
        }
    });
    Object.keys(attrs).forEach((attr) => {
        const value = attrs[attr];
        if (existingAttrs[attr] !== value) {
            pluginsSetAttribute.apply({element, attr, value});
            existingAttrs[attr] = value;
        }
    });

    if (didMountHandlers.has(element) && !mountedElements.has(element)) {
        didMountHandlers.get(element)(element);
        mountedElements.set(element, true);
    } else if (didUpdateHandlers.has(element)) {
        didUpdateHandlers.get(element)(element);
    }

    if (!nativeContainers.has(element)) {
        syncChildNodes(d, element);
    }
}

function removeNode(node: Node, parent: Element) {
    if (node instanceof Element && willUnmountHandlers.has(node)) {
        willUnmountHandlers.get(node)(node);
    }
    pluginsUnmountNode.apply({node, parent});
}

type NodeMatch = [Child, Node];

const componentMatches = new WeakMap<Element, Component>();

export const pluginsMatchNodes = createPlugins<{d: Declaration, element: Element}, NodeMatch[]>()
    .add(({d, element}) => {
        const matches: NodeMatch[] = [];
        const declarations: Child[] = Array.isArray(d.children) ? filterChildren(d.children) : [];

        let nodeIndex = 0;
        declarations.forEach((c) => {
            const isElement = isObject(c);
            const isText = !isElement;

            let found = null as Node;
            let node = null as Node;
            for (; nodeIndex < element.childNodes.length; nodeIndex++) {
                node = element.childNodes.item(nodeIndex);
                if (isText) {
                    if (node instanceof Element) {
                        break;
                    }
                    if (node instanceof Text) {
                        found = node;
                        nodeIndex++;
                        break;
                    }
                }
                if (isElement && node instanceof Element) {
                    if (
                        // Warning: need to check node type after unboxing
                        (typeof (c as Declaration).type === 'function') ||
                        (typeof (c as Declaration).type === 'string' && node.tagName.toLowerCase() === (c as NodeDeclaration).type)
                    ) {
                        found = node;
                    }
                    nodeIndex++;
                    break;
                }
            }
            matches.push([c, found]);
        });

        return matches;
    });

function commit(matches: NodeMatch[], element: Element) {
    const matchedNodes = new Set<Node>();
    matches.map(([, node]) => node)
        .filter((node) => node)
        .forEach((node) => matchedNodes.add(node));
    Array.from(element.childNodes)
        .filter((node) => !matchedNodes.has(node))
        .forEach((node) => removeNode(node, element));

    let prevNode: Node = null;
    matches
        .forEach(([d, node], i) => {
            if (node) {
                syncNode(d, node as Element | Text);
                prevNode = node;
            } else {
                const nextSibling = (prevNode ?
                    prevNode.nextSibling :
                    (i === 0 ? element.firstChild : null));
                prevNode = createNode(d, element, nextSibling);
            }
        });
}

function syncChildNodes(d: Declaration, element: Element) {
    const matches = pluginsMatchNodes.apply({d, element});
    commit(matches, element);
}

export function render(target: Element, declaration: Declaration): Element;
export function render(target: Element, text: string): Text;
export function render(target: Element, declarations: Child[]): Node[];
export function render(target: Element, declaration: Child | Child[]) {
    if (!(target instanceof Element)) {
        throw new Error('Wrong rendering target');
    }
    const temp: NodeDeclaration = {
        type: target.tagName.toLowerCase(),
        attrs: collectAttrs(target),
        children: Array.isArray(declaration) ? declaration : [declaration]
    };
    syncChildNodes(temp, target);
    return Array.isArray(declaration) ?
        Array.from(target.childNodes) as Node[] :
        isObject(declaration) ?
            target.firstElementChild :
            target.firstChild;
}

export function sync(target: Element, declaration: Declaration): Element;
export function sync(target: Text, text: string): Text;
export function sync(target: Element | Text, declaration: Declaration | string): Element | Text {
    const isElement = isObject(declaration);
    if (!(
        (!isElement && target instanceof Text) ||
        (
            isElement && (
                target instanceof Element && (
                    typeof (declaration as Declaration).type === 'function' || (
                        typeof (declaration as Declaration).type === 'string' &&
                        target.tagName.toLowerCase() === (declaration as NodeDeclaration).type
                    )
                )
            )
        )
    )) {
        throw new Error('Wrong sync target');
    }
    syncNode(declaration, target);
    return target;
}
