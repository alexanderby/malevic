import {m, render, sync, renderToString} from 'malevic';
import withState, {useState} from 'malevic/state';

let container: Element = null;

beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
});

afterEach(() => {
    document.body.removeChild(container);
    container = null;
});

describe('server-side rendering', () => {
    function Component() {
        return (
            <label class={['a', 'b']}>
                <input class="a_i" value="T" readonly />
                Hello <b style={{'color': 'red'}}>red</b> <i class={{'sunny': true}}>sun</i> {2018}!
            </label>
        );
    }

    test('render to string', () => {
        expect(renderToString(<Component />)).toEqual([
            '<label class="a b">',
            '    <input class="a_i" value="T" readonly/>Hello ',
            '    <b style="color: red;">red</b> ',
            '    <i class="sunny">sun</i> 2018!',
            '</label>'
        ].join('\n'));
    });

    test('render state component to string using initial state', () => {
        const A = withState(({x}) => {
            const {state} = useState({y: 2});
            return (
                <div>
                    <span>{x}</span>
                    <span>{state.y}</span>
                    <B />
                </div>
            );
        });
        const B = withState(() => {
            const {state} = useState({z: 3});
            return <span>{state.z}</span>
        });

        expect(renderToString(<A x={1} />)).toEqual([
            '<div>',
            '    <span>1</span>',
            '    <span>2</span>',
            '    <span>3</span>',
            '</div>'
        ].join('\n'));
    });

    test('render to existing HTML', () => {
        container.innerHTML = renderToString(<Component />);

        const label = container.querySelector('label');
        const input = container.querySelector('input');
        const b = container.querySelector('b');
        const i = container.querySelector('i');

        render(container, <Component />);
        expect(container.querySelector('label')).toBe(label);
        expect(container.querySelector('input')).toBe(input);
        expect(container.querySelector('b')).toBe(b);
        expect(container.querySelector('i')).toBe(i);
    });

    test('call `didmount` when render into existing HTML', () => {
        let x = 0;
        const A = () => (
            <span
                didmount={() => x += 1}
                didupdate={() => x += 10}
            />
        );
        container.innerHTML = renderToString(<A />);
        sync(container.firstElementChild, <A />);
        expect(x).toEqual(1);
        sync(container.firstElementChild, <A />);
        expect(x).toEqual(11);
    });
});
