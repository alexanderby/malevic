import {RecursiveArray} from '../defs';

export function isObject(value): value is {[prop: string]: any} {
    return value != null && typeof value === 'object';
}

export function flatten<T>(arr: RecursiveArray<T>): T[] {
    return arr.reduce<T[]>((flat: T[], a: T | RecursiveArray<T>) => {
        if (Array.isArray(a)) {
            flat.push(...flatten(a));
        } else {
            flat.push(a);
        }
        return flat;
    }, [] as T[]);
}
