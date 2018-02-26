import { html, render, renderToString } from '../src';

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
            <label class="a">
                <input readonly />
                {(domNode) => <span />}
                Hello <b>red</b> <i>sun</i> {2018}!
            </label>
        );
    }

    test('render to string', () => {
        expect(renderToString(<Component />)).toEqual([
            '<label class="a">',
            '    <input readonly/>Hello ',
            '    <b>red</b> ',
            '    <i>sun</i> 2018!',
            '</label>'
        ].join('\n'));
    });

    test('render to existing HTML', () => {
        container.innerHTML = renderToString(<Component />);

        const label = container.querySelector('label');
        const input = container.querySelector('input');
        const b = container.querySelector('b');
        const i = container.querySelector('i');
        const innerHTML = container.innerHTML;

        render(container, <Component />);
        expect(container.querySelector('label')).toBe(label);
        expect(container.querySelector('input')).toBe(input);
        // TODO: Handle declaration functions some way
        // to prevent unnecessary nodes replacement.
        // expect(container.querySelector('b')).toBe(b);
        // expect(container.querySelector('i')).toBe(i);
        expect(container.querySelector('b')).toEqual(b);
        expect(container.querySelector('i')).toEqual(i);
    });
});
