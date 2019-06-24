import {NodeSpec, Child, RecursiveArray, ComponentSpec} from '../defs';
import {addComponentPlugins, deleteComponentPlugins, PluginsStore} from '../plugins';
import {isNodeSpec, isComponentSpec} from '../spec';
import {stringifyAttribute, pluginsStringifyAttribute, PLUGINS_STRINGIFY_ATTRIBUTE} from './attr';
import {escapeHTML} from './escape';
import {shouldSkipAttribute, pluginsSkipAttribute, PLUGINS_SKIP_ATTRIBUTE} from './skip-attr';
import {processText} from './text';
import {isVoidTag, pluginsIsVoidTag, PLUGINS_IS_VOID_TAG} from './void';

interface ComponentStringContext {
}

let currentContext: ComponentStringContext = null;

export function getStringifyContext() {
    return currentContext;
}

function unbox(spec: ComponentSpec) {
    const Component = spec.type;
    const {props, children} = spec;

    const prevContext = currentContext;
    currentContext = {};
    const result = Component(props, ...children);
    currentContext = prevContext;

    return result;
}

const stringifyPlugins = [
    [PLUGINS_STRINGIFY_ATTRIBUTE, pluginsStringifyAttribute],
    [PLUGINS_SKIP_ATTRIBUTE, pluginsSkipAttribute],
    [PLUGINS_IS_VOID_TAG, pluginsIsVoidTag],
] as [symbol, PluginsStore<any>][];

export interface StringifyOptions {
    indent: string;
    depth: number;
}

abstract class VNode {
    abstract stringify(options: StringifyOptions): string;
}

function leftPad(indent: string, repeats: number) {
    return ''.padEnd(indent.length * repeats, indent);
}

class VElement extends VNode {
    tag: string;
    attrs: Map<string, string>;
    children: VNode[];
    isVoid: boolean;

    constructor(spec: NodeSpec) {
        super();
        this.children = [];
        this.tag = spec.type;
        this.attrs = new Map();
        Object.entries(spec.props)
            .filter(([attr, value]) => !shouldSkipAttribute(attr, value))
            .forEach(([attr, value]) => this.attrs.set(attr, stringifyAttribute(attr, value)));
        this.isVoid = isVoidTag(this.tag);
    }

    stringify({indent, depth}: StringifyOptions) {
        const lines: string[] = [];

        const left = leftPad(indent, depth);
        const attrs = Array.from(this.attrs.entries())
            .map(([attr, value]) => value === '' ? attr : `${attr}="${value}"`)
            .join(' ');
        const open = `${left}<${this.tag}${attrs ? ` ${attrs}` : ''}>`;

        if (this.isVoid) {
            lines.push(open);
        } else {
            const close = `</${this.tag}>`;
            if (this.children.length === 0) {
                lines.push(`${open}${close}`);
            } else if (
                this.children.length === 1 &&
                this.children[0] instanceof VText &&
                !(this.children[0] as VText).text.includes('\n')
            ) {
                lines.push(`${open}${this.children[0].stringify({indent, depth: 0})}${close}`);
            } else {
                lines.push(open);
                this.children.forEach((child) => lines.push(child.stringify({indent, depth: depth + 1})));
                lines.push(`${left}${close}`);
            }
        }

        return lines.join('\n');
    }
}

class VText extends VNode {
    text: string;

    constructor(text: string) {
        super();
        this.text = processText(text);
    }

    stringify({indent, depth}: StringifyOptions) {
        const left = leftPad(indent, depth);
        return `${left}${this.text.replace(/\n/g, `\n${left}`)}`;
    }
}

class VComment extends VNode {
    text: string;

    constructor(text: string) {
        super();
        this.text = escapeHTML(text);
    }

    stringify({indent, depth}: StringifyOptions) {
        return `${leftPad(indent, depth)}<!--${this.text}-->`;
    }
}

function addVNodes(spec: Child | RecursiveArray<Child>, parent: VElement) {
    if (isNodeSpec(spec)) {
        const vnode = new VElement(spec);
        parent.children.push(vnode);
        spec.children.forEach((s) => addVNodes(s, vnode));
    } else if (isComponentSpec(spec)) {
        if (spec.type === Array) {
            spec.children.forEach((s) => addVNodes(s, parent));
        } else {
            addComponentPlugins(spec.type, stringifyPlugins);
            const result = unbox(spec);
            addVNodes(result, parent);
            deleteComponentPlugins(spec.type, stringifyPlugins);
        }
    } else if (typeof spec === 'string') {
        const vnode = new VText(spec);
        parent.children.push(vnode);
    } else if (spec == null) {
        const vnode = new VComment('');
        parent.children.push(vnode);
    } else if (Array.isArray(spec)) {
        spec.forEach((s) => addVNodes(s, parent));
    } else {
        throw new Error('Unable to stringify spec');
    }
}

export function buildVDOM(spec: Child | RecursiveArray<Child>) {
    const root = new VElement({type: 'div', props: {}, children: []});
    addVNodes(spec, root);
    return root.children;
}
