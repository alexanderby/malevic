import {setData} from './data';
import {addListener, removeListener} from './events';
import {NodeDeclaration, NodeAttrs, ChildDeclaration, ChildFunction} from './defs';
import {createPlugins} from './plugins';
import {classes, styles, isObject, flatten, toArray} from './utils';

const nativeContainers = new WeakMap<Element, boolean>();
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

export const pluginsCreateNode = createPlugins<{d: ChildDeclaration, parent: Element}, Text | Element>()
    .add(({d, parent}) => {
        if (!isObject(d)) {
            return document.createTextNode(d == null ? '' : String(d));
        }
        if ((d as NodeDeclaration).tag === 'svg') {
            return document.createElementNS(SVG_NS, 'svg');
        }
        if (parent.namespaceURI === XHTML_NS) {
            return document.createElement((d as NodeDeclaration).tag);
        }
        return document.createElementNS(parent.namespaceURI, (d as NodeDeclaration).tag);
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

function createNode(d: ChildDeclaration, parent: Element, next: Node) {
    const node = pluginsCreateNode.apply({d, parent});
    if (isObject(d)) {
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
    }
    if (isObject(d) && node instanceof Element && !nativeContainers.has(node)) {
        syncChildNodes(d as NodeDeclaration, node);
    }
    return node;
}

function collectAttrs(element: Element): NodeAttrs {
    return toArray(element.attributes)
        .reduce((obj, {name, value}) => {
            obj[name] = value;
            return obj;
        }, {} as NodeAttrs)
}

function syncNode(d: ChildDeclaration, existing: Element | Text) {
    if (isObject(d)) {
        const element = existing as Element;
        const attrs = (d as NodeDeclaration).attrs || {};
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

        if (didUpdateHandlers.has(element)) {
            didUpdateHandlers.get(element)(element);
        }

        if (!nativeContainers.has(element)) {
            syncChildNodes(d as NodeDeclaration, element);
        }
    } else {
        existing.textContent = d == null ? '' : String(d);
    }
}

function removeNode(node: Node, parent: Element) {
    if (node instanceof Element && willUnmountHandlers.has(node)) {
        willUnmountHandlers.get(node)(node);
    }
    pluginsUnmountNode.apply({node, parent});
}

function isEmptyDeclaration(d: ChildDeclaration) {
    return d == null || d === '';
}

type NodeMatch = [ChildDeclaration, Node];

export const pluginsMatchNodes = createPlugins<{d: NodeDeclaration; element: Element;}, NodeMatch[]>()
    .add(({d, element}) => {
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
            const isElement = isObject(d);
            const isText = !isElement;

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
    const matchedNodes = new Set<Node>();
    matches.map(([, node]) => node)
        .filter((node) => node)
        .forEach((node) => matchedNodes.add(node));
    toArray(element.childNodes)
        .filter((node) => !matchedNodes.has(node))
        .forEach((node) => removeNode(node, element));

    let prevNode: Node = null;
    matches.forEach(([d, node], i) => {
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

function syncChildNodes(d: NodeDeclaration, element: Element) {
    const matches = pluginsMatchNodes.apply({d, element});
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
        attrs: collectAttrs(target),
        children: Array.isArray(declaration) ? declaration : [declaration]
    };
    syncChildNodes(temp, target);
    return Array.isArray(declaration) ?
        toArray(target.childNodes) :
        isObject(declaration) ?
            target.firstElementChild :
            target.firstChild;
}

export function sync(target: Element, declaration: NodeDeclaration);
export function sync(target: Text, text: string);
export function sync(target: Element | Text, declaration: ChildDeclaration) {
    const isElement = isObject(declaration);
    if (!(
        (!isElement && target instanceof Text) ||
        (isElement && target instanceof Element && target.tagName.toLowerCase() === (declaration as NodeDeclaration).tag)
    )) {
        throw new Error('Wrong sync target');
    }
    syncNode(declaration, target);
    return target;
}
