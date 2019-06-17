import {Child, Spec, NodeSpec, ComponentSpec, RecursiveArray} from './defs';

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

export function isObject(value): value is {[prop: string]: any} {
    return value != null && typeof value === 'object';
}

export function isSpec(x: any): x is Spec {
    return isObject(x) && x.type != null;
}

export function isNodeSpec(x: any): x is NodeSpec {
    return isSpec(x) && typeof x.type === 'string';
}

export function isComponentSpec(x: any): x is ComponentSpec {
    return isSpec(x) && typeof x.type === 'function';
}

export function isEmptyDeclaration(d: Child) {
    return d == null || d === '';
}

export function filterChildren(declarations: Child[]): Child[] {
    return declarations.filter((c) => !isEmptyDeclaration(c));
}

function unbox(d: ComponentSpec) {
    const component = d.type;
    // Note: When there are no attributes, JSX produces `null`
    // and it prevents from assigning default value
    const props = d.props == null ? undefined : d.props;
    const children = d.children;
    return component(props, ...children);
}

export function deepUnbox(d: Spec) {
    let r = d as any;
    while (typeof r.type === 'function') {
        r = unbox(r as ComponentSpec);
    }
    return r as NodeSpec | Node | string;
}

export function flatten<T>(arr: RecursiveArray<T>) {
    return arr.reduce((flat: T[], toFlatten) => {
        return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
    }, []);
}
