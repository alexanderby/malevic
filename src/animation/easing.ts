export const easings = {
    linear: (t: number) => t,
    ease: (t: number) => {
        const t0 = (1 - Math.cos(t * Math.PI)) / 2;
        const t1 = Math.sqrt(1 - Math.pow(t - 1, 2));
        const t2 = Math.sin((t * Math.PI) / 2);
        return t0 * (1 - t2) + t1 * t2;
    },
    'ease-in': (t: number) => {
        const r = 1 - Math.cos((t * Math.PI) / 2);
        return r > 1 - 1e-15 ? 1 : r;
    },
    'ease-out': (t: number) => Math.sin((t * Math.PI) / 2),
    'ease-in-out': (t: number) => (1 - Math.cos(t * Math.PI)) / 2,
};
