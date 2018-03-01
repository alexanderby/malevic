import {RecursiveArray, ChildDeclaration, ChildFunction} from './defs';

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

export function toArray<T>(obj: ArrayLike<T>): T[] {
    return Array.prototype.slice.call(obj);
}

export function flatten<T>(arr: RecursiveArray<T>) {
    return arr.reduce((flat: T[], toFlatten) => {
        return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
    }, []);
}

function isEmptyDeclaration(d: ChildDeclaration) {
    return d == null || d === '';
}

export function flattenDeclarations(declarations: RecursiveArray<ChildDeclaration | ChildFunction>, funcExecutor: (fn: ChildFunction) => ChildDeclaration | RecursiveArray<ChildDeclaration>): ChildDeclaration[] {
    const results: ChildDeclaration[] = [];
    flatten(declarations)
        .forEach((c) => {
            if (typeof c === 'function') {
                const r = funcExecutor(c);
                if (Array.isArray(r)) {
                    results.push(...(flatten(r) as ChildDeclaration[]).filter(x => !isEmptyDeclaration(x)));
                } else if (!isEmptyDeclaration(r)) {
                    results.push(r);
                }
            } else if (!isEmptyDeclaration(c)) {
                results.push(c);
            }
        });
    return results;
}
