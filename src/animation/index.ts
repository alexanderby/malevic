import { interpolateNumbers, interpolateNumbersInString } from './interpolate';
import { easing, createEasingFunction } from './easing';
import malevic from '../../index';

export default function animationPlugin(lib: typeof malevic) {
    const getAttrs = lib.getAttrs;
    lib.plugins.render.setAttribute.add(({ element, attr, value }) => {
        if (!(value instanceof AnimationDeclaration)) {
            clearAnimation(element, attr);
            return null;
        }
        const animated = elementsAnimations.get(element);
        if (animated && animated[attr]) {
            const prev = animated[attr];
            clearAnimation(element, attr);
            scheduleAnimation(element, prev.lastValue, attr, value);
            return true;
        }
        let prevValue = null;
        const prevDeclaration = getAttrs(element)[attr];
        if (prevDeclaration && prevDeclaration._to != null) {
            prevValue = prevDeclaration._to;
        } else if (value._from != null) {
            prevValue = value._from;
        }
        scheduleAnimation(element, prevValue, attr, value);
        return true;
    });
    lib.plugins.static.stringifyAttr.add(({ value }) => {
        if (value instanceof AnimationDeclaration) {
            return value._to;
        }
        return null;
    });
}

export function animate(to: any) {
    return new AnimationDeclaration(null, to);
}

const elementsAnimations = new WeakMap<Element, { [attr: string]: Animation }>();
const scheduledAnimations = new Map<Animation, boolean>();

let frameId: number = null;
let currentFrameTime: number = null;

function scheduleAnimation(element: Element, from: any, attr: string, props: AnimationDeclaration) {
    let animated = elementsAnimations.get(element);
    if (!animated) {
        animated = {};
        elementsAnimations.set(element, animated);
    }
    if (from == null) {
        setAttr(element, attr, props._to);
        return;
    }
    animated[attr] = new Animation(element, from, attr, props, () => {
        clearAnimation(element, attr);
    });
    scheduledAnimations.set(animated[attr], true);
    if (!frameId) {
        currentFrameTime = performance.now();
        requestFrame();
    }
    animated[attr].start(currentFrameTime);
    setAttr(element, attr, animated[attr].tick(currentFrameTime));
}

function requestFrame() {
    currentFrameTime = performance.now();
    frameId = requestAnimationFrame(() => {
        frameId = null;
        const now = performance.now();
        const values = Array.from(scheduledAnimations.keys());
        if (values.length > 0) {
            values.forEach((animation) => {
                setAttr(animation.element, animation.attr, animation.tick(now));
            });
            requestFrame();
        }
    });
}

function clearAnimation(element: Element, attr: string) {
    const animated = elementsAnimations.get(element);
    if (animated) {
        scheduledAnimations.delete(animated[attr]);
        delete animated[attr];
        if (Object.keys(animated).length === 0) {
            elementsAnimations.delete(element);
        }
    }
    if (frameId && scheduledAnimations.size === 0) {
        cancelAnimationFrame(frameId);
        frameId = null;
    }
}

function setAttr(element: Element, attr: string, value: any) {
    if (value == null) {
        element.removeAttribute(attr);
    } else {
        element.setAttribute(attr, String(value));
    }
}

class AnimationDeclaration {
    _duration: number;
    _easing: string | number[];
    _from: any;
    _to: any;
    constructor(from: any, to: any) {
        this._from = from;
        this._to = to;
        this._duration = 750;
        this._easing = 'ease';
    }
    duration(duration: number) {
        this._duration = duration;
        return this;
    }
    easing(easing: string | number[]) {
        this._easing = easing;
        return this;
    }
    initial(from: any) {
        this._from = from;
        return this;
    }
}

class Animation {
    element: Element;
    attr: string;
    duration: number;
    from: any;
    to: any;
    startTime: number;
    lastValue: any;
    interpolate: (t: number) => any;
    easing: string | number[];
    ease: (t: number) => number;
    finished: () => void;
    constructor(element: Element, from: any, attr: string, props: AnimationDeclaration, finished: () => void) {
        this.element = element;
        this.attr = attr;
        this.duration = props._duration;
        this.easing = props._easing;
        this.from = from;
        this.to = props._to;
        this.finished = finished;
    }
    start(now: number) {
        switch (typeof this.to) {
            case 'number':
                this.interpolate = interpolateNumbers(this.from, this.to);
                break;
            case 'string':
                this.interpolate = interpolateNumbersInString(this.from, this.to);
                break;
            default:
                throw new Error('Unable to animate value');
        }
        if (Array.isArray(this.easing)) {
            this.ease = createEasingFunction([0, this.easing[0], this.easing[1], 1]);
        } else {
            this.ease = easing[this.easing];
        }
        this.startTime = now;
    }
    tick(now: number) {
        const start = this.startTime;
        const duration = this.duration;
        const q = Math.min(1, (now - start) / duration);
        const t = this.ease(q);
        if (t === 1) {
            this.finished();
        }
        this.lastValue = this.interpolate(t);
        return this.lastValue;
    }
}
