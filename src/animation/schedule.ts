import {Animation} from './animation';
import {AnimationDeclaration} from './declaration';
import {createTimer} from './timer';

const timer = createTimer();
timer.tick((time) =>
    Array.from(scheduledAnimations.values()).forEach((animation) => {
        animation.tick(time);
        if (animation.complete()) {
            cancelAnimation(animation);
        }
    }),
);

const animationsByDeclaration = new WeakMap<AnimationDeclaration, Animation>();
const scheduledAnimations = new Set<Animation>();

export function scheduleAnimation(
    declaration: AnimationDeclaration,
    tick: (output: any) => void,
) {
    const animation = new Animation(declaration.spec(), tick);
    scheduledAnimations.add(animation);
    animationsByDeclaration.set(declaration, animation);

    if (!timer.running()) {
        timer.run();
    }
}

export function cancelAnimation(animation: Animation) {
    scheduledAnimations.delete(animation);
    if (scheduledAnimations.size === 0) {
        timer.stop();
    }
}

export function getScheduledAnimation(declaration: AnimationDeclaration) {
    const animation = animationsByDeclaration.get(declaration);
    if (animation && scheduledAnimations.has(animation)) {
        return animation;
    }
    return null;
}
