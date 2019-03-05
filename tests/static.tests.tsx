import {m, render, sync, renderToString} from 'malevic';

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
