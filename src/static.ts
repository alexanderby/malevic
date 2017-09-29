import { NodeDeclaration } from './defs';
import { createPlugins } from './plugins';

export const pluginsIsVoidTag = createPlugins<string, boolean>();
pluginsIsVoidTag.add((tag) => tag in VOID_TAGS);

export const pluginsSkipAttr = createPlugins<string, boolean>();
pluginsSkipAttr.add((attr) => (
    attr === 'data' ||
    attr === 'native' ||
    attr.indexOf('on') === 0
));

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export const pluginsStringifyAttr = createPlugins<{ attr: string; value: any; }, string>();
pluginsStringifyAttr.add(({ value }) => escapeHtml(value));

export const pluginsProcessText = createPlugins<string, string>();
pluginsProcessText.add((text) => escapeHtml(text));

export function renderToString(declaration: NodeDeclaration) {

    function buildHtml(d: NodeDeclaration, tabs: string) {
        const tag = d.tag;
        const attrs = Object.keys(d.attrs)
            .filter((key) => pluginsSkipAttr.apply(key))
            .map((key) => {
                const value = pluginsStringifyAttr.apply({ attr: key, value: d.attrs[key] });
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
            } else {
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
].reduce((map, tag) => (map[tag] = true, map), {});
