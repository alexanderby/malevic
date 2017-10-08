export { html } from './html';
export { render, getAttrs } from './render';
export { classes, styles } from './utils';
export { getData } from './data';
export { renderToString, escapeHtml } from './static';

import {
    pluginsCreateElement,
    pluginsMountElement,
    pluginsSetAttribute,
    pluginsUnmountElement,
} from './render';
import {
    pluginsIsVoidTag,
    pluginsProcessText,
    pluginsSkipAttr,
    pluginsStringifyAttr,
} from './static';

export const plugins = {
    render: {
        createElement: pluginsCreateElement,
        mountElement: pluginsMountElement,
        setAttribute: pluginsSetAttribute,
        unmountElement: pluginsUnmountElement,
    },
    static: {
        isVoidTag: pluginsIsVoidTag,
        processText: pluginsProcessText,
        skipAttr: pluginsSkipAttr,
        stringifyAttr: pluginsStringifyAttr,
    }
};
