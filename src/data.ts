const dataBindings = new WeakMap<Element, any>();

export function setData(node: Element, data: any) {
    dataBindings.set(node, data);
}

export function getData(node: Element) {
    return dataBindings.get(node);
}
