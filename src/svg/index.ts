import { SVG_TAGS, VOID_TAGS } from './tags';
import malevic from '../../index';

const SVG_NS = 'http://www.w3.org/2000/svg';

export default function svgPlugin(lib: typeof malevic) {
    lib.plugins.render.createElement.add((d) => {
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

    lib.plugins.static.isVoidTag.add((tag) => {
        return tag in VOID_TAGS ? true : null;
    });
}
