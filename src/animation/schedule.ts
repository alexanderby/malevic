import {Animation} from './animation';
import {AnimationDeclaration} from './declaration';
import {createTimer} from './timer';

const timer = createTimer();
timer.tick((time) =>
    Array.from(scheduledAnimations.values()).forEach((animation) =>
        animationTick(animation, time),
    ),
);

function animationTick(animation: Animation, time: number) {
    animation.tick(time);
    if (animation.complete()) {
        cancelAnimation(animation);
        animation.finalize();
    }
}

const animationsByDeclaration = new WeakMap<AnimationDeclaration, Animation>();
const scheduledAnimations = new Set<Animation>();

// TODO: Cancel animation when element was removed.
export function scheduleAnimation(
    declaration: AnimationDeclaration,
    tick: (output: any) => void,
) {
    const animation = new Animation(declaration.spec(), tick);
    scheduledAnimations.add(animation);
    animationsByDeclaration.set(declaration, animation);

    !timer.running() && timer.run();
    animationTick(animation, timer.time());
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
