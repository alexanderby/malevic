import {Child, Declaration, NodeDeclaration, ComponentDeclaration} from './defs';

export function classes(
    ...args: Array<string | {[cls: string]: boolean}>
) {
    const classes = [];
    args.filter((c) => Boolean(c))
        .forEach((c) => {
            if (typeof c === 'string') {
                classes.push(c);
            } else if (typeof c === 'object') {
                classes.push(
                    ...Object.keys(c)
                        .filter((key) => Boolean(c[key]))
                );
            }
        });
    return classes.join(' ');
}

export function styles(declarations: {[cssProp: string]: string}) {
    return Object.keys(declarations)
        .filter((cssProp) => declarations[cssProp] != null)
        .map((cssProp) => `${cssProp}: ${declarations[cssProp]};`)
        .join(' ');
}

export function isObject(value) {
    return typeof value === 'object' && value != null;
}

export function isEmptyDeclaration(d: Child) {
    return d == null || d === '';
}

export function filterChildren(declarations: Child[]): Child[] {
    return declarations.filter((c) => !isEmptyDeclaration(c));
}

function unbox(d: ComponentDeclaration) {
    const component = d.type;
    // Note: When there are no attributes, JSX produces `null`
    // and it prevents from assigning default value
    const props = d.attrs == null ? undefined : d.attrs;
    const children = d.children;
    return component(props, ...children);
}

export function deepUnbox(d: Declaration) {
    let r = d;
    while (typeof r.type === 'function') {
        r = unbox(r as ComponentDeclaration);
    }
    return r as NodeDeclaration;
}
