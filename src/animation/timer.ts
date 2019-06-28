export function createTimer() {
    let currentTime: number = null;
    let frameId: number = null;
    let isRunning = false;
    const callbacks: ((time: number) => void)[] = [];

    function work(time: number) {
        currentTime = time;
        callbacks.forEach((cb) => cb(currentTime));
        if (!isRunning) {
            frameId = requestAnimationFrame(work);
        }
    }

    function run() {
        if (!isRunning) {
            work(performance.now());
        }
    }

    function stop() {
        if (frameId != null) {
            cancelAnimationFrame(frameId);
            frameId = null;
        }
        currentTime = null;
        isRunning = false;
    }

    function tick(callback: (time: number) => void) {
        callbacks.push(callback);
    }

    function time() {
        return currentTime;
    }

    function running() {
        return isRunning;
    }

    return {
        run,
        stop,
        tick,
        time,
        running,
    };
}
