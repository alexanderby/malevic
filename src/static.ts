import { NodeDeclaration } from './defs';
import { createPlugins } from './plugins';
import { classes, styles, isObject } from './utils';

export const pluginsIsVoidTag = createPlugins<string, boolean>()
    .add((tag) => tag in VOID_TAGS);

export const pluginsSkipAttr = createPlugins<{ attr: string; value: any; }, boolean>()
    .add(({ value }) => value == null)
    .add(({ attr }) => (
        [
            'data',
            'native',
            'didmount',
            'didupdate',
            'willunmount',
        ].indexOf(attr) >= 0 ||
        attr.indexOf('on') === 0
    ));

export function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export const pluginsStringifyAttr = createPlugins<{ attr: string; value: any; }, string>()
    .add(({ value }) => value === false ? '' : escapeHtml(value))
    .add(({ attr, value }) => {
        if (attr === 'class' && isObject(value)) {
            let cls: string;
            if (Array.isArray(value)) {
                cls = classes(...value);
            } else {
                cls = classes(value);
            }
            return escapeHtml(cls);
        }
    })
    .add(({ attr, value }) => {
        if (attr === 'style' && isObject(value)) {
            return escapeHtml(styles(value));
        }
    });

export const pluginsProcessText = createPlugins<string, string>()
    .add((text) => escapeHtml(text));

export function renderToString(declaration: NodeDeclaration) {

    function buildHtml(d: NodeDeclaration, tabs: string) {
        const tag = d.tag;
        const attrs = d.attrs == null ? '' : Object.keys(d.attrs)
            .filter((key) => !pluginsSkipAttr.apply({ attr: key, value: d.attrs[key] }))
            .map((key) => {
                const value = pluginsStringifyAttr.apply({ attr: key, value: d.attrs[key] });
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
        d.children.forEach((c) => {
            if (typeof c === 'string') {
                htmlText += pluginsProcessText.apply(c);
            } else if (typeof c !== 'function') {
                shouldIndentClosingTag = true;
                htmlText += `\n${buildHtml(c, `${tabs}    `)}`;
            }
        });
        if (shouldIndentClosingTag) {
            htmlText += `\n${tabs}`;
        }
        htmlText += `</${d.tag}>`;

        return htmlText;
    }

    return buildHtml(declaration, '');
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
