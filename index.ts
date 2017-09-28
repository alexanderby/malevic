export { html } from './src/html';
export { render, getAttrs } from './src/render';
export { classes } from './src/classes';
export { getData } from './src/data';
export { renderToString } from './src/static';

import { pluginsCreateElement, pluginsSetAttribute } from './src/render';
import { pluginsIsVoidTag } from './src/static';

export const plugins = {
    render: {
        createElement: pluginsCreateElement,
        setAttribute: pluginsSetAttribute
    },
    static: {
        isVoidTag: pluginsIsVoidTag
    }
};

import { html } from './src/html';
import { render, getAttrs } from './src/render';
import { classes } from './src/classes';
import { getData } from './src/data';
import { renderToString } from './src/static';

export default {
    html,
    render,
    getAttrs,
    classes,
    getData,
    renderToString,
    plugins
};
