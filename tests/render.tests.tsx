import {html, render, sync, getData} from 'malevic';
import {dispatchClick} from './utils';

let container: Element = null;

beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
});

afterEach(() => {
    document.body.removeChild(container);
    container = null;
});

describe('rendering', () => {
    let element: Element = null;

    beforeEach(() => {
        element = render(container, (
            <div class="a">
                Hello <strong class="b">World</strong> {2018}
            </div>
        ));
    });

    test('initial', () => {
        expect(container.childNodes.length).toEqual(1);
        expect(element.tagName).toEqual('DIV');
        expect(element.className).toEqual('a');
        expect(element.textContent).toEqual('Hello World 2018');
        expect(element.childNodes.length).toEqual(4);
        expect(element.childElementCount).toEqual(1);
        expect(element.childNodes.item(0)).toBeInstanceOf(Text);
        expect(element.childNodes.item(1)).toBeInstanceOf(HTMLElement);
        expect(element.childNodes.item(0).textContent).toEqual('Hello ');
        expect(element.children.item(0).tagName).toEqual('STRONG');
        expect(element.children.item(0).className).toEqual('b');
        expect(element.childNodes.item(1).textContent).toEqual('World');
        expect(element.childNodes.item(2).textContent).toEqual(' ');
        expect(element.childNodes.item(3).textContent).toEqual('2018');
        expect(container.innerHTML).toEqual('<div class="a">Hello <strong class="b">World</strong> 2018</div>');
    });

    test('update', () => {
        const initialText = element.childNodes.item(0);
        const initialStrong = element.querySelector('strong');

        let el: Element;

        el = render(container, (
            <div class="a b">
                Hello <strong>red</strong> <i>rising</i> sun
            </div>
        ));

        expect(container.childNodes.length).toEqual(1);
        expect(el).toBe(element);
        expect(el.childNodes.item(0)).toBe(initialText);
        expect(el.querySelector('strong')).toBe(initialStrong);
        expect(el.childNodes.length).toEqual(5);
        expect(el.textContent).toEqual('Hello red rising sun');
        expect(container.innerHTML).toEqual('<div class="a b">Hello <strong>red</strong> <i>rising</i> sun</div>');

        el = render(container, (
            <div class="a">
                Hello
            </div>
        ));

        expect(container.childNodes.length).toEqual(1);
        expect(el).toBe(element);
        expect(el.childNodes.length).toEqual(1);
        expect(el.childNodes.item(0)).toBe(initialText);
        expect(el.childNodes.item(0).textContent).toEqual('Hello');
        expect(container.innerHTML).toEqual('<div class="a">Hello</div>');
    });
});

describe('rendering helpers', () => {
    test('render array', () => {
        const nodes = render(container, [
            <div />,
            'Text',
            <span />
        ]);
        expect(Array.isArray(nodes)).toBe(true);
        expect(nodes[0]).toBeInstanceOf(HTMLDivElement);
        expect(nodes[1]).toBeInstanceOf(Text);
        expect(nodes[2]).toBeInstanceOf(HTMLSpanElement);
    });

    test('render text', () => {
        const node = render(container, 'Text');
        expect(node).toBeInstanceOf(Text);
        expect(node.textContent).toEqual('Text');
    });

    test('sync', () => {
        const node = document.createElement('span');
        node.className = 'a';
        node.id = 'b';

        const result = sync(node, (
            <span id="b" style={{color: 'red'}}>
                Text <label>Label</label>
            </span>
        ));
        expect(result).toBe(node);
        expect(node.outerHTML).toEqual('<span id="b" style="color: red;">Text <label>Label</label></span>');

        sync(node.querySelector('label').firstChild as Text, 'Hello');
        expect(node.outerHTML).toEqual('<span id="b" style="color: red;">Text <label>Hello</label></span>');
    });
});

describe('attributes', () => {
    test('boolean attribute', () => {
        render(container, <input type="text" readonly />);
        expect(container.innerHTML).toEqual('<input type="text" readonly="">');

        render(container, <input type="radio" />);
        expect(container.innerHTML).toEqual('<input type="radio">');
    });

    test('class attribute', () => {
        render(container, <div class="a" />);
        expect(container.firstElementChild.className).toEqual('a');

        render(container, <div class="a b" />);
        expect(container.firstElementChild.className).toEqual('a b');

        render(container, <div class={['a', null, 'b', 'c']} />);
        expect(container.firstElementChild.className).toEqual('a b c');

        render(container, <div class={{'a': true, 'b': false, 'c': true}} />);
        expect(container.firstElementChild.className).toEqual('a c');

        render(container, <div class={['a', {'b': true, 'c': false}, null]} />);
        expect(container.firstElementChild.className).toEqual('a b');
    });

    test('style attribute', () => {
        render(container, <div style="background-color: red;" />);
        expect((container.firstElementChild as HTMLElement).style.backgroundColor).toEqual('red');

        render(container, <div style={{'background-color': 'blue'}} />);
        expect((container.firstElementChild as HTMLElement).style.backgroundColor).toEqual('blue');
    });
});

describe('namespaces', () => {
    test('xHTML namespace', () => {
        expect(render(container, <div />).namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
    });

    test('SVG namespace', () => {
        const svg = render(container, <svg><path /></svg>);
        expect(svg.namespaceURI).toEqual('http://www.w3.org/2000/svg');
        expect(svg.firstChild.namespaceURI).toEqual('http://www.w3.org/2000/svg');
    });

    test('other namespace', () => {
        const math = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'math');
        const sqrt = render(math, <msqrt />);
        expect(sqrt.namespaceURI).toEqual('http://www.w3.org/1998/Math/MathML');
    });
});

test('events', () => {
    let element: Element = null;
    let count = 0;
    const increment = () => count++;

    element = render(container, <button onclick={increment} />);
    expect(count).toEqual(0);

    dispatchClick(element);
    expect(count).toEqual(1);

    element = render(container, <button onclick={increment} />);
    dispatchClick(element);
    expect(count).toEqual(2);

    element = render(container, <button />);
    dispatchClick(element);
    expect(count).toEqual(2);

    element = render(container, <button onclick={increment} />);
    dispatchClick(element);
    expect(count).toEqual(3);

    element = render(container, <button onclick={() => (count = 100)} />);
    dispatchClick(element);
    expect(count).toEqual(100);
});

describe('lifecycle', () => {
    test('didmount', () => {
        let count = 0;
        const increment = () => count++;

        render(container, <div didmount={increment} />);
        expect(count).toEqual(1);

        render(container, <div didmount={increment} />);
        expect(count).toEqual(1);

        render(container, <span didmount={(node) => expect(node).toBe(container.firstElementChild)} />);
    });

    test('didupdate', () => {
        let count = 0;
        const increment = () => count++;

        render(container, <div didupdate={increment} />);
        expect(count).toEqual(0);

        render(container, <div didupdate={increment} />);
        expect(count).toEqual(1);

        render(container, <div didupdate={increment} />);
        expect(count).toEqual(2);

        render(container, <div didupdate={(node) => expect(node).toBe(container.firstElementChild)} />);
    });

    test('willunmount', () => {
        let count = 0;
        const increment = () => count++;

        render(container, <div willunmount={increment} />);
        expect(count).toEqual(0);

        render(container, <div willunmount={increment} />);
        expect(count).toEqual(0);

        render(container, <span />);
        expect(count).toEqual(1);

        render(container, <div willunmount={(node) => expect(node).toBe(container.firstElementChild)} />);
        render(container, <span />);
    });

    test('declaration function', () => {
        render(container, (
            <div class="a">
                {(domNode: Element) => {
                    expect(domNode.className).toEqual('a');
                    return <span class="b" />;
                }}
                <span class="c" />
            </div>
        ));
        expect(container.innerHTML).toEqual('<div class="a"><span class="b"></span><span class="c"></span></div>');
    });

    test('native container', () => {
        render(container, (
            <div
                didmount={(node) => node.innerHTML = '<span></span>'}
            />
        ));
        expect(container.innerHTML).toEqual('<div></div>');

        render(container, (
            <span
                native
                didmount={(node) => node.innerHTML = '<b></b>'}
            />
        ));
        expect(container.innerHTML).toEqual('<span><b></b></span>');
    });
});

test('data', () => {
    const data = {};
    const el = render(container, <div data={data} />);
    expect(getData(el)).toBe(data);
});
