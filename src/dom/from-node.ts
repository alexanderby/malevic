import {NodeSpec} from '../defs';
import {m} from '../spec';

export function specFromNode(node: Node): NodeSpec {
    return walkNode(node) as NodeSpec;
}

function walkNode(node: Node): NodeSpec | string | null {
    if (node instanceof Text) {
        const text = node.textContent.trim();
        return text ?? null;
    }
    if (!(node instanceof Element)) {
        return null;
    }
    const tag = node.tagName.toLocaleLowerCase();
    const attrs: Record<string, string | number | boolean> = {};
    const simpleTypes = ['string', 'number', 'boolean'];
    for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        const value = simpleTypes.includes(typeof attr.value) ? attr.value : String(attr.value);
        attrs[attr.name] = value;
    }
    const children = Array.from(node.childNodes)
        .map(walkNode)
        .filter(Boolean);
    return m(tag, attrs, children);
}
