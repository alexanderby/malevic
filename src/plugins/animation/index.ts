import { interpolateNumbers, interpolateNumbersInString } from './interpolate';
import malevic from '../../../index';

const animations = new WeakMap<Element, { [attr: string]: Animation }>();
const scheduledAnimations = new Map<Animation, boolean>();

let frameId: number = null;
let currentFrameTime: number = null;

function scheduleAnimation(element: Element, from: any, attr: string, props: AnimationDeclaration) {
    let animated = animations.get(element);
    if (!animated) {
        animated = {};
        animations.set(element, animated);
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
    const animated = animations.get(element);
    if (animated) {
        scheduledAnimations.delete(animated[attr]);
        delete animated[attr];
        if (Object.keys(animated).length === 0) {
            animations.delete(element);
        }
    }
    if (frameId && scheduledAnimations.size === 0) {
        cancelAnimationFrame(frameId);
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
    _easing: string;
    _from: any;
    _to: any;
    constructor(from: any, to: any) {
        this._from = from;
        this._to = to;
        this._duration = 750;
        this._easing = 'ease-in-out';
    }
    duration(duration: number) {
        this._duration = duration;
        return this;
    }
    easing(easing: string) {
        this._easing = easing;
        return this;
    }

    static animate(to: any) {
        return new AnimationDeclaration(null, to);
    }

    static from(from: any) {
        return {
            to(to: any) {
                return new AnimationDeclaration(from, to);
            }
        };
    }
}

// Todo: easing function [0,1]->[0,1]
class Animation {
    element: Element;
    attr: string;
    duration: number;
    from: any;
    to: any;
    startTime: number;
    lastValue: any;
    interpolate: (t: number) => any;
    finished: () => void;
    constructor(element: Element, from: any, attr: string, props: AnimationDeclaration, finished: () => void) {
        this.element = element;
        this.attr = attr;
        this.duration = props._duration;
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
        this.startTime = now;
    }
    tick(now: number) {
        const start = this.startTime;
        const duration = this.duration;
        const t = Math.min(1, (now - start) / duration);
        if (t === 1) {
            this.finished();
        }
        this.lastValue = this.interpolate(t);
        return this.lastValue;
    }
}
let getAttrs: (element: Element) => { [attr: string]: any };

interface Plugin {
    (lib: typeof malevic): void;
    animate?: typeof AnimationDeclaration.animate;
    from?: typeof AnimationDeclaration.from;
}

const animationPlugin: Plugin = (lib: typeof malevic) => {
    getAttrs = lib.getAttrs;
    lib.plugins.render.setAttribute.add(({ element, attr, value }) => {
        if (!(value instanceof AnimationDeclaration)) {
            clearAnimation(element, attr);
            return false;
        }
        const animated = animations.get(element);
        if (animated) {
            const prev = animated[attr];
            clearAnimation(element, attr);
            scheduleAnimation(element, prev.lastValue, attr, value);
            return true;
        }
        const prevValue = value._from == null ? getAttrs(element)[attr] : value._from;
        if (prevValue == null) {
            return false;
        }
        scheduleAnimation(element, prevValue, attr, value);
        return true;
    });
};
animationPlugin.animate = AnimationDeclaration.animate;
animationPlugin.from = AnimationDeclaration.from;

export default animationPlugin;
