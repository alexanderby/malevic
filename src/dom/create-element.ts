import {NodeSpec} from '../defs';
import {createPluginsStore} from '../plugins';
import {XHTML_NS, SVG_NS} from './namespace';

export interface PluginCreateElementProps {
    spec: NodeSpec;
    parent: Element;
}

export const PLUGINS_CREATE_ELEMENT = Symbol();

export const pluginsCreateElement = createPluginsStore<
    PluginCreateElementProps,
    Element
>();

export function createElement(spec: NodeSpec, parent: Element) {
    const result = pluginsCreateElement.apply({spec, parent});
    if (result) {
        return result;
    }

    const tag = spec.type;
    if (tag === 'svg') {
        return document.createElementNS(SVG_NS, 'svg');
    }

    const namespace = parent.namespaceURI;
    if (namespace === XHTML_NS || namespace == null) {
        return document.createElement(tag);
    }

    return document.createElementNS(namespace, tag);
}
