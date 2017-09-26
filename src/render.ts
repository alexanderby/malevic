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
pluginsSetAttribute.add(({ element, attr, value }) => {
    if (value == null) {
        element.removeAttribute(attr);
    } else {
        element.setAttribute(attr, String(value));
    }
    return true;
});

const elementsAttrs = new WeakMap<Element, { [attr: string]: any }>();

export function getAttrs(element: Element) {
    return elementsAttrs.get(element) || null;
}

function createNode(d: NodeDeclaration) {
    const node = pluginsCreateElement.apply(d);
    const nodeAttrs = {};
    elementsAttrs.set(node, nodeAttrs);
    Object.keys(d.attrs).forEach(key => {
        const value = d.attrs[key];
        if (value == null) {
            return;
        }
        if (key === 'data') {
            setData(node, value);
        } else if (key.indexOf('on') === 0 && typeof value === 'function') {
            addListener(node, key.substring(2), value);
        } else if (key !== 'native') {
            pluginsSetAttribute.apply({ element: node, attr: key, value });
            nodeAttrs[key] = value;
        }
    });
    return node;
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
            if (key === 'data') {
                setData(existing, value);
            } else if (key.indexOf('on') === 0) {
                if (typeof value === 'function') {
                    addListener(existing, key.substring(2), value);
                } else {
                    removeListener(existing, key.substring(2), value);
                }
            } else if (key !== 'native') {
                if (existingAttrs[key] !== value) {
                    pluginsSetAttribute.apply({ element: existing, attr: key, value });
                    existingAttrNames[key] = value;
                }
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
    walkTree(declaration, target, iterate);
}
