import { setData } from './data';
import { addListener, removeListener } from './events';
import { NodeDeclaration, NodeAttrs, ChildDeclaration, ChildFunction } from './defs';
import { createPlugins } from './plugins';
import { classes, styles, isObject, flatten } from './utils';

const nativeContainers = new WeakSet<Element>();
const didMountHandlers = new WeakMap<Element, (el: Element) => void>();
const didUpdateHandlers = new WeakMap<Element, (el: Element) => void>();
const willUnmountHandlers = new WeakMap<Element, (el: Element) => void>();
const lifecycleHandlers: { [event: string]: WeakMap<Element, (el: Element) => void> } = {
    'didmount': didMountHandlers,
    'didupdate': didUpdateHandlers,
    'willunmount': willUnmountHandlers
};

const XHTML_NS = 'http://www.w3.org/1999/xhtml';
const SVG_NS = 'http://www.w3.org/2000/svg';

export const pluginsCreateNode = createPlugins<{ d: NodeDeclaration | string, parent: Element }, Text | Element>()
    .add(({ d, parent }) => {
        if (typeof d === 'string') {
            return document.createTextNode(d);
        }
        if (d.tag === 'svg') {
            return document.createElementNS(SVG_NS, 'svg');
        }
        if (parent.namespaceURI === XHTML_NS) {
            return document.createElement(d.tag);
        }
        return document.createElementNS(parent.namespaceURI, d.tag);
    });

export const pluginsMountNode = createPlugins<{ node: Node; parent: Element; next: Node; }, boolean>()
    .add(({ node, parent, next }) => {
        parent.insertBefore(node, next);
        return true;
    });

export const pluginsUnmountNode = createPlugins<{ node: Node; parent: Element; }, boolean>()
    .add(({ node, parent }) => {
        parent.removeChild(node);
        return true;
    });

export const pluginsSetAttribute = createPlugins<{ element: Element; attr: string; value: any; }, boolean>()
    .add(({ element, attr, value }) => {
        if (value == null || value === false) {
            element.removeAttribute(attr);
        } else {
            element.setAttribute(attr, value === true ? '' : String(value));
        }
        return true;
    })
    .add(({ element, attr, value }) => {
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
    .add(({ element, attr, value }) => {
        if (attr === 'native') {
            if (value === true) {
                nativeContainers.add(element);
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
    .add(({ element, attr, value }) => {
        if (attr === 'data') {
            setData(element, value);
            return true;
        }
        return null;
    })
    .add(({ element, attr, value }) => {
        if (attr === 'class' && isObject(value)) {
            if (Array.isArray(value)) {
                element.setAttribute('class', classes(...value));
            } else {
                element.setAttribute('class', classes(value));
            }
            return true;
        }
        return null;
    })
    .add(({ element, attr, value }) => {
        if (attr === 'style' && isObject(value)) {
            element.setAttribute('style', styles(value));
            return true;
        }
        return null;
    });

const elementsAttrs = new WeakMap<Element, NodeAttrs>();

export function getAttrs(element: Element) {
    return elementsAttrs.get(element) || null;
}

function createNode(d: NodeDeclaration | string, parent: Element, next: Node) {
    const node = pluginsCreateNode.apply({ d, parent });
    if (typeof d === 'object') {
        const element = node as Element;
        const elementAttrs: NodeAttrs = {};
        elementsAttrs.set(element, elementAttrs);
        if (d.attrs) {
            Object.keys(d.attrs).forEach((attr) => {
                const value = d.attrs[attr];
                pluginsSetAttribute.apply({ element, attr, value });
                elementAttrs[attr] = value;
            });
        }
    }
    pluginsMountNode.apply({ node, parent, next });
    if (node instanceof Element && didMountHandlers.has(node)) {
        didMountHandlers.get(node)(node);
    }
    if (typeof d === 'object' && node instanceof Element && !nativeContainers.has(node)) {
        syncChildren(d, node);
    }
    return node;
}

function syncNode(d: NodeDeclaration | string, existing: Element | Text) {
    if (typeof d === 'string') {
        existing.textContent = d;
    } else {
        const element = existing as Element;
        const attrs = d.attrs || {};
        const existingAttrs = getAttrs(element) || {};
        Object.keys(existingAttrs).forEach((attr) => {
            if (!(attr in attrs)) {
                pluginsSetAttribute.apply({ element, attr, value: null });
                delete existingAttrs[attr];
            }
        });
        Object.keys(attrs).forEach((attr) => {
            const value = attrs[attr];
            if (existingAttrs[attr] !== value) {
                pluginsSetAttribute.apply({ element, attr, value });
                existingAttrs[attr] = value;
            }
        });

        if (didUpdateHandlers.has(element)) {
            didUpdateHandlers.get(element)(element);
        }

        if (!nativeContainers.has(element)) {
            syncChildren(d, element);
        }
    }
}

function removeNode(node: Node, parent: Element) {
    if (node instanceof Element && willUnmountHandlers.has(node)) {
        willUnmountHandlers.get(node)(node);
    }
    pluginsUnmountNode.apply({ node, parent });
}

function isEmptyDeclaration(d: NodeDeclaration | string) {
    return d == null || d === '';
}

type NodeMatch = [NodeDeclaration | string, Node];

export const pluginsMatchNodes = createPlugins<{ d: NodeDeclaration; element: Element; }, NodeMatch[]>()
    .add(({ d, element }) => {
        const matches: NodeMatch[] = [];

        const declarations: ChildDeclaration[] = [];
        if (Array.isArray(d.children)) {
            (flatten(d.children) as (ChildDeclaration | ChildFunction)[])
                .forEach((c) => {
                    if (typeof c === 'function') {
                        const r = c(element);
                        if (Array.isArray(r)) {
                            declarations.push(...(flatten(r) as ChildDeclaration[]).filter(x => !isEmptyDeclaration(x)));
                        } else if (!isEmptyDeclaration(r)) {
                            declarations.push(r);
                        }
                    } else if (!isEmptyDeclaration(c)) {
                        declarations.push(c);
                    }
                });
        }

        let nodeIndex = 0;
        declarations.forEach((d) => {
            const isText = typeof d === 'string';
            const isElement = !isText && isObject(d);

            let found = null as Node;
            let node = null as Node;
            let isElementNode: boolean;
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
                    if ((node as Element).tagName.toLowerCase() === (d as NodeDeclaration).tag) {
                        found = node;
                    }
                    nodeIndex++;
                    break;
                }
            }
            matches.push([d, found]);
        });

        return matches;
    });

function commit(matches: NodeMatch[], element: Element) {
    const matchedNodes = new Set(matches.map(([, node]) => node).filter((node) => node));
    Array.from(element.childNodes)
        .filter((node) => !matchedNodes.has(node))
        .forEach((node) => removeNode(node, element));

    let prevNode: Node = null;
    matches.forEach(([d, node], i) => {
        if (node) {
            syncNode(d, node as Element | Text);
            prevNode = node;
        } else {
            prevNode = createNode(d, element, prevNode ? prevNode.nextSibling : null);
        }
    });
}

function syncChildren(d: NodeDeclaration, element: Element) {
    const matches = pluginsMatchNodes.apply({ d, element });
    commit(matches, element);
}

export function render(target: Element, declaration: NodeDeclaration): Element;
export function render(target: Element, text: string): Text;
export function render(target: Element, declarations: ChildDeclaration[]): Node[];
export function render(target: Element, declaration: ChildDeclaration | ChildDeclaration[]) {
    if (!(target instanceof Element)) {
        throw new Error('Wrong rendering target');
    }
    const temp: NodeDeclaration = {
        tag: target.tagName.toLowerCase(),
        attrs: Array.from(target.attributes)
            .reduce((obj, { name, value }) => {
                obj[name] = value;
                return obj;
            }, {}),
        children: Array.isArray(declaration) ? declaration : [declaration]
    }
    syncChildren(temp, target);
    return Array.isArray(declaration) ?
        Array.from(target.childNodes) :
        typeof declaration === 'string' ?
            target.firstChild :
            target.firstElementChild;
}
