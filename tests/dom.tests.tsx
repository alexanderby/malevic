import {m} from '../src/spec';
import {render, getContext} from '../src/dom';
import {dispatchClick} from './utils';

let target: Element = null;

beforeEach(() => {
    target = document.createElement('div');
    document.body.appendChild(target);
});

afterEach(() => {
    document.body.removeChild(target);
    target = null;
});

describe('DOM', () => {
    test('first time render', () => {
        const result = render(target, (
            m('div', {class: 'c'},
                m('span', null,
                    'Hello',
                ),
                ' ',
                m('span', null,
                    'World!',
                ),
            )
        ));

        expect(result).toBe(target);
        expect(result.className).toBe('c');
        expect(result.childNodes.length).toBe(3);
        expect(result.childNodes.item(0)).toBeInstanceOf(HTMLSpanElement);
        expect(result.childNodes.item(1)).toBeInstanceOf(Text);
        expect(result.childNodes.item(2)).toBeInstanceOf(HTMLSpanElement);
        expect(result.childNodes.item(0).textContent).toBe('Hello');
        expect(result.childNodes.item(1).textContent).toBe(' ');
        expect(result.childNodes.item(2).textContent).toBe('World!');
    });

    test('second time render', () => {
        const result1 = render(target, (
            m('div', {class: 'c1'},
                m('span', null,
                    'Hello',
                ),
                ' ',
                m('span', {class: 's2'},
                    'World!',
                ),
            )
        ));
        const span2 = result1.querySelector('.s2');
        const text2 = span2.childNodes.item(0);

        const result2 = render(target, (
            m('div', {class: 'c2'},
                m('div', null,
                    'Hello',
                ),
                ' ',
                m('span', null,
                    'again',
                ),
            )
        ));

        expect(result1).toBe(result2);
        expect(result2.className).toBe('c2');
        expect(result2.childNodes.length).toBe(3);
        expect(result2.childNodes.item(0)).toBeInstanceOf(HTMLDivElement);
        expect(result2.childNodes.item(1)).toBeInstanceOf(Text);
        expect(result2.childNodes.item(2)).toBeInstanceOf(HTMLSpanElement);
        expect(result2.childNodes.item(0).textContent).toBe('Hello');
        expect(result2.childNodes.item(1).textContent).toBe(' ');
        expect(result2.childNodes.item(2).textContent).toBe('again');
        expect(result2.querySelector('span')).toBe(span2);
        expect(result2.querySelector('span').childNodes.item(0)).toBeInstanceOf(Text);
        expect(result2.querySelector('span').childNodes.item(0)).toBe(text2);
    });

    test('events', () => {
        let count = 0;

        const button = render(target, (
            m('button',
                {
                    onclick: (e: MouseEvent) => {
                        expect(e.target).toBe(button);
                        count++;
                    },
                },
                'Click me',
            )
        ));
        dispatchClick(button);
        expect(count).toBe(1);

        dispatchClick(button);
        expect(count).toBe(2);

        render(target, (
            m('button',
                null,
                'Click me',
            )
        ));

        dispatchClick(button);
        expect(count).toBe(2);

        render(target, (
            m('button',
                {
                    onclick: (e: MouseEvent) => {
                        expect(e.target).toBe(button);
                        count = 0;
                    },
                },
                'Click me',
            )
        ));
        dispatchClick(button);
        expect(count).toBe(0);
    });

    test('components', () => {
        const Block = ({class: className}, ...children) => {
            return m('div', {class: className},
                ...children
            );
        };
        const Inline = ({class: className}, ...children) => {
            return m('span', {class: className},
                ...children
            );
        };
        const Wrapper = ({}, ...children) => {
            return m(Block, {class: 'wrapper'}, ...children);
        };

        const result = render(target, (
            m(Wrapper, null,
                m(Inline, {class: 's1'},
                    m(Inline, {class: 's2'},
                        'Hello',
                    ),
                    'World!'
                ),
            )
        ));

        expect(result).toBe(target);
        expect(result).toBeInstanceOf(HTMLDivElement);
        expect(result.className).toBe('wrapper');
        expect(result.childNodes.length).toBe(1);
        expect(result.childNodes.item(0)).toBeInstanceOf(HTMLSpanElement);
        expect((result.childNodes.item(0) as Element).className).toBe('s1');
        expect(result.childNodes.item(0).childNodes.length).toBe(2);
        expect(result.childNodes.item(0).childNodes.item(0)).toBeInstanceOf(HTMLSpanElement);
        expect((result.childNodes.item(0).childNodes.item(0) as Element).className).toBe('s2');
        expect(result.childNodes.item(0).childNodes.item(0).textContent).toBe('Hello');
        expect(result.childNodes.item(0).childNodes.item(1)).toBeInstanceOf(Text);
        expect(result.childNodes.item(0).childNodes.item(1).textContent).toBe('World!');
    });

    test('arrays', () => {
        const Numbers = ({items}, ...children) => {
            return [
                m('span', {id: 'x'}, '0'),
                items,
                m('div', null, '3'),
                ...children,
            ];
        };

        const result = render(target, (
            m('div', null,
                m(Numbers,
                    {
                        items: m(Array, null,
                            m('span', null, '1'),
                            m('span', null, '2'),
                        )
                    },
                    '4',
                ),
                [
                    '5',
                    m('span', null, '6'),
                    m('span', null, '7'),
                ],
            )
        ));

        expect(result.textContent).toBe('01234567');
        expect(result.childNodes.length).toBe(8);
    });

    test('component context', () => {
        const Component = (props, ...children) => {
            const {
                node,
                nodes,
                parent,
                store,
                refresh,
                spec,
                prev,
            } = getContext();
            const {count = 0} = store;

            return m(Array, null,
                m('button',
                    {
                        onclick: () => {
                            store.count = count + 1;
                            refresh();
                        }
                    },
                    'Click me',
                ),
                m('label', null, [
                    `store.count: ${count || 0}`,
                    `props.char: ${props.char || '-'}`,
                    `prev.props.char: ${prev ? prev.props.char : '-'}`,
                    `children: ${children.join(', ')}`,
                    `prev.children: ${prev ? prev.children.join(', ') : null}`,
                    `nodes.length: ${nodes.length}`,
                    `node is Button: ${node instanceof HTMLButtonElement}`,
                    `node[0] is Button: ${nodes[0] instanceof HTMLButtonElement}`,
                    `node[1] is Label: ${nodes[1] instanceof HTMLLabelElement}`,
                ].join('; ')),
                count < 2 ? null : 'Extra',
            )
        };

        const result = render(target, (
            m('div', null,
                m(Component, {char: 'x'}, 'A', 'B'),
            )
        ));

        expect(result.childNodes.length).toBe(2);

        const button = result.childNodes.item(0);
        const label = result.childNodes.item(1);
        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(label).toBeInstanceOf(HTMLLabelElement);
        expect(label.textContent).toBe([
            'store.count: 0',
            'props.char: x',
            'prev.props.char: -',
            'children: A, B',
            'prev.children: null',
            'nodes.length: 0',
            'node is Button: false',
            'node[0] is Button: false',
            'node[1] is Label: false',
        ].join('; '));

        dispatchClick(button as Element);
        expect(result.childNodes.length).toBe(2);
        expect(result.childNodes.item(0)).toBe(button);
        expect(result.childNodes.item(1)).toBe(label);
        expect(label.textContent).toBe([
            'store.count: 1',
            'props.char: x',
            'prev.props.char: x',
            'children: A, B',
            'prev.children: A, B',
            'nodes.length: 2',
            'node is Button: true',
            'node[0] is Button: true',
            'node[1] is Label: true',
        ].join('; '));

        render(target, (
            m('div', null,
                m(Component, {char: 'y'}, 'C', 'D'),
            )
        ));
        expect(result.childNodes.length).toBe(2);
        expect(result.childNodes.item(0)).toBe(button);
        expect(result.childNodes.item(1)).toBe(label);
        expect(label.textContent).toBe([
            'store.count: 1',
            'props.char: y',
            'prev.props.char: x',
            'children: C, D',
            'prev.children: A, B',
            'nodes.length: 2',
            'node is Button: true',
            'node[0] is Button: true',
            'node[1] is Label: true',
        ].join('; '));

        dispatchClick(button as Element);
        expect(result.childNodes.length).toBe(3);
        expect(result.childNodes.item(0)).toBe(button);
        expect(result.childNodes.item(1)).toBe(label);
        expect(target.childNodes.item(2)).toBeInstanceOf(Text);
        expect(target.childNodes.item(2).textContent).toBe('Extra');
        expect(label.textContent).toBe([
            'store.count: 2',
            'props.char: y',
            'prev.props.char: y',
            'children: C, D',
            'prev.children: C, D',
            'nodes.length: 2',
            'node is Button: true',
            'node[0] is Button: true',
            'node[1] is Label: true',
        ].join('; '));

        render(target, (
            m('div', null,
                m(Component, {char: 'y'}, 'C', 'D'),
            )
        ));
        expect(result.childNodes.length).toBe(3);
        expect(result.childNodes.item(0)).toBe(button);
        expect(result.childNodes.item(1)).toBe(label);
        expect(target.childNodes.item(2)).toBeInstanceOf(Text);
        expect(target.childNodes.item(2).textContent).toBe('Extra');
        expect(label.textContent).toBe([
            'store.count: 2',
            'props.char: y',
            'prev.props.char: y',
            'children: C, D',
            'prev.children: C, D',
            'nodes.length: 3',
            'node is Button: true',
            'node[0] is Button: true',
            'node[1] is Label: true',
        ].join('; '));
    });
});
