export { html } from './html';
export { render, getAttrs } from './render';
export { classes, styles } from './utils';
export { getData } from './data';
export { renderToString, escapeHtml } from './static';

import {
    pluginsCreateNode,
    pluginsMountNode,
    pluginsSetAttribute,
    pluginsUnmountNode,
} from './render';
import {
    pluginsIsVoidTag,
    pluginsProcessText,
    pluginsSkipAttr,
    pluginsStringifyAttr,
} from './static';

export const plugins = {
    render: {
        createNode: pluginsCreateNode,
        mountNode: pluginsMountNode,
        setAttribute: pluginsSetAttribute,
        unmountNode: pluginsUnmountNode,
    },
    static: {
        isVoidTag: pluginsIsVoidTag,
        processText: pluginsProcessText,
        skipAttr: pluginsSkipAttr,
        stringifyAttr: pluginsStringifyAttr,
    }
};

// export * from './defs';
