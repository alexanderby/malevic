import { setData } from './data';
import { addListener, removeListener } from './events';
import { NodeDeclaration, ChildDeclaration, ChildFunction } from './defs';
import { createPlugins } from './plugins';
import { classes, styles, isObject } from './utils';

function walkTree(
    d: NodeDeclaration | string,
    accumulator: Element,
    iteratee: (
        node: NodeDeclaration | string,
        accumulator: Element,
        index: number
    ) => Node,
    index = 0
) {
    const element = iteratee(d, accumulator, index);
    if (
        isObject(d) &&
        element instanceof Element &&
        Array.isArray((d as NodeDeclaration).children) &&
        !nativeContainers.has(element)
    ) {
        let c: ChildDeclaration | ChildFunction;
        let r: ChildDeclaration | ChildDeclaration[];
        let declarations: ChildDeclaration[] = [];
        let children = (d as NodeDeclaration).children;
        for (let i = 0; i < children.length; i++) {
            c = children[i];
            if (typeof c === 'function') {
                r = c(element);
                if (Array.isArray(r)) {
                    declarations.push(...r);
                } else {
                    declarations.push(r);
                }
            } else {
                declarations.push(c);
            }
        }
        declarations.forEach((c, i) => walkTree(c, element, iteratee, i));

        const childNodes = element.childNodes;
        let child: Element;
        while (childNodes.length > declarations.length) {
            child = childNodes.item(childNodes.length - 1) as Element;
            if (willUnmountHandlers.has(child)) {
                willUnmountHandlers.get(child)(child);
            }
            pluginsUnmountElement.apply({ element: child, parent: element });
        }
    }
    return element;
}

const nativeContainers = new WeakMap<Element, boolean>();
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

export const pluginsCreateElement = createPlugins<{ d: NodeDeclaration, parent: Element }, Element>()
    .add(({ d, parent }) => {
        if (d.tag === 'svg') {
            return document.createElementNS(SVG_NS, 'svg');
        }
        if (parent.namespaceURI === XHTML_NS) {
            return document.createElement(d.tag);
        }
        return document.createElementNS(parent.namespaceURI, d.tag);
    });

export const pluginsMountElement = createPlugins<{ element: Element; parent: Element; next: Node; }, boolean>()
    .add(({ element, parent, next }) => {
        parent.insertBefore(element, next);
        return true;
    });

export const pluginsUnmountElement = createPlugins<{ element: Element; parent: Element; }, boolean>()
    .add(({ element, parent }) => {
        parent.removeChild(element);
        return true;
    });

export const pluginsSetAttribute = createPlugins<{ element: Element; attr: string; value: any; }, boolean>()
    .add(({ element, attr, value }) => {
        if (value == null) {
            element.removeAttribute(attr);
        } else {
            element.setAttribute(attr, String(value));
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

const elementsAttrs = new WeakMap<Element, { [attr: string]: any }>();

export function getAttrs(element: Element) {
    return elementsAttrs.get(element) || null;
}

function createNode(d: NodeDeclaration, parent: Element) {
    const element = pluginsCreateElement.apply({ d, parent });
    const elementAttrs = {};
    elementsAttrs.set(element, elementAttrs);
    Object.keys(d.attrs).forEach((attr) => {
        const value = d.attrs[attr];
        if (value == null) {
            return;
        }
        pluginsSetAttribute.apply({ element, attr, value });
        elementAttrs[attr] = value;
    });
    return element;
}

function iterate(
    d: NodeDeclaration | string,
    parentNode: Element,
    index: number
) {

    for (let i = parentNode.childNodes.length, n; i >= 0; i--) {
        n = parentNode.childNodes.item(i);
        if (n instanceof Text && !n.textContent.trim()) {
            parentNode.removeChild(n);
        }
    }

    if (typeof d === 'string') {
        if (index > 0) {
            // Todo: more than 1 text node
            throw new Error('Only one text node is supported.');
        }
        if (parentNode.textContent !== d) {
            parentNode.textContent = d;
        }
        return parentNode.firstChild;
    } else {
        d.attrs = d.attrs || {};
        d.children = d.children || [];
        const existing = parentNode.childNodes.item(index) as Element;
        let next: Node = null;
        if (!(
            existing &&
            existing instanceof Element &&
            existing.tagName.toLowerCase() === d.tag
        )) {
            // Create new node
            const node = createNode(d, parentNode);
            if (existing) {
                // Remove existing node
                if (willUnmountHandlers.has(existing)) {
                    willUnmountHandlers.get(existing)(existing);
                }
                next = existing.nextSibling;
                pluginsUnmountElement.apply({ element: existing, parent: parentNode });
            }
            pluginsMountElement.apply({ element: node, parent: parentNode, next });
            if (didMountHandlers.has(node)) {
                didMountHandlers.get(node)(node);
            }
            return node;
        }

        // Synchronize attributes
        const attrNames = Object.keys(d.attrs);
        const existingAttrs = getAttrs(existing);
        const existingAttrNames = Object.keys(existingAttrs);
        existingAttrNames.forEach((key) => {
            if (!(key in d.attrs)) {
                pluginsSetAttribute.apply({ element: existing, attr: key, value: null });
                delete existingAttrs[key];
            }
        });
        attrNames.forEach((key) => {
            const value = d.attrs[key];
            if (existingAttrs[key] !== value) {
                pluginsSetAttribute.apply({ element: existing, attr: key, value });
                existingAttrs[key] = value;
            }
        });
        if (didUpdateHandlers.has(existing)) {
            didUpdateHandlers.get(existing)(existing);
        }

        return existing;
    }
}

export function render(target: Element, declaration: NodeDeclaration | string) {
    if (!(target instanceof Element)) {
        throw new Error('Wrong rendering target');
    }
    return walkTree(declaration, target, iterate);
}
