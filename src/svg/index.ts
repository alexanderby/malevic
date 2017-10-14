import { plugins } from 'malevic';
import { SVG_TAGS, VOID_TAGS } from './tags';

const SVG_NS = 'http://www.w3.org/2000/svg';

export default function withSvg() {
    plugins.render.createElement.add((d) => {
        let shouldCreateSvgElement = false;
        let tag = d.tag;
        if (tag in SVG_TAGS) {
            shouldCreateSvgElement = true;
        } else if (d.tag.indexOf('svg:') === 0) {
            shouldCreateSvgElement = true;
            tag = tag.substring(4);
        }
        if (shouldCreateSvgElement) {
            return document.createElementNS(SVG_NS, tag);
        }
        return null;
    });

    plugins.static.isVoidTag.add((tag) => {
        return tag in VOID_TAGS ? true : null;
    });
}
