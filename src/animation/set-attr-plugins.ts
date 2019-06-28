import {PluginSetAttributeProps} from 'malevic/dom';
import {setInlineCSSPropertyValue} from '../utils/attrs';
import {isPlainObject, last} from '../utils/misc';
import {AnimationDeclaration} from './declaration';
import {
    scheduleAnimation,
    cancelAnimation,
    getScheduledAnimation,
} from './schedule';
import {isAnimatedStyleObj} from './utils';

function handleAnimationDeclaration(
    value: AnimationDeclaration,
    prev: any,
    callback: (output: any) => void,
) {
    const spec = value.spec();
    const specStartValue = spec.timeline[0].from;
    const specEndValue = last(spec.timeline).to;

    let prevEndValue: any;
    if (prev instanceof AnimationDeclaration) {
        const prevAnimation = getScheduledAnimation(prev);
        if (prevAnimation) {
            cancelAnimation(prevAnimation);
            prevEndValue = prevAnimation.value();
        } else {
            const prevSpec = prev.spec();
            prevEndValue = last(prevSpec.timeline).to;
        }
    } else if (
        typeof prev === typeof specEndValue &&
        prev != null &&
        specEndValue != null &&
        prev.constructor === specEndValue.constructor
    ) {
        prevEndValue = prev;
    }

    let startFrom: any;
    if (specStartValue != null) {
        startFrom = specStartValue;
    } else if (prevEndValue != null) {
        startFrom = prevEndValue;
    } else if (spec.initial != null) {
        startFrom = spec.initial;
    }

    if (startFrom == null) {
        const endValue = spec.output(specEndValue);
        callback(endValue);
    } else {
        spec.timeline[0].from = startFrom;
        scheduleAnimation(value, callback);
    }
}

function tryCancelAnimation(value: any) {
    if (value instanceof AnimationDeclaration) {
        const animation = getScheduledAnimation(value);
        if (animation) {
            cancelAnimation(animation);
        }
    }
}

export const setAttributePlugin = ({
    element,
    attr,
    value,
    prev,
}: PluginSetAttributeProps) => {
    if (value instanceof AnimationDeclaration) {
        handleAnimationDeclaration(value, prev, (output) =>
            element.setAttribute(attr, output),
        );
        return true;
    } else if (isAnimatedStyleObj(prev)) {
        Object.values(prev).forEach((v) => tryCancelAnimation(v));
    } else {
        tryCancelAnimation(prev);
    }

    return null;
};

export const setStyleAttributePlugin = ({
    element,
    attr,
    value,
    prev,
}: PluginSetAttributeProps) => {
    if (attr === 'style') {
        if (isAnimatedStyleObj(value)) {
            const newStyle = value;
            let prevStyle: {[prop: string]: any};
            if (isPlainObject(prev)) {
                prevStyle = prev;
                Object.keys(prevStyle)
                    .filter((prop) => !newStyle.hasOwnProperty(prop))
                    .forEach((prop) => {
                        tryCancelAnimation(prevStyle[prop]);
                        setInlineCSSPropertyValue(
                            element as HTMLElement,
                            prop,
                            null,
                        );
                    });
            } else {
                prevStyle = {};
                element.removeAttribute('style');
                tryCancelAnimation(prev);
            }

            Object.entries(newStyle).forEach(([prop, v]) => {
                const prevValue = prevStyle[prop];
                if (v instanceof AnimationDeclaration) {
                    handleAnimationDeclaration(v, prevValue, (output) => {
                        setInlineCSSPropertyValue(
                            element as HTMLElement,
                            prop,
                            output,
                        );
                    });
                } else {
                    tryCancelAnimation(prevValue);
                    setInlineCSSPropertyValue(element as HTMLElement, prop, v);
                }
            });

            return true;
        } else if (isAnimatedStyleObj(prev)) {
            Object.values(prev).forEach((v) => tryCancelAnimation(v));
        }
    }

    return null;
};
