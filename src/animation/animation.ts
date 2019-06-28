import {last} from '../utils/misc';
import {AnimationSpec, TransitionSpec} from './defs';
import {easings} from './easing';

interface Interval<T> {
    standby: number;
    start: number;
    end: number;
    spec: TransitionSpec<T>;
    interpolate: (t: number) => T;
}

let counter = 0;

export class Animation<T = any, R = any> {
    id = ++counter;
    private timeline: Interval<T>[];
    private interpolate: (a: T, b: T) => (t: number) => T;
    private output: (value: T) => R;
    private lastValue: any;
    private startTime: number;
    private isComplete: boolean;
    private callback: (output: R) => void;

    constructor(spec: AnimationSpec<T, R>, callback: (output: R) => void) {
        if (!spec.interpolate) {
            throw new Error('No interpolator provided');
        }

        this.interpolate = spec.interpolate;
        this.output = spec.output;
        this.callback = callback;

        let total = 0;
        this.timeline = spec.timeline.map((spec) => {
            const standby = total;
            const start = standby + spec.timing.delay;
            const end = start + spec.timing.duration;
            total = end;
            return {standby, start, end, spec, interpolate: null};
        });

        this.isComplete = false;
    }

    tick(time: number) {
        if (this.startTime == null) {
            this.startTime = time;
        }

        const duration = time - this.startTime;
        const {timeline} = this;
        const interval = timeline.find(
            ({standby, end}, i) =>
                i === timeline.length - 1 ||
                (duration >= standby && duration <= end),
        );

        const {start, end, spec} = interval;
        if (!interval.interpolate) {
            interval.interpolate = this.interpolate(spec.from, spec.to);
        }

        const ease =
            typeof spec.timing.easing === 'string'
                ? easings[spec.timing.easing]
                : spec.timing.easing;

        const t = Math.min(1, (duration - start) / (end - start));
        const eased = ease(t);
        const value = interval.interpolate.call(null, eased);

        this.lastValue = value;
        if (interval === last(timeline) && duration >= end) {
            this.isComplete = true;
        }

        const output = this.output.call(null, value);
        this.callback.call(null, output);
    }

    value() {
        return this.lastValue;
    }

    complete() {
        return this.isComplete;
    }
}
