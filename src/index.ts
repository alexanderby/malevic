export { html } from './html';
export { render, getAttrs } from './render';
export { classes } from './classes';
export { getData } from './data';
export { renderToString } from './static';

import { pluginsCreateElement, pluginsSetAttribute } from './render';
import { pluginsIsVoidTag, pluginsSkipAttr, pluginsStringifyAttr, pluginsProcessText } from './static';

export const plugins = {
    render: {
        createElement: pluginsCreateElement,
        setAttribute: pluginsSetAttribute
    },
    static: {
        isVoidTag: pluginsIsVoidTag,
        skipAttr: pluginsSkipAttr,
        stringifyAttr: pluginsStringifyAttr,
        processText: pluginsProcessText
    }
};
