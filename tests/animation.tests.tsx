import {m} from 'malevic';
import {render} from 'malevic/dom';
import {withAnimation, animate} from 'malevic/animation';
import {stringify} from 'malevic/string';

// TODO: Mock `requestAnimationFrame` and `performance.now()`.

let target: Element = null;

beforeEach(() => {
    target = document.createElement('div');
    document.body.appendChild(target);
});

afterEach(() => {
    document.body.removeChild(target);
    target = null;
});

describe('animation', () => {
    test('animate attributes', () => {
        return new Promise((resolve) => {
            const Box = withAnimation(({x}) => (<span
                style={animate(`left: ${x}px;`)
                    .initial('left: 0px;')
                    .duration(250)
                    .easing('linear')}
            />));

            render(target, (<div>
                <Box x={40} />
            </div>));
            const box = target.firstElementChild as HTMLSpanElement;
            expect(box).toBeInstanceOf(HTMLSpanElement);
            expect(box.style.left).toBe('0px');

            setTimeout(() => {
                expect(parseFloat(box.style.left)).toBeGreaterThan(0);
                expect(parseFloat(box.style.left)).toBeLessThan(40);

                setTimeout(() => {
                    expect(box.style.left).toBe('40px');
                    resolve();
                }, 375);
            }, 125);
        });
    });

    test('animate styles', () => {
        return new Promise((resolve) => {
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

            render(target, (<div>
                <Box x={40} />
                <Text x={40} />
            </div>));
            const box = target.firstElementChild as HTMLSpanElement;
            const text = target.lastElementChild as HTMLSpanElement;
            expect(box).toBeInstanceOf(HTMLSpanElement);
            expect(text).toBeInstanceOf(HTMLSpanElement);
            expect(box.style.left).toBe('0px');
            expect(text.style.left).toBe('40px');

            setTimeout(() => {
                expect(parseFloat(box.style.left)).toBeGreaterThan(0);
                expect(parseFloat(box.style.left)).toBeLessThan(40);
                expect(parseFloat(text.style.left)).toBe(40);

                setTimeout(() => {
                    expect(box.style.left).toBe('40px');
                    expect(text.style.left).toBe('40px');
                    resolve();
                }, 375);
            }, 125);
        });
    });

    test('numeric values', () => {
        return new Promise((resolve) => {
            const Box = withAnimation(({x}) => (
                <rect x={animate(x).duration(250)} />));

            render(target, (<div>
                <svg>
                    <Box x={0} />
                </svg>
            </div>));
            const box = target.firstElementChild.firstElementChild as SVGRectElement;
            expect(box).toBeInstanceOf(SVGElement);
            expect(box.getAttribute('x')).toBe('0');

            render(target, (<div>
                <svg>
                    <Box x={40} />
                </svg>
            </div>));

            setTimeout(() => {
                expect(parseFloat(box.getAttribute('x'))).toBeGreaterThan(0);
                expect(parseFloat(box.getAttribute('x'))).toBeLessThan(40);

                setTimeout(() => {
                    expect(box.getAttribute('x')).toBe('40');
                    resolve();
                }, 375);
            }, 125);
        });
    });

    test('interrupt animation', () => {
        return new Promise((resolve) => {
            const Box = withAnimation(({x, color}) => (<span
                color={animate(`rgb(${color})`)
                    .initial('rgb(0,0,0)')
                    .duration(250)}
                style={{
                    top: x === 0 ? `0px` : animate(`${x}px`).duration(250),
                    left: animate(`${x}px`)
                        .initial('0px')
                        .duration(250)
                        .easing('linear'),
                }}
            />));

            render(target, (<div>
                <Box x={40} color={[255, 255, 255]} />
            </div>));
            const box = target.firstElementChild as HTMLSpanElement;
            expect(box).toBeInstanceOf(HTMLSpanElement);
            expect(box.style.left).toBe('0px');
            expect(box.style.top).toBe('40px');

            setTimeout(() => {
                expect(parseFloat(box.style.left)).toBeGreaterThan(0);
                expect(parseFloat(box.style.left)).toBeLessThan(40);
                expect(parseFloat(box.style.top)).toBe(40);

                render(target, (<div>
                    <Box x={120} color={[0, 0, 0]} />
                </div>));

                setTimeout(() => {
                    expect(parseFloat(box.style.left)).toBeGreaterThan(40);
                    expect(parseFloat(box.style.left)).toBeLessThan(120);
                    expect(parseFloat(box.style.top)).toBeGreaterThan(40);
                    expect(parseFloat(box.style.top)).toBeLessThan(120);

                    setTimeout(() => {
                        expect(box.style.left).toBe('120px');
                        expect(box.style.top).toBe('120px');
                        expect(box.getAttribute('color')).toBe('rgb(0,0,0)');
                        resolve();
                    }, 250);
                }, 125);
            }, 125);
        });
    });

    test('schedule and cancel attribute animation', () => {
        return new Promise((resolve) => {
            const Box = withAnimation(({x, isStatic}) => (<span
                style={isStatic ? `left: ${x}px;` : animate(`left: ${x}px;`)
                    .initial('left: 0px;')
                    .duration(250)
                    .easing('linear')}
            />));

            render(target, (<div>
                <Box x={20} isStatic />
            </div>));
            const box = target.firstElementChild as HTMLSpanElement;
            expect(box).toBeInstanceOf(HTMLSpanElement);
            expect(box.style.left).toBe('20px');

            render(target, (<div>
                <Box x={40} />
            </div>));
            expect(box.style.left).toBe('20px');

            setTimeout(() => {
                expect(parseFloat(box.style.left)).toBeGreaterThan(20);
                expect(parseFloat(box.style.left)).toBeLessThan(40);

                render(target, (<div>
                    <Box x={80} isStatic />
                </div>));
                expect(box.style.left).toBe('80px');
                resolve();
            }, 125);
        });
    });

    test('schedule and cancel style animation', () => {
        return new Promise((resolve) => {
            const Box = withAnimation(({x, isStatic}) => (<span
                style={{
                    right: '30px',
                    left: isStatic ? `${x}px` : animate(`${x}px`)
                        .duration(250)
                        .easing('linear'),
                }}
            />));

            render(target, (<div>
                <Box x={20} isStatic />
            </div>));
            const box = target.firstElementChild as HTMLSpanElement;
            expect(box).toBeInstanceOf(HTMLSpanElement);
            expect(box.style.left).toBe('20px');
            expect(box.style.right).toBe('30px');

            render(target, (<div>
                <Box x={40} />
            </div>));
            expect(box.style.left).toBe('20px');
            expect(box.style.right).toBe('30px');

            setTimeout(() => {
                expect(parseFloat(box.style.left)).toBeGreaterThan(20);
                expect(parseFloat(box.style.left)).toBeLessThan(40);

                render(target, (<div>
                    <Box x={80} isStatic />
                </div>));
                expect(box.style.left).toBe('80px');
                expect(box.style.right).toBe('30px');
                resolve();
            }, 125);
        });
    });

    test('custom interpolators', () => {
        return new Promise((resolve) => {
            const Box = withAnimation(({x}) => (<span
                style={animate(x)
                    .initial(0)
                    .interpolate((a, b) => (t) => `left: ${(a * (1 - t) + b * t).toFixed()}px;`)
                    .duration(250)
                    .easing([0, 0.2, 0.8, 1])}
            />));

            render(target, (<div>
                <Box x={40} />
            </div>));
            const box = target.firstElementChild as HTMLSpanElement;
            expect(box).toBeInstanceOf(HTMLSpanElement);
            expect(box.style.left).toBe('0px');

            setTimeout(() => {
                expect(parseFloat(box.style.left)).toBeGreaterThan(0);
                expect(parseFloat(box.style.left)).toBeLessThan(40);
                expect(parseFloat(box.style.left) % 1).toBe(0);

                setTimeout(() => {
                    expect(box.style.left).toBe('40px');
                    resolve();
                }, 250);
            }, 125);
        });
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
        return new Promise((resolve) => {
            const C = withAnimation(() => <div class={animate({}).initial({}).duration(50)} />);
            expect(() => render(target, <C />)).toThrow(/Unable to animate/);

            setTimeout(() => resolve(), 100);
        });
    });

    /*
    // broken
    test('animation type switch', () => {
        return new Promise((resolve) => {
            const Misc = withAnimation(({x, mode}) => {
                switch (mode) {
                    case 0:
                        return <Array>
                            <div style={`left: ${x}px;`} />
                            <div style={{left: `${x}px`}} />
                            <div style={animate(`left: ${x}px;`).initial('left: 0px;').duration(250)} />
                            <div style={{left: animate(`${x}px`).initial('0px').duration(250)}} />
                        </Array>;
                    default:
                        return <Array>
                            <div style={{left: animate(`${x}px`).initial('0px').duration(250)}} />
                            <div style={{left: animate(`${x}px`).initial('0px').duration(250)}} />
                            <div style={{left: animate(`${x}px`).initial('0px').duration(250)}} />
                            <div style={{left: animate(`${x}px`).initial('0px').duration(250)}} />
                        </Array>;
                }
            });

            render(target, <div><Misc mode={0} x={40} /></div>);
            setTimeout(() => {
                render(target, <div><Misc mode={1} x={40} /></div>);
                setTimeout(() => {
                    render(target, <div><Misc mode={0} x={40} /></div>);
                    setTimeout(() => {
                        expect((target.children[0] as HTMLElement).style.left).toBe(40);
                        expect((target.children[1] as HTMLElement).style.left).toBe(40);
                        expect((target.children[2] as HTMLElement).style.left).toBe(40);
                        expect((target.children[3] as HTMLElement).style.left).toBe(40);
                        resolve();
                    }, 400);
                }, 50);
            }, 50);
        });
    });
    */
});
