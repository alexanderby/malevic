export { html } from './src/html';
export { render, getAttrs } from './src/render';
export { classes } from './src/classes';
export { getData } from './src/data';
export { renderToStaticMarkup } from './src/static';

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
