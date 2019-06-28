export interface TimingSpec {
    delay: number;
    duration: number;
    easing:
        | 'linear'
        | 'ease'
        | 'ease-in'
        | 'ease-out'
        | 'ease-in-out'
        | ((t: number) => number);
}

export interface TransitionSpec<T = any> {
    from: T;
    to: T;
    timing: TimingSpec;
}

export interface AnimationSpec<T = any, R = any> {
    initial: T;
    timeline: TransitionSpec[];
    interpolate: (a: T, b: T) => (t: number) => T;
    output: (value: T) => R;
}
