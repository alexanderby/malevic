import {last} from '../utils/misc';
import {AnimationSpec, TimingSpec} from './defs';
import {interpolateNumbers, interpolateNumbersInString} from './interpolate';

function identity<T = any>(x: T): any {
    return x;
}

const defaultTiming: TimingSpec = {
    delay: 0,
    duration: 750,
    easing: 'ease',
};

export class AnimationDeclaration<T = any, R = any> {
    private $spec: AnimationSpec;

    constructor() {
        this.$spec = {
            initial: null,
            timeline: [],
            interpolate: null,
            output: identity,
        };
    }

    private last() {
        const {timeline} = this.$spec;
        return last(timeline);
    }

    initial(value: T) {
        this.$spec.initial = value;
        return this;
    }

    from(from: T) {
        if (this.$spec.timeline.length > 0) {
            throw new Error('Starting keyframe was already declared');
        }

        this.$spec.timeline.push({
            from,
            to: null,
            timing: {...defaultTiming},
        });

        return this;
    }

    to(to: T) {
        if (!this.$spec.interpolate) {
            if (typeof to === 'number') {
                this.$spec.interpolate = interpolateNumbers;
            } else if (typeof to === 'string') {
                this.$spec.interpolate = interpolateNumbersInString;
            }
        }

        const last = this.last();
        if (last && last.to == null) {
            last.to = to;
        } else {
            this.$spec.timeline.push({
                from: last ? last.to : null,
                to,
                timing: {...defaultTiming},
            });
        }

        return this;
    }

    delay(delay: number) {
        this.last().timing.delay = delay;
        return this;
    }

    duration(duration: number) {
        this.last().timing.duration = duration;
        return this;
    }

    easing(easing: string | ((t: number) => number)) {
        this.last().timing.easing = easing;
        return this;
    }

    interpolate(interpolate: (a: T, b: T) => (t: number) => T) {
        this.$spec.interpolate = interpolate;
        return this;
    }

    output(output: (value: T) => R) {
        this.$spec.output = output;
        return this;
    }

    spec(): AnimationSpec<T, R> {
        return this.$spec;
    }
}