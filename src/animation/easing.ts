function cubicBezier(t: number, p: [number, number, number, number]) {
    const q = 1 - t;
    return (
        p[0] * q ** 3 +
        3 * p[1] * q ** 2 * t +
        3 * p[2] * q * t ** 2 +
        p[3] * t ** 3
    );
}

export function createEasingFunction(p: [number, number, number, number]) {
    return (t: number) => cubicBezier(t, p);
}

export const easings = {
    linear: (t: number) => t,
    ease: createEasingFunction([0, 1 / 8, 1, 1]),
    'ease-in': createEasingFunction([0, 0, 1 / 2, 1]),
    'ease-out': createEasingFunction([0, 1 / 2, 1, 1]),
    'ease-in-out': createEasingFunction([0, 1 / 2, 1, 1]),
};
