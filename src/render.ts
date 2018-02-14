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
    return node;
}

function synchronize(d: NodeDeclaration | string, existing: Element | Text) {
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
    }
}

function removeNode(node: Node, parent: Element) {
    if (node instanceof Element && willUnmountHandlers.has(node)) {
        willUnmountHandlers.get(node)(node);
    }
    pluginsUnmountNode.apply({ node, parent });
}

function removeEmptyTextChildren(element: Element) {
    let n: Node;
    while ((n = element.firstChild) && n instanceof Text && !n.textContent.trim()) {
        element.removeChild(n);
    }
    for (let i = element.childNodes.length - 1; i > 0; i--) {
        n = element.childNodes.item(i);
        if (n instanceof Text && n.textContent === '') {
            element.removeChild(n);
        }
    }
}

function iterate(
    d: NodeDeclaration | string,
    parent: Element,
    index: number
) {
    const existing = parent.childNodes.item(index) as Element | Text;
    const thereIsExisting = Boolean(existing);

    if (thereIsExisting && (
        (typeof d === 'string' && existing instanceof Text) ||
        (typeof d === 'object' && existing instanceof Element && existing.tagName.toLowerCase() === d.tag)
    )) {
        synchronize(d, existing);
        return existing;
    }

    let next: Node = null;
    if (thereIsExisting) {
        next = existing.nextSibling;
        removeNode(existing, parent);
    }
    return createNode(d, parent, next);
}

function isEmpty(d: NodeDeclaration | string) {
    return d == null || d === '';
}

function walkTree(
    d: NodeDeclaration | string,
    parent: Element,
    iteratee: (
        node: NodeDeclaration | string,
        accumulator: Element,
        index: number
    ) => Node,
    index = 0
) {
    removeEmptyTextChildren(parent);

    const element = iteratee(d, parent, index);
    if (
        isObject(d) &&
        element instanceof Element &&
        !nativeContainers.has(element)
    ) {
        let c: ChildDeclaration | ChildFunction;
        let r: ChildDeclaration | ChildDeclaration[];
        let declarations: ChildDeclaration[] = [];
        let children = (d as NodeDeclaration).children ? flatten((d as NodeDeclaration).children) : [];
        for (let i = 0; i < children.length; i++) {
            c = children[i];
            if (typeof c === 'function') {
                r = c(element) as any;
                if (Array.isArray(r)) {
                    declarations.push(...flatten(r).filter(x => !isEmpty(x)));
                } else if (!isEmpty(r)) {
                    declarations.push(r);
                }
            } else if (!isEmpty(c)) {
                declarations.push(c);
            }
        }
        declarations.forEach((c, i) => walkTree(c, element, iteratee, i));

        const childNodes = element.childNodes;
        let child: Element;
        while (childNodes.length > declarations.length) {
            child = childNodes.item(childNodes.length - 1) as Element;
            removeNode(child, element);
        }
    }
    return element;
}

export function render(target: Element, declaration: NodeDeclaration | string) {
    if (!(target instanceof Element)) {
        throw new Error('Wrong rendering target');
    }
    return walkTree(declaration, target, iterate);
}
