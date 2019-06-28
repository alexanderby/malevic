import {m} from 'malevic';
import {render} from 'malevic/dom';
import {withAnimation, animate} from 'malevic/animation';
import {stringify} from 'malevic/string';
import {createAnimationSemaphore} from './utils';

const semaphore = createAnimationSemaphore();
let target: Element = null;

beforeEach(() => {
    target = document.createElement('div');
    document.body.appendChild(target);

    semaphore.init(0);
});

afterEach(() => {
    document.body.removeChild(target);
    target = null;

    semaphore.reset();
});

describe('animation', () => {
    test('animate attributes', () => {
        const Box = withAnimation(({x}) => (<span
            style={animate(`left: ${x}px;`)
                .initial('left: 0px;')
                .duration(250)
                .easing('linear')}
        />));

        render(target, (
            <Box x={40} />
        ));
        const box = target.firstElementChild as HTMLSpanElement;
        expect(box).toBeInstanceOf(HTMLSpanElement);
        expect(box.style.left).toBe('0px');

        semaphore.tick(125);
        expect(box.style.left).toBe('20px');

        semaphore.tick(250);
        expect(box.style.left).toBe('40px');
    });

    test('animate styles', () => {
        const Box = withAnimation(({x}) => (<span
            style={{
                left: animate(`${x}px`)
                    .initial('0px')
                    .duration(250)
                    .easing('linear'),
            }}
        />));

        const Text = withAnimation(({x}) => (<span
            style={{
                left: animate(`${x}px`)
                    .duration(250)
                    .easing('linear'),
            }}
        />));

        render(target, (<Array>
            <Box x={40} />
            <Text x={40} />
        </Array>));
        const box = target.firstElementChild as HTMLSpanElement;
        const text = target.lastElementChild as HTMLSpanElement;
        expect(box).toBeInstanceOf(HTMLSpanElement);
        expect(text).toBeInstanceOf(HTMLSpanElement);
        expect(box.style.left).toBe('0px');
        expect(text.style.left).toBe('40px');

        semaphore.tick(125);
        expect(box.style.left).toBe('20px');
        expect(text.style.left).toBe('40px');

        semaphore.tick(250);
        expect(box.style.left).toBe('40px');
        expect(text.style.left).toBe('40px');
    });

    test('numeric values', () => {
        const Box = withAnimation(({x}) => (
            <rect x={animate(x).duration(250).easing('linear')} />));

        render(target, (
            <svg>
                <Box x={0} />
            </svg>
        ));
        const box = target.firstElementChild.firstElementChild as SVGRectElement;
        expect(box).toBeInstanceOf(SVGElement);
        expect(box.getAttribute('x')).toBe('0');

        render(target, (
            <svg>
                <Box x={40} />
            </svg>
        ));

        semaphore.tick(125);
        expect(box.getAttribute('x')).toBe('20');

        semaphore.tick(250);
        expect(box.getAttribute('x')).toBe('40');
    });

    test('interrupt animation', () => {
        const Box = withAnimation(({x, color}) => (<span
            color={animate(`rgb(${color})`)
                .initial('rgb(0,0,0)')
                .duration(250)
                .easing('linear')}
            style={{
                top: x === 0 ? `0px` : animate(`${x}px`).duration(250).easing('linear'),
                left: animate(`${x}px`)
                    .initial('0px')
                    .duration(250)
                    .easing('linear'),
            }}
        />));

        render(target, (
            <Box x={40} color={[255, 255, 255]} />
        ));
        const box = target.firstElementChild as HTMLSpanElement;
        expect(box).toBeInstanceOf(HTMLSpanElement);
        expect(box.style.left).toBe('0px');
        expect(box.style.top).toBe('40px');

        semaphore.tick(125);
        expect(box.style.left).toBe('20px');
        expect(box.style.top).toBe('40px');

        render(target, (
            <Box x={120} color={[0, 0, 0]} />
        ));

        semaphore.tick(250);
        expect(box.style.left).toBe('70px');
        expect(box.style.top).toBe('80px');

        semaphore.tick(375);
        expect(box.style.left).toBe('120px');
        expect(box.style.top).toBe('120px');
        expect(box.getAttribute('color')).toBe('rgb(0,0,0)');
    });

    test('schedule and cancel attribute animation', () => {
        const Box = withAnimation(({x, isStatic}) => (<span
            style={isStatic ? `left: ${x}px;` : animate(`left: ${x}px;`)
                .initial('left: 0px;')
                .duration(250)
                .easing('linear')}
        />));

        render(target, (
            <Box x={20} isStatic />
        ));
        const box = target.firstElementChild as HTMLSpanElement;
        expect(box).toBeInstanceOf(HTMLSpanElement);
        expect(box.style.left).toBe('20px');

        render(target, (
            <Box x={40} />
        ));
        expect(box.style.left).toBe('20px');

        semaphore.tick(125);
        expect(box.style.left).toBe('30px');

        render(target, (
            <Box x={80} isStatic />
        ));
        expect(box.style.left).toBe('80px');

        semaphore.tick(250);
        expect(box.style.left).toBe('80px');
    });

    test('schedule and cancel style animation', () => {
        const Box = withAnimation(({x, isStatic}) => (<span
            style={{
                right: '30px',
                left: isStatic ? `${x}px` : animate(`${x}px`)
                    .duration(250)
                    .easing('linear'),
            }}
        />));

        render(target, (
            <Box x={20} isStatic />
        ));
        const box = target.firstElementChild as HTMLSpanElement;
        expect(box).toBeInstanceOf(HTMLSpanElement);
        expect(box.style.left).toBe('20px');
        expect(box.style.right).toBe('30px');

        render(target, (
            <Box x={40} />
        ));
        expect(box.style.left).toBe('20px');
        expect(box.style.right).toBe('30px');

        semaphore.tick(125);
        expect(box.style.left).toBe('30px');

        render(target, (
            <Box x={80} isStatic />
        ));
        expect(box.style.left).toBe('80px');
        expect(box.style.right).toBe('30px');

        semaphore.tick(125);
        expect(box.style.left).toBe('80px');
        expect(box.style.right).toBe('30px');
    });

    test('custom interpolators', () => {
        const Box = withAnimation(({x}) => (<span
            style={animate(x)
                .initial(0)
                .interpolate((a, b) => (t) => a * (1 - t) + b * t)
                .output((value) => `left: ${value}px;`)
                .duration(250)
                .easing((t) => t * t)}
        />));

        render(target, (
            <Box x={40} />
        ));
        const box = target.firstElementChild as HTMLSpanElement;
        expect(box).toBeInstanceOf(HTMLSpanElement);
        expect(box.style.left).toBe('0px');

        semaphore.tick(125);
        expect(box.style.left).toBe('10px');

        semaphore.tick(250);
        expect(box.style.left).toBe('40px');
    });

    test('stringify animation', () => {
        const Box = withAnimation(({x}) => (
            <Array>
                <div
                    class="first"
                    style={{
                        top: animate(`${x}px`)
                            .duration(250)
                            .easing('linear'),
                    }}
                />
                <a
                    class="second"
                    style={animate(`bottom: ${x}px;`)
                        .duration(250)
                        .easing('linear')}
                />
                <p
                    class="third"
                    style={{
                        right: 'initial',
                        top: animate(`${x}px`)
                            .duration(250)
                            .easing('linear'),
                    }}
                />
                <span
                    class="last"
                    style={animate(`left: ${x}px;`)
                        .initial('left: 0px;')
                        .duration(250)
                        .easing('linear')}
                />
            </Array>
        ));

        const html = stringify(<Box x={40} />);
        expect(html).toBe([
            '<div class="first" style="top: 40px;"></div>',
            '<a class="second" style="bottom: 40px;"></a>',
            '<p class="third" style="right: initial; top: 40px;"></p>',
            '<span class="last" style="left: 0px;"></span>',
        ].join('\n'));
    });

    test('invalid value', () => {
        const C = withAnimation(() => <div class={animate({}).initial({}).duration(50)} />);
        expect(() => render(target, <C />)).toThrow(/No interpolator provided/);
    });

    test('animation type switch', () => {
        const Misc = withAnimation(({x, mode}) => {
            switch (mode) {
                case 0:
                    return <Array>
                        <div style={`left: ${x}px;`} />
                        <div style={{left: `${x}px`}} />
                        <div style={animate(`left: ${x}px;`).initial('left: 0px;').duration(250).easing('linear')} />
                        <div style={{left: animate(`${x}px`).initial('0px').duration(250).easing('linear')}} />
                    </Array>;
                default:
                    return <Array>
                        <div style={{left: animate(`${x}px`).initial('0px').duration(250).easing('linear')}} />
                        <div style={{left: animate(`${x}px`).initial('0px').duration(250).easing('linear')}} />
                        <div style={{left: animate(`${x}px`).initial('0px').duration(250).easing('linear')}} />
                        <div style={{left: animate(`${x}px`).initial('0px').duration(250).easing('linear')}} />
                    </Array>;
            }
        });

        const child = (index: number) => target.children[index] as HTMLDivElement;

        render(target, <Misc mode={0} x={40} />);
        expect(child(0).style.left).toBe('40px');
        expect(child(1).style.left).toBe('40px');
        expect(child(2).style.left).toBe('0px');
        expect(child(3).style.left).toBe('0px');

        semaphore.tick(125);
        render(target, <Misc mode={1} x={80} />);
        expect(child(0).style.left).toBe('0px');
        expect(child(1).style.left).toBe('40px');
        expect(child(2).style.left).toBe('0px');
        expect(child(3).style.left).toBe('20px');

        semaphore.tick(250);
        render(target, <Misc mode={0} x={120} />);
        expect(child(0).style.left).toBe('120px');
        expect(child(1).style.left).toBe('120px');
        expect(child(2).style.left).toBe('0px');
        expect(child(3).style.left).toBe('50px');

        semaphore.tick(500);
        expect(child(0).style.left).toBe('120px');
        expect(child(1).style.left).toBe('120px');
        expect(child(2).style.left).toBe('120px');
        expect(child(3).style.left).toBe('120px');
    });
});
