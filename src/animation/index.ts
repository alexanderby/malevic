import {Component} from 'malevic';
import {plugins as domPlugins} from 'malevic/dom';
import {plugins as stringPlugins, escapeHTML} from 'malevic/string';
import {styles} from '../utils/attrs';
import {isObject} from '../utils/misc';
import {easing, createEasingFunction} from './easing';
import {
    interpolateNumbers,
    interpolateNumbersInString,
    Interpolator,
} from './interpolate';

export function withAnimation<T extends Component>(type: T): T {
    domPlugins && domPlugins.setAttribute
        .add(type, ({element, attr, value, prev}) => {
            if (!(value instanceof AnimationDeclaration)) {
                clearAnimation(element, attr);
                return null;
            }
            const animated = elementsAnimations.get(element);
            if (animated && animated[attr]) {
                const prev = animated[attr];
                clearAnimation(element, attr);
                scheduleAnimation(element, (prev as Animation).lastValue, attr, value);
                return true;
            }
            let prevValue = null;
            const prevDeclaration = prev;
            if (prevDeclaration != null && !(prevDeclaration instanceof AnimationDeclaration)) {
                prevValue = prevDeclaration;
            } else if (prevDeclaration instanceof AnimationDeclaration && prevDeclaration._to != null) {
                prevValue = prevDeclaration._to;
            } else if (value._from != null) {
                prevValue = value._from;
            }
            scheduleAnimation(element, prevValue, attr, value);
            return true;
        })
        .add(type, ({element, attr, value, prev}) => {
            if (!isAnimatedStyleObj(attr, value)) {
                return null;
            }

            const animated = elementsAnimations.get(element);
            if (animated && animated['style'] instanceof Animation) {
                clearAnimation(element, 'style');
            }

            const declarations: {from: any; prop: string; props?: AnimationDeclaration;}[] = [];
            const prevAnimation = animated && animated['style'] instanceof StyleAnimation ? animated['style'] as StyleAnimation : null;
            const prevStyleDeclaration = isObject(prev) ? prev : null;
            Object.keys(value).forEach((prop) => {
                const v = value[prop];
                if (!(v instanceof AnimationDeclaration)) {
                    declarations.push({from: v, prop});
                    return;
                }
                let prevValue = null;
                if (prevAnimation && prevAnimation.animations[prop] != null) {
                    if (prevAnimation.animations[prop] instanceof Animation) {
                        prevValue = (prevAnimation.animations[prop] as Animation).lastValue;
                    } else {
                        prevValue = prevAnimation.animations[prop] as string;
                    }
                } else {
                    const prevDeclaration = prevStyleDeclaration ? prevStyleDeclaration[prop] : null;
                    if (prevDeclaration != null && !(prevDeclaration instanceof AnimationDeclaration)) {
                        prevValue = prevDeclaration;
                    } else if (prevDeclaration instanceof AnimationDeclaration && prevDeclaration._to != null) {
                        prevValue = prevDeclaration._to;
                    } else if (v._from != null) {
                        prevValue = v._from;
                    }
                }
                declarations.push({from: prevValue, prop, props: v});
            });
            if (prevAnimation) {
                clearAnimation(element, 'style');
            }
            scheduleStyleAnimation(element, declarations);
            return true;
        });

    stringPlugins && stringPlugins.stringifyAttribute
        .add(type, ({value}) => {
            if (value instanceof AnimationDeclaration) {
                if (value._from != null) {
                    return escapeHTML(String(value._from));
                }
                if (value._to != null) {
                    return escapeHTML(String(value._to));
                }
            }
            return null;
        })
        .add(type, ({attr, value}) => {
            if (isAnimatedStyleObj(attr, value)) {
                const style = {};
                Object.keys(value).forEach((prop) => {
                    const v = value[prop];
                    if (v instanceof AnimationDeclaration) {
                        if (v._from != null) {
                            style[prop] = v._from;
                        } else if (v._to != null) {
                            style[prop] = v._to;
                        }
                    } else {
                        style[prop] = v;
                    }
                });
                return escapeHTML(styles(style));
            }
            return null;
        });

    return type;
}

function isAnimatedStyleObj(attr, value) {
    return (
        attr === 'style' &&
        isObject(value) &&
        Object.keys(value).filter((p) => value[p] instanceof AnimationDeclaration).length > 0
    );
}

export function animate(to: any) {
    return new AnimationDeclaration(null, to);
}

const elementsAnimations = new WeakMap<Element, {[attr: string]: Animation | StyleAnimation}>();
const scheduledAnimations = new Set<Animation | StyleAnimation>();

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
    scheduledAnimations.add(animated[attr]);
    if (!frameId) {
        currentFrameTime = performance.now();
        requestFrame();
    }
    animated[attr].start(currentFrameTime);
    setAttr(element, attr, animated[attr].tick(currentFrameTime));
}

function scheduleStyleAnimation(element: Element, items: {from: any; prop: string; props?: AnimationDeclaration;}[]) {
    let animated = elementsAnimations.get(element);
    if (!animated) {
        animated = {};
        elementsAnimations.set(element, animated);
    }
    const styleAnimations: StyleAnimations = {};
    items.forEach(({from, prop, props}) => {
        if (props == null) {
            styleAnimations[prop] = from;
            return;
        }
        if (from == null) {
            styleAnimations[prop] = props._to;
            return;
        }
        styleAnimations[prop] = new Animation(element, from, prop, props, null);
    });

    if (Object.keys(styleAnimations).filter((s) => styleAnimations[s] instanceof Animation).length === 0) {
        setAttr(element, 'style', styles(styleAnimations as any));
        return;
    }
    const animation = new StyleAnimation(element, styleAnimations, () => {
        clearAnimation(element, 'style');
    });
    animated['style'] = animation;
    scheduledAnimations.add(animation);
    if (!frameId) {
        currentFrameTime = performance.now();
        requestFrame();
    }
    animation.start(currentFrameTime);
    setAttr(element, 'style', animation.tick(currentFrameTime));
}

function requestFrame() {
    currentFrameTime = performance.now();
    frameId = requestAnimationFrame(() => {
        frameId = null;
        const now = performance.now();
        const values: (Animation | StyleAnimation)[] = []
        scheduledAnimations.forEach((value) => values.push(value));
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
    _interpolator: Interpolator<any>;
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
    interpolate(interpolate: Interpolator<any>) {
        this._interpolator = interpolate;
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
        if (typeof props._interpolator === 'function') {
            this.interpolate = props._interpolator(this.from, this.to);
        }
    }
    start(now: number) {
        if (!this.interpolate) {
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

interface StyleAnimations {
    [prop: string]: Animation | string;
}

class StyleAnimation {
    element: Element;
    attr: string;
    finished: () => void;
    animations: StyleAnimations;
    constructor(element: Element, animations: StyleAnimations, finished: () => void) {
        this.element = element;
        this.attr = 'style';
        this.animations = animations;
        this.finished = finished;
        Object.keys(animations)
            .filter((prop) => animations[prop] instanceof Animation)
            .forEach((prop) => {
                const a = animations[prop] as Animation;
                a.finished = () => this.onSingleAnimationFinished(a);
            });
    }
    onSingleAnimationFinished(animation: Animation) {
        this.animations[animation.attr] = animation.lastValue;
        if (this.getAnimations().length === 0) {
            this.finished();
        }
    }
    getAnimations(): Animation[] {
        return Object.keys(this.animations)
            .filter((prop) => this.animations[prop] instanceof Animation)
            .map((prop) => this.animations[prop] as Animation);
    }
    start(now: number) {
        this.getAnimations().forEach((a) => a.start(now));
    }
    tick(now: number) {
        const style = {};
        Object.keys(this.animations)
            .forEach((prop) => {
                const value = this.animations[prop]
                if (value instanceof Animation) {
                    style[prop] = value.tick(now);
                } else {
                    style[prop] = value;
                }
            });
        return styles(style);
    }
}
