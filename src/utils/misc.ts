export function isObject(value): value is {[prop: string]: any} {
    return value != null && typeof value === 'object';
}

export function isPlainObject(value: any) {
    return isObject(value) && Object.getPrototypeOf(value) === Object.prototype;
}

export function last<T>(items: T[], index = 0) {
    const target = items.length - 1 - index;
    return items[target];
}
