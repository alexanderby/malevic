import { setData } from './data';
import { addListener, removeListener } from './events';
import { NodeDeclaration } from './defs';
import { createPlugins } from './plugins';

function walkTree(
    node: NodeDeclaration | string,
    accumulator: Element,
    iteratee: (
        node: NodeDeclaration | string,
        accumulator: Element,
        index: number,
        siblings: (NodeDeclaration | string)[]
    ) => Element,
    index = 0,
    siblings = [node]
) {
    const result = iteratee(node, accumulator, index, siblings);
    if (
        typeof node === 'object' &&
        node !== null &&
        Array.isArray(node.children)
    ) {
        if ('native' in node.attrs) {
            return;
        }
        node.children.forEach((c, i) => walkTree(c, result, iteratee, i, node.children));
    }
}

export const pluginsCreateElement = createPlugins<NodeDeclaration, Element>();
pluginsCreateElement.add((d) => document.createElement(d.tag));

export const pluginsSetAttribute = createPlugins<{ element: Element; attr: string; value: any; }, boolean>();
pluginsSetAttribute
    .add(({ element, attr, value }) => {
        if (value == null) {
            element.removeAttribute(attr);
        } else {
            element.setAttribute(attr, String(value));
        }
        return true;
    })
    .add(({ attr, value }) => {
        if (attr === 'native' && value === true) {
            return true;
        }
        return null;
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
        if (attr === 'data') {
            setData(element, value);
            return true;
        }
        return null;
    });

const elementsAttrs = new WeakMap<Element, { [attr: string]: any }>();

export function getAttrs(element: Element) {
    return elementsAttrs.get(element) || null;
}

function createNode(d: NodeDeclaration) {
    const element = pluginsCreateElement.apply(d);
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
    index: number,
    siblings: (NodeDeclaration | string)[]
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
            throw new Error('Only one text node is possible.');
        }
        if (parentNode.textContent !== d) {
            parentNode.textContent = d;
        }
        return null;
    } else {
        d.attrs = d.attrs || {};
        d.children = d.children || [];
        const existing = parentNode.childNodes.item(index) as Element;
        if (!(
            existing &&
            existing instanceof Element &&
            existing.tagName.toLowerCase() === d.tag
        )) {
            // Create new node
            const node = createNode(d);
            if (existing) {
                parentNode.replaceChild(node, existing);
            } else {
                parentNode.appendChild(node);
            }
            return node;
        }

        // Synchronize attributes
        const attrNames = Object.keys(d.attrs);
        const existingAttrs = getAttrs(existing);
        const existingAttrNames = Object.keys(existingAttrs);
        existingAttrNames.forEach((key) => {
            if (!(key in d.attrs)) {
                pluginsSetAttribute.apply({ element: null, attr: key, value: null });
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

        // Remove overflown nodes
        const childNodes = existing.childNodes;
        while (childNodes.length > d.children.length) {
            existing.removeChild(childNodes.item(childNodes.length - 1));
        }

        return existing;
    }
}

export function render(target: Element, declaration: NodeDeclaration | string) {
    if (!(target instanceof Element)) {
        throw new Error('Wrong rendering target');
    }
    walkTree(declaration, target, iterate);
}
