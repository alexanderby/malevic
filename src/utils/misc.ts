export function isObject(value): value is {[prop: string]: any} {
    return value != null && typeof value === 'object';
}
