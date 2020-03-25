export function dispatchClick(el: Element) {
    el.dispatchEvent(
        new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
        }),
    );
}

export function createAnimationSemaphore() {
    const callbacks = new Map<number, Function>();
    let counter = 0;
    let time = 0;

    const nativeRAF = self.requestAnimationFrame;
    const nativeCAF = self.cancelAnimationFrame;
    const nativePN = performance.now;

    const semaphore = {
        init($time: number) {
            self.requestAnimationFrame = semaphore.addCallback;
            self.cancelAnimationFrame = semaphore.removeCallback;
            performance.now = semaphore.time;
            callbacks.clear();
            time = $time;
        },
        time() {
            return time;
        },
        tick($time: number) {
            time = $time;
            const queue = Array.from(callbacks.values());
            callbacks.clear();
            queue.forEach((cb) => cb(time));
        },
        addCallback(cb: Function) {
            const id = ++counter;
            callbacks.set(id, cb);
            return id;
        },
        removeCallback(id: number) {
            callbacks.delete(id);
        },
        reset() {
            self.requestAnimationFrame = nativeRAF;
            self.cancelAnimationFrame = nativeCAF;
            performance.now = nativePN;
            callbacks.clear();
            time = 0;
        },
    };

    return semaphore;
}
