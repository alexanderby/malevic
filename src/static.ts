import {createPlugins} from './plugins';
import {classes, isObject, styles, filterChildren, deepUnbox} from './utils';
import {Declaration, NodeDeclaration} from './defs';

export const pluginsIsVoidTag = createPlugins<string, boolean>()
    .add((tag) => tag in VOID_TAGS);

export const pluginsSkipAttr = createPlugins<{attr: string; value: any;}, boolean>()
    .add(({value}) => (value == null || value === false))
    .add(({attr}) => ((
        [
            'data',
            'native',
            'didmount',
            'didupdate',
            'willunmount',
        ].indexOf(attr) >= 0 ||
        attr.indexOf('on') === 0
    ) ? true : null));

export function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export const pluginsStringifyAttr = createPlugins<{attr: string; value: any;}, string>()
    .add(({value}) => value === true ? '' : escapeHtml(value))
    .add(({attr, value}) => {
        if (attr === 'class' && isObject(value)) {
            let cls: string;
            if (Array.isArray(value)) {
                cls = classes(...value);
            } else {
                cls = classes(value);
            }
            return escapeHtml(cls);
        }
        return null;
    })
    .add(({attr, value}) => {
        if (attr === 'style' && isObject(value)) {
            return escapeHtml(styles(value));
        }
        return null;
    });

export const pluginsProcessText = createPlugins<string, string>()
    .add((text) => escapeHtml(text));

function buildHtml(c: Declaration, tabs: string) {
    let d: NodeDeclaration;
    try {
        d = deepUnbox(c);
    } catch (err) {
        return '<!--m-->';
    }
    const tag = d.type;
    const attrs = d.attrs == null ? '' : Object.keys(d.attrs)
        .filter((key) => !pluginsSkipAttr.apply({attr: key, value: d.attrs[key]}))
        .map((key) => {
            const value = pluginsStringifyAttr.apply({attr: key, value: d.attrs[key]});
            if (value === '') {
                return ` ${key}`;
            }
            return ` ${key}="${value}"`;
        })
        .join('');

    const isVoidTag = pluginsIsVoidTag.apply(tag);
    if (isVoidTag) {
        return `${tabs}<${tag}${attrs}/>`;
    }

    let htmlText = `${tabs}<${tag}${attrs}>`;
    let shouldIndentClosingTag = false;
    filterChildren(d.children)
        .forEach((c) => {
            if (isObject(c)) {
                shouldIndentClosingTag = true;
                htmlText += `\n${buildHtml(c as Declaration, `${tabs}    `)}`;
            } else {
                htmlText += pluginsProcessText.apply(c as string);
            }
        });
    if (shouldIndentClosingTag) {
        htmlText += `\n${tabs}`;
    }
    htmlText += `</${d.type}>`;

    return htmlText;
}

export function renderToString(declaration: Declaration) {
    if (isObject(declaration)) {
        return buildHtml(declaration, '');
    }
    return pluginsProcessText.apply(declaration as any);
}

export const VOID_TAGS = [
    'area',
    'base',
    'basefont',
    'bgsound',
    'br',
    'col',
    'command',
    'embed',
    'frame',
    'hr',
    'img',
    'image',
    'input',
    'isindex',
    'keygen',
    'link',
    'menuitem',
    'meta',
    'nextid',
    'param',
    'source',
    'track',
    'wbr',

    'circle',
    'ellipse',
    'image',
    'line',
    'path',
    'polygon',
    'rect',
].reduce((map, tag) => (map[tag] = true, map), {});
