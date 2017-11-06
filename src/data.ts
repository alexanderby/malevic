const dataBindings = new WeakMap<Element, any>();

export function setData(element: Element, data: any) {
    dataBindings.set(element, data);
}

export function getData(element: Element) {
    return dataBindings.get(element);
}
