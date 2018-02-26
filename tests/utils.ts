export function dispatchClick(el: Element) {
    el.dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    }));
}
