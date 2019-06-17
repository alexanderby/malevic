import {NodeSpec} from '../defs';

const XHTML_NS = 'http://www.w3.org/1999/xhtml';
const SVG_NS = 'http://www.w3.org/2000/svg';

export function createElement(spec: NodeSpec, parent: Element) {
    const tag = spec.type;
    if (tag === 'svg') {
        return document.createElementNS(SVG_NS, 'svg');
    }
    if (parent.namespaceURI === XHTML_NS) {
        return document.createElement(tag);
    }
    return document.createElementNS(parent.namespaceURI, tag);
}
