import {NodeSpec} from '../defs';
import {m} from '../spec';
import {XHTML_NS} from './namespace';

export function specFromNode(node: Node): NodeSpec {
    return walkNode(node) as NodeSpec;
}

function walkNode(node: Node): NodeSpec | string | null {
    if (node instanceof Text) {
        return node.textContent
            .trim()
            .replaceAll(/\r/g, '')
            .replaceAll(/\s*?\n\s*/g, '\n');
    }
    if (!(node instanceof Element)) {
        return null;
    }
    const tag =
        node.namespaceURI === XHTML_NS
            ? node.tagName.toLocaleLowerCase()
            : node.tagName;
    const attrs: Record<string, string | number | boolean> = {};
    for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        attrs[attr.name] = String(attr.value);
    }
    const children = Array.from(node.childNodes)
        .map(walkNode)
        .filter(
            (c) =>
                c === null ||
                (typeof c === 'string' && c !== '') ||
                typeof c === 'object',
        );
    return m(tag, attrs, ...children);
}
