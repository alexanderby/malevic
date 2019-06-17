export {render, sync, getAttrs, getDOMNode, getParentDOMNode} from './render';
export {m} from './spec';
export {classes, styles} from './utils';
export {getData} from './data';
export {renderToString, escapeHtml} from './static';

import {
    pluginsCreateNode,
    pluginsMatchNodes,
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
        matchNodes: pluginsMatchNodes,
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
