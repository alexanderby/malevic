import { NodeDeclaration } from './defs';
import { createPlugins } from './plugins';

export const pluginsIsVoidTag = createPlugins<string, boolean>();
pluginsIsVoidTag.add((tag) => tag in VOID_TAGS);

export function renderToString(declaration: NodeDeclaration) {

    function buildHtml(d: NodeDeclaration, tabs: string) {
        const tag = d.tag;
        const attrs = Object.keys(d.attrs)
            .filter(key => (
                (typeof d.attrs[key] === 'string') &&
                (key.indexOf('on') !== 0)
            ))
            .map(key => ` ${key}="${d.attrs[key]}"`).join('');

        const isVoidTag = pluginsIsVoidTag.apply(tag);
        if (isVoidTag) {
            return `${tabs}<${tag}${attrs}/>`;
        }

        let htmlText = `${tabs}<${tag}${attrs}>`;
        let shouldIndentClosingTag = false;
        d.children.forEach(c => {
            if (typeof c === 'string') {
                htmlText += c;
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
