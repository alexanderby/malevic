import {m} from 'malevic';
import {render, teardown, getContext, plugins} from 'malevic/dom';
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

function cleanup() {
    teardown(target);
    while (target.lastChild) {
        target.removeChild(target.lastChild);
    }
}

describe('DOM', () => {
    test('first time render', () => {
        const spec = {
            type: 'div',
            props: {class: 'c'},
            children: [
                {
                    type: 'span',
                    props: {},
                    children: [
                        'Hello',
                    ],
                },
                ' ',
                null,
                document.createTextNode('crazy'),
                ' ',
                {
                    type: 'span',
                    props: {},
                    children: [
                        'World!',
                    ],
                },
            ],
        };
        const result = render(target, spec);

        expect(result).toBe(target);
        expect(result.className).toBe('c');
        expect(result.childNodes.length).toBe(5);
        expect(result.childNodes.item(0)).toBeInstanceOf(HTMLSpanElement);
        expect(result.childNodes.item(1)).toBeInstanceOf(Text);
        expect(result.childNodes.item(2)).toBeInstanceOf(Text);
        expect(result.childNodes.item(3)).toBeInstanceOf(Text);
        expect(result.childNodes.item(4)).toBeInstanceOf(HTMLSpanElement);
        expect(result.childNodes.item(0).textContent).toBe('Hello');
        expect(result.childNodes.item(1).textContent).toBe(' ');
        expect(result.childNodes.item(2).textContent).toBe('crazy');
        expect(result.childNodes.item(3).textContent).toBe(' ');
        expect(result.childNodes.item(4).textContent).toBe('World!');

        cleanup();

        const text = document.createTextNode('x');
        target.appendChild(text);
        const textResult = render(text, m(() => 'y', null));

        expect(textResult).toBe(text);
        expect(text.textContent).toBe('y');
    });

    test('update', () => {
        const result1 = render(target, (
            m('div', {class: 'c1'},
                null,
                m('textarea', {readonly: true},
                    'Hello',
                ),
                ' ',
                m('span', null,
                    'World!',
                ),
            )
        ));

        expect(result1.childNodes.length).toBe(3);
        expect(result1.childNodes.item(0)).toBeInstanceOf(HTMLTextAreaElement);
        expect((result1.childNodes.item(0) as HTMLTextAreaElement).readOnly).toBe(true);
        expect(result1.childNodes.item(1)).toBeInstanceOf(Text);
        expect(result1.childNodes.item(2)).toBeInstanceOf(HTMLSpanElement);

        const area = result1.childNodes.item(0);
        const text = area.childNodes.item(0);
        const space = result1.childNodes.item(1);
        const span = result1.childNodes.item(2);

        const result2 = render(target, (
            m('div', {class: 'c2'},
                m('br', null),
                m('textarea', null,
                    'Aloha',
                ),
                ' ',
                m('div', null,
                    'World!',
                ),
            )
        ));

        expect(result1).toBe(result2);
        expect(result2.className).toBe('c2');
        expect(result2.childNodes.length).toBe(4);
        expect(result2.childNodes.item(0)).toBeInstanceOf(HTMLBRElement);
        expect(result2.childNodes.item(1)).toBeInstanceOf(HTMLTextAreaElement);
        expect((result1.childNodes.item(1) as HTMLTextAreaElement).className).toBe('');
        expect((result1.childNodes.item(1) as HTMLTextAreaElement).readOnly).toBe(false);
        expect(result2.childNodes.item(1)).toBe(area);
        expect(result2.childNodes.item(1)).toBe(area);
        expect(result2.childNodes.item(1).firstChild).toBe(text);
        expect(result2.childNodes.item(1).textContent).toBe('Aloha');
        expect(result2.childNodes.item(2)).toBeInstanceOf(Text);
        expect(result2.childNodes.item(2).textContent).toBe(' ');
        expect(result2.childNodes.item(2)).toBe(space);
        expect(result2.childNodes.item(3)).toBeInstanceOf(HTMLDivElement);
        expect(result2.childNodes.item(3).textContent).toBe('World!');
        expect(span.parentElement).toBe(null);

        cleanup();

        const n0 = document.createElement('span');
        const n1 = document.createElement('span');
        const n2 = document.createElement('span');
        target.append(n0, n1, n2);

        const r = render(n1, (
            m('span', {class: 'target'})
        ));

        expect(r).toBe(n1);
        expect(target.childNodes.length).toBe(3);
        expect(target.childNodes.item(0)).toBe(n0);
        expect(target.childNodes.item(1)).toBe(n1);
        expect(target.childNodes.item(2)).toBe(n2);
        expect(r.className).toBe('target');
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

        const onclick = (e: MouseEvent) => {
            expect(e.target).toBe(button);
            count--;
        };

        render(target, m('button', {onclick}, 'Click me'));
        dispatchClick(button);
        expect(count).toBe(1);

        render(target, m('button', {onclick}, 'Click me'));
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
            expect(parent).toBe(target);
            expect(spec.type).toBe(Component);
            expect(spec.props).toEqual(props);
            expect(spec.children).toEqual(children);
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

    test('refresh part of VDOM', () => {
        const A = ({x}, ...children) => {
            const context = getContext();
            const {count = 0} = context.store;
            const onclick = () => {
                context.store.count = count + 1;
                context.refresh();
            };
            return m('div', {class: 'a', 'data-count': count + x, onclick}, ...children);
        };
        const B = ({x, extra}, ...children) => {
            const context = getContext();
            const {b1 = 1, b2 = 1} = context.store;
            const onB1Click = () => {
                context.store.b1 = b1 + 1;
                context.refresh();
            };
            const onB2Click = (e: MouseEvent) => {
                e.stopPropagation();
                context.store.b2 = b2 + 1;
                context.refresh();
            };
            return [
                extra ? m('label', null, 'extra') : null,
                m('span', {class: 'b1', key: 1, onclick: onB1Click}, String(b1 + x)),
                ...children,
                m('span', {class: 'b2', key: 2, onclick: onB2Click}, String(b2 + x)),
            ];
        };

        const a = render(target, (
            m(A, {x: 5},
                m(B, {x: 3, extra: false}),
            )
        )) as HTMLElement;
        const b1 = a.querySelector('.b1');
        const b2 = a.querySelector('.b2');
        const p = a.parentElement;

        expect(a).toBe(target);
        expect(a.className).toBe('a');
        expect(a.dataset.count).toBe('5');
        expect(a.childNodes.length).toBe(2);
        expect(a.childNodes.item(0)).toBe(b1);
        expect(a.childNodes.item(1)).toBe(b2);
        expect(b1.textContent).toBe('4');
        expect(b2.textContent).toBe('4');

        dispatchClick(b1);
        expect(a.dataset.count).toBe('6');
        expect(a.childNodes.length).toBe(2);
        expect(a.querySelector('.b1')).toBe(b1);
        expect(a.querySelector('.b2')).toBe(b2);
        expect(b1.textContent).toBe('5');
        expect(b2.textContent).toBe('4');

        dispatchClick(b2);
        expect(a.dataset.count).toBe('6');
        expect(a.childNodes.length).toBe(2);
        expect(a.querySelector('.b1')).toBe(b1);
        expect(a.querySelector('.b2')).toBe(b2);
        expect(b1.textContent).toBe('5');
        expect(b2.textContent).toBe('5');

        dispatchClick(a);
        expect(a.parentNode).toBe(p);
        expect(a.dataset.count).toBe('7');
        expect(a.childNodes.length).toBe(2);
        expect(a.childNodes.item(0)).toBe(b1);
        expect(a.childNodes.item(1)).toBe(b2);
        expect(b1.textContent).toBe('5');
        expect(b2.textContent).toBe('5');

        const a2 = render(target, (
            m(A, {x: 0},
                m(B, {x: 0, extra: true}),
            )
        ));

        expect(a2).toBe(a);
        expect(a.className).toBe('a');
        expect(a.dataset.count).toBe('2');
        expect(a.childNodes.length).toBe(3);
        expect(a.childNodes.item(0).textContent).toBe('extra');
        expect(a.childNodes.item(1)).toBe(b1);
        expect(a.childNodes.item(2)).toBe(b2);
        expect(b1.textContent).toBe('2');
        expect(b2.textContent).toBe('2');

        render(target, (
            m(A, {x: 0},
                m(B, {x: 0, extra: true},
                    'placeholder',
                ),
            )
        ));

        expect(a.childNodes.length).toBe(4);
        expect(a.childNodes.item(0).textContent).toBe('extra');
        expect(a.childNodes.item(1)).toBe(b1);
        expect(a.childNodes.item(2).textContent).toBe('placeholder');
        expect(a.childNodes.item(3)).toBe(b2);
        expect(b1.textContent).toBe('2');
        expect(b2.textContent).toBe('2');

        dispatchClick(b1);
        expect(a.dataset.count).toBe('3');
        expect(a.childNodes.length).toBe(4);
        expect(a.childNodes.item(0).textContent).toBe('extra');
        expect(a.childNodes.item(1)).toBe(b1);
        expect(a.childNodes.item(2).textContent).toBe('placeholder');
        expect(a.childNodes.item(3)).toBe(b2);
        expect(b1.textContent).toBe('3');
        expect(b2.textContent).toBe('2');

        cleanup();

        const Refresher = () => {
            const context = getContext();
            context.refresh();
            return null;
        };
        expect(() => render(target, m(Refresher, null))).toThrow(/infinite loop/);
    });

    test('DOM node as a child', () => {
        const A = ({}, ...children) => {
            let domNode: HTMLElement;
            const existing = getContext().node;
            if (existing) {
                domNode.classList.add('b');
            } else {
                domNode = document.createElement('span');
                render(domNode, (
                    m('span',
                        {class: 'a'},
                        ...children
                    ))
                );
            }
            return domNode;
        };

        render(target, (
            m('div', null,
                m('span', null),
                m(A, null),
            )
        ));

        expect(target.childNodes.length).toBe(2);
        expect((target.childNodes.item(0) as HTMLElement).className).toBe('');
        expect((target.childNodes.item(1) as HTMLElement).className).toBe('a');
    });

    test('match by key', () => {
        const keys = [{}, 3, 's', true];
        render(target, m('div', null,
            m('span', {key: keys[0]}),
            m('span', {key: keys[1]}),
            m('b', null),
            m('i', null),
            m('span', {key: keys[2]}),
            m('span', {key: keys[3]}),
            m('a', null),
        ));
        const nodes = Array.from(target.childNodes);

        render(target, m('div', null,
            m('span', {key: keys[1]}),
            m('span', {key: keys[3]}),
            m('a', null),
            m('i', null),
            m('b', null),
            m('span', {key: keys[2]}),
        ));

        expect(target.childNodes.item(0)).toBe(nodes[1]);
        expect(target.childNodes.item(1)).toBe(nodes[5]);
        expect(nodes.includes(target.childNodes.item(2))).toBe(false);
        expect(target.childNodes.item(3)).toBe(nodes[3]);
        expect(nodes.includes(target.childNodes.item(4))).toBe(false);
        expect(target.childNodes.item(5)).toBe(nodes[4]);

        const List = ({items}) => {
            return m('ul', null,
                ...items.map((item) => m(Item, {label: item, key: item})),
            );
        };
        const Item = ({label}) => {
            return m('li', null, label);
        };

        render(target, m('div', null,
            List({
                items: [
                    'A',
                    'B',
                    'C',
                    'D',
                ]
            }),
        ));

        expect(target.firstChild.childNodes.length).toBe(4);

        const [a, b, c, d] = Array.from(target.firstChild.childNodes);

        render(target, m('div', null,
            List({
                items: [
                    'D',
                    'C',
                    'A',
                    'B',
                ]
            }),
        ));

        expect(target.firstChild.childNodes.item(0)).toBe(d);
        expect(target.firstChild.childNodes.item(1)).toBe(c);
        expect(target.firstChild.childNodes.item(2)).toBe(a);
        expect(target.firstChild.childNodes.item(3)).toBe(b);

        const A = () => m('span', null);
        const B = () => m('span', null);

        render(target, (
            m('div', null,
                m('span', {key: 0}),
                m('span', {key: 1}),
                m(A, {key: 2}),
                m(A, {key: 3}),
            )
        ));
        const s = Array.from(target.childNodes);

        render(target, (
            m('div', null,
                m('a', {key: 0}),
                m('span', {key: 1}),
                m(B, {key: 2}),
                m(A, {key: 3}),
            )
        ));

        expect(s.includes(target.childNodes.item(0))).toBe(false);
        expect(target.childNodes.item(1)).toBe(s[1]);
        expect(s.includes(target.childNodes.item(2))).toBe(false);
        expect(target.childNodes.item(3)).toBe(s[3]);

        expect(
            () => render(target, m('div', null, m('span', {key: 0}), m('span', {key: 0})))
        ).toThrow('Duplicate key');
    });

    test('leave without changes', () => {
        const Component = ({x}) => {
            const context = getContext();
            const {prev} = context;
            if (x === -1 || (prev && prev.props.x === x)) {
                return context.leave();
            }
            return m(Item, null);
        };
        const Item = () => {
            const {store} = getContext();
            const {times = 0} = store;
            store.times = times + 1;
            switch (store.times) {
                case 1: {
                    return m('div', null);
                }
                case 2: {
                    return m('span', null);
                }
                default: {
                    return m('a', null);
                }
            }
        };

        render(target, (
            m('div', null,
                m(Component, {x: -1}),
                m(Component, {x: -1}),
                m(Component, {x: -1}),
            )
        ));
        expect(target.childNodes.length).toBe(0);

        render(target, (
            m('div', null,
                m(Component, {x: -1}),
                m(Component, {x: 0}),
                m(Component, {x: 0}),
            )
        ));
        expect(target.childNodes.length).toBe(2);
        expect(target.childNodes.item(0)).toBeInstanceOf(HTMLDivElement);
        expect(target.childNodes.item(1)).toBeInstanceOf(HTMLDivElement);

        const n1 = target.childNodes.item(0);
        const n2 = target.childNodes.item(1);
        render(target, (
            m('div', null,
                m(Component, {x: 0}),
                m(Component, {x: 0}),
                m(Component, {x: 0}),
            )
        ));
        expect(target.childNodes.item(0)).toBeInstanceOf(HTMLDivElement);
        expect(target.childNodes.item(1)).toBeInstanceOf(HTMLDivElement);
        expect(target.childNodes.item(2)).toBeInstanceOf(HTMLDivElement);
        expect(target.childNodes.item(1)).toBe(n1);
        expect(target.childNodes.item(2)).toBe(n2);

        render(target, (
            m('div', null,
                m(Component, {x: 0}),
                m(Component, {x: 1}),
                m(Component, {x: 1}),
            )
        ));
        expect(target.childNodes.item(0)).toBeInstanceOf(HTMLDivElement);
        expect(target.childNodes.item(1)).toBeInstanceOf(HTMLSpanElement);
        expect(target.childNodes.item(2)).toBeInstanceOf(HTMLSpanElement);

        render(target, (
            m('div', null,
                m(Component, {x: 0}),
                m(Component, {x: 1}),
                m(Component, {x: 2}),
            )
        ));
        expect(target.childNodes.item(0)).toBeInstanceOf(HTMLDivElement);
        expect(target.childNodes.item(1)).toBeInstanceOf(HTMLSpanElement);
        expect(target.childNodes.item(2)).toBeInstanceOf(HTMLAnchorElement);

        cleanup();

        let attached: Node;
        let updated: Node;

        const Dummy = () => {
            const context = getContext();
            context.attached((node) => attached = node);
            context.updated((node) => updated = node);
            if (!context.store.init) {
                context.store.init = true;
                return context.leave();
            }
            if (context.store.clicked) {
                (context.node as HTMLElement).classList.add('awaiting');
                context.store.clicked = false;
                return context.leave();
            }
            return m('button', {
                class: {
                    'init': context.store.init,
                },
                onclick: () => {
                    context.store.clicked = true;
                    context.refresh();
                },
            });
        };

        render(target, <div><Dummy /></div>);
        expect(target.firstChild).toBe(null);
        expect(attached).toBe(null);

        render(target, <div><Dummy /></div>);
        expect(target.firstChild).toBeInstanceOf(HTMLButtonElement);
        expect(updated).toBe(target.firstChild);

        dispatchClick(target.firstElementChild);
        expect(target.firstElementChild.className).toBe('init awaiting');

        render(target, <div><Dummy /></div>);
        expect(target.firstElementChild.className).toBe('init');
    });

    test('lifecycle', () => {
        const attachedNodes = [];
        const detachedNodes = [];
        const updatedNodes = [];

        const attached = (...nodes: Node[]) => attachedNodes.push(...nodes.map((n) => (n as Element).className));
        const detached = (...nodes: Node[]) => detachedNodes.push(...nodes.map((n) => (n as Element).className));
        const updated = (...nodes: Node[]) => updatedNodes.push(...nodes.map((n) => (n as Element).className));

        render(target, (
            m('div', {class: 'n0', attached, detached, updated},
                m('span', {class: 'n0-0', attached, detached, updated},
                    m('span', {class: 'n0-0-0', attached, detached, updated}),
                    m('span', {class: 'n0-0-1', attached, detached, updated}),
                ),
                m('span', {class: 'n0-1', attached, detached, updated},
                    null,
                    m('span', {class: 'n0-1-1', attached, detached, updated}),
                ),
            )
        ));

        expect(attachedNodes.join(' ')).toBe('n0-0-0 n0-0-1 n0-0 n0-1-1 n0-1 n0');
        expect(detachedNodes.join(' ')).toBe('');
        expect(updatedNodes.join(' ')).toBe('');

        attachedNodes.splice(0);
        detachedNodes.splice(0);
        updatedNodes.splice(0);

        render(target, (
            m('div', {class: 'n0', attached, detached, updated},
                m('div', {class: 'x0-0', attached, detached, updated},
                    m('span', {class: 'x0-0-0', attached, detached, updated}),
                    m('span', {class: 'x0-0-1', attached, detached, updated}),
                ),
                m('span', {class: 'n0-1', attached, detached, updated},
                    m('span', {class: 'n0-1-0', attached, detached, updated}),
                    m('span', {class: 'n0-1-1', attached, detached, updated}),
                ),
            )
        ));

        expect(attachedNodes.join(' ')).toBe('x0-0-0 x0-0-1 x0-0 n0-1-0');
        expect(detachedNodes.join(' ')).toBe('n0-0-0 n0-0-1 n0-0');
        expect(updatedNodes.join(' ')).toBe('n0-1-1 n0-1 n0');

        cleanup();
        attachedNodes.splice(0);
        detachedNodes.splice(0);
        updatedNodes.splice(0);

        const Component = ({class: className}, ...children) => {
            const context = getContext();
            const name = className.toUpperCase();
            context.attached((...nodes) => attachedNodes.push(`${name}(${nodes.filter((n) => n).map((n: Element) => n.className).join(', ')})`));
            context.detached((...nodes) => detachedNodes.push(`${name}(${nodes.filter((n) => n).map((n: Element) => n.className).join(', ')})`));
            context.updated((...nodes) => updatedNodes.push(`${name}(${nodes.filter((n) => n).map((n: Element) => n.className).join(', ')})`));
            return m('div', {class: className, attached, detached, updated}, ...children);
        };
        const Wrapper = ({name, shouldUpdate}, ...children) => {
            const context = getContext();
            context.attached((...nodes) => attachedNodes.push(`${name}(${nodes.filter((n) => n).map((n: Element) => n.className).join(', ')})`));
            context.detached((...nodes) => detachedNodes.push(`${name}(${nodes.filter((n) => n).map((n: Element) => n.className).join(', ')})`));
            context.updated((...nodes) => updatedNodes.push(`${name}(${nodes.filter((n) => n).map((n: Element) => n.className).join(', ')})`));
            if (!shouldUpdate) {
                return context.leave();
            }
            switch (children.length) {
                case 0: {
                    return null;
                }
                case 1: {
                    return children[0];
                }
                default: {
                    return children;
                }
            }
        };

        render(target, (
            m(Component, {class: 'c0'},
                m(Component, {class: 'c1'}),
                m(Wrapper, {name: 'W2', shouldUpdate: true},
                    m(Component, {class: 'c3'},
                        null,
                        m(Component, {class: 'c4'})
                    ),
                    m(Wrapper, {name: 'W5', shouldUpdate: false},
                        m(Component, {class: 'c6'}),
                    ),
                ),
            )
        ));

        expect(attachedNodes.join(' ')).toBe('c1 C1(c1) c4 C4(c4) c3 C3(c3) W5() W2(c3) c0 C0(c0)');
        expect(detachedNodes.join(' ')).toBe('');
        expect(updatedNodes.join(' ')).toBe('');

        attachedNodes.splice(0);
        detachedNodes.splice(0);
        updatedNodes.splice(0);

        render(target, (
            m(Component, {class: 'c0'},
                null,
                m(Wrapper, {name: 'W2', shouldUpdate: false},
                    m(Component, {class: 'c3'},
                        m(Component, {class: 'c7'}),
                        m(Component, {class: 'c4'})
                    ),
                    m(Wrapper, {name: 'W5', shouldUpdate: true},
                        m(Component, {class: 'c6'}),
                    ),
                ),
            )
        ));

        expect(attachedNodes.join(' ')).toBe('');
        expect(detachedNodes.join(' ')).toBe('c1 C1(c1)');
        expect(updatedNodes.join(' ')).toBe('c0 C0(c0)');

        attachedNodes.splice(0);
        detachedNodes.splice(0);
        updatedNodes.splice(0);

        render(target, (
            m(Component, {class: 'c0'},
                null,
                m(Wrapper, {name: 'W2', shouldUpdate: true},
                    m(Component, {class: 'c3'},
                        m(Component, {class: 'c7'}),
                        m(Component, {class: 'c4'})
                    ),
                    m(Wrapper, {name: 'W5', shouldUpdate: true},
                        m(Component, {class: 'c6'}),
                    ),
                ),
            )
        ));

        expect(attachedNodes.join(' ')).toBe('c7 C7(c7) c6 C6(c6)');
        expect(detachedNodes.join(' ')).toBe('');
        expect(updatedNodes.join(' ')).toBe('c4 C4(c4) c3 C3(c3) W5(c6) W2(c3, c6) c0 C0(c0)');

        expect(target.className).toBe('c0');
        expect(target.childNodes.length).toBe(2);
        expect((target.childNodes.item(0) as Element).className).toBe('c3');
        expect(target.childNodes.item(0).childNodes.length).toBe(2);
        expect((target.childNodes.item(0).childNodes.item(0) as Element).className).toBe('c7');
        expect((target.childNodes.item(0).childNodes.item(1) as Element).className).toBe('c4');
        expect((target.childNodes.item(1) as Element).className).toBe('c6');
    });

    test('special attributes', () => {
        const element = render(target, (
            m('div', {
                class: 'c',
                style: 'background-color: red;',
            })
        )) as HTMLElement;
        expect(element.className).toBe('c');
        expect(element.style.backgroundColor).toBe('red');
        expect(element.style.getPropertyPriority('background-color')).toBe('');

        render(target, (
            m('div', {
                class: {'a': true, 'b': false},
                style: {'background-color': 'blue'}
            })
        ));
        expect(element.className).toBe('a');
        expect(element.style.backgroundColor).toBe('blue');
        expect(element.style.getPropertyPriority('background-color')).toBe('');

        render(target, (
            m('div', {
                class: ['c', false, 'd', {'e': true, 'f': false}],
                style: {'background-color': 'blue !important'}
            })
        ));
        expect(element.className).toBe('c d e');
        expect(element.style.backgroundColor).toBe('blue');
        expect(element.style.getPropertyPriority('background-color')).toBe('important');

        render(target, (
            m('div', {style: {}})
        ));
        expect(element.className).toBe('');
        expect(element.style.backgroundColor).toBe('');
        expect(element.style.getPropertyPriority('background-color')).toBe('');
    });

    test('plugins', () => {
        const withRGBColor = (Component) => {
            plugins.setAttribute.add(Component, ({element, attr, value, prev}) => {
                if (attr === 'color' && Array.isArray(value)) {
                    if (Array.isArray(value)) {
                        const shouldUpdate = !Array.isArray(prev) || !(value.every((v, i) => v[i] === prev[i]));
                        if (shouldUpdate) {
                            (element as HTMLElement).style.color = `rgb(${value[0]}, ${value[1]}, ${value[2]})`;
                        }
                    } else {
                        (element as HTMLElement).style.color = '';
                    }
                    if (prev) {
                        (element as HTMLElement).dataset.prevRGB = prev.join(' ');
                    }
                    return true;
                }
                return null;
            });
            plugins.setAttribute.add(Component, ({element, attr, value}) => {
                if (attr === 'bg') {
                    (element as HTMLElement).style.background = value;
                    return true;
                }
                return null;
            });
            return Component;
        };

        const Colored = withRGBColor(({color}, ...children) => {
            return m('span', {color, class: 'colored'}, ...children);
        });

        render(target, (
            m('div', {color: [0, 0, 0]},
                m(Colored, {color: [0, 0, 0]},
                    m('span', {color: null}),
                    m(Colored, {color: [128, 128, 128]},
                        m('span', {color: [0, 0, 0], bg: 'black'}),
                    ),
                    m('span', {color: [255, 128, 0]}),
                ),
                m('span', {color: [0, 128, 255]}),
            )
        ));

        expect(target.getAttribute('color')).toBe('0,0,0');
        expect(target.hasAttribute('style')).toBe(false);
        expect(target.children[0].className).toBe('colored');
        expect(target.children[0].hasAttribute('color')).toBe(false);
        expect(target.children[0].getAttribute('style')).toBe('color: rgb(0, 0, 0);');
        expect(target.children[0].children[0].hasAttribute('color')).toBe(false);
        expect(target.children[0].children[0].hasAttribute('style')).toBe(false);
        expect(target.children[0].children[1].className).toBe('colored');
        expect(target.children[0].children[1].hasAttribute('color')).toBe(false);
        expect(target.children[0].children[1].getAttribute('style')).toBe('color: rgb(128, 128, 128);');
        expect(target.children[0].children[1].children[0].hasAttribute('color')).toBe(false);
        expect(target.children[0].children[1].children[0].getAttribute('style')).toBe('color: rgb(0, 0, 0); background: black;');
        expect(target.children[0].children[2].hasAttribute('color')).toBe(false);
        expect(target.children[0].children[2].getAttribute('style')).toBe('color: rgb(255, 128, 0);');
        expect(target.children[1].getAttribute('color')).toBe('0,128,255');
        expect(target.children[1].hasAttribute('style')).toBe(false);

        render(target, (
            m('div', {color: [0, 0, 0]},
                m(Colored, {color: [255, 255, 255]}),
                m('span', {color: [0, 128, 255]}),
            )
        ));

        expect(target.getAttribute('color')).toBe('0,0,0');
        expect(target.hasAttribute('style')).toBe(false);
        expect(target.children[0].className).toBe('colored');
        expect(target.children[0].hasAttribute('color')).toBe(false);
        expect(target.children[0].getAttribute('style')).toBe('color: rgb(255, 255, 255);');
        expect(target.children[0].getAttribute('data-prev-r-g-b')).toBe('0 0 0');
        expect(target.children[1].getAttribute('color')).toBe('0,128,255');
        expect(target.children[1].hasAttribute('style')).toBe(false);

        cleanup();

        const XHTML_NS = 'http://www.w3.org/1999/xhtml';
        const SVG_NS = 'http://www.w3.org/2000/svg';

        const withSVGNamespace = (Component) => {
            plugins.createElement.add(Component, ({spec, parent}) => {
                if (spec.type.startsWith('svg:')) {
                    const tag = spec.type.substring(4);
                    return document.createElementNS(SVG_NS, tag);
                }
                return null;
            });
            return Component;
        };

        const App = withSVGNamespace(({}, ...children) => {
            return m('div', null, ...children);
        });

        render(target, (
            m(App, null,
                m('svg:a', null),
                m('a', null),
            )
        ));

        expect(target.namespaceURI).toBe(XHTML_NS);
        expect(target.children[0].namespaceURI).toBe(SVG_NS);
        expect(target.children[1].namespaceURI).toBe(XHTML_NS);
    });

    test('render to existing DOM', () => {
        target.innerHTML = [
            '<div class="app">',
            '  \n',
            '  <h1>Heading</h1>',
            '  <!---->',
            '  <article>',
            '    <p>',
            '      Line 1',
            '      Line 2',
            '    </p>',
            '  </article>',
            '  <input type="number" value="0">',
            '  <input type="number" value="1">',
            '  <span class="unmatched"></span>',
            '  <input type="number" value="2">',
            '</div>',
        ].join('\n');

        const div = target.firstChild as HTMLDivElement;
        const newline = div.firstChild as Text;
        const heading = newline.nextSibling as HTMLHeadingElement;
        const comment = heading.nextSibling.nextSibling as Comment;
        const article = comment.nextSibling.nextSibling as HTMLElement;
        const p = article.firstChild.nextSibling as HTMLParagraphElement;
        const text = p.firstChild as Text;
        const inputs = Array.from(div.getElementsByTagName('input')) as HTMLInputElement[];
        const unmatched = div.querySelector('.unmatched') as HTMLSpanElement;

        expect(div).toBeInstanceOf(HTMLDivElement);
        expect(div.className).toBe('app');
        expect(newline).toBeInstanceOf(Text);
        expect(newline.textContent.includes('\n')).toBe(true);
        expect(heading).toBeInstanceOf(HTMLHeadingElement);
        expect(heading.textContent).toBe('Heading');
        expect(comment).toBeInstanceOf(Comment);
        expect(article).toBeInstanceOf(HTMLElement);
        expect(article.tagName).toBe('ARTICLE');
        expect(p).toBeInstanceOf(HTMLParagraphElement);
        expect(p.childNodes.length).toBe(1);
        expect(text).toBe(p.firstChild);
        expect(text.textContent).toMatch(/^\s*Line 1\s*\n\s*Line 2\s*$/);
        expect(inputs.every((el) => el instanceof HTMLInputElement)).toBe(true);
        expect(inputs.length).toBe(3);
        expect(unmatched).toBeInstanceOf(HTMLSpanElement);

        let attachedNode: Node;

        const App = () => {
            const context = getContext();
            context.attached((node) => attachedNode = node);
            return (
                m('div',
                    {
                        class: {
                            'app': true,
                            'rendered': context.node != null,
                        },
                    },
                    m('h1', null,
                        'Heading',
                    ),
                    context.node == null ? null : (() => {const b = document.createElement('button'); b.classList.add('sb'); return b;})(),
                    m(Article, {text: 'Line 1\nLine 2'}),
                    m(Numbers, {values: [3, 2, 1, 0, -1]}),
                )
            );
        };

        let attachedArticle: Node;

        const Article = ({text}) => {
            return m('article', {attached: (node) => attachedArticle = node},
                m('p', null, text),
            );
        };

        let attachedNumbers: Node[];

        const Numbers = ({values}) => {
            const context = getContext();
            context.attached((...nodes) => attachedNumbers = nodes);
            return values.map((v) => (
                m('input', {
                    type: 'number',
                    attached: (node: HTMLInputElement) => node.value = v,
                })
            ));
        };

        render(target.firstElementChild, m(App, null));

        expect(target.firstElementChild).toBe(div);
        expect(attachedNode).toBe(div);
        expect(div.className).toBe('app rendered');
        expect(div.childNodes.length).toBe(8);
        expect(div.childNodes.item(0)).toBe(heading);
        expect(heading.textContent).toBe('Heading');
        expect(div.childNodes.item(1)).toBeInstanceOf(HTMLButtonElement);
        expect(comment.parentNode).toBe(null);
        expect(attachedArticle).toBe(article);
        expect(div.childNodes.item(2)).toBe(article);
        expect(article.childNodes.length).toBe(1);
        expect(article.childNodes.item(0)).toBe(p);
        expect(p.childNodes.length).toBe(1);
        expect(p.childNodes.item(0)).toBe(text);
        expect(text.textContent).toMatch(/^\s*Line 1\s*\n\s*Line 2\s*$/);
        expect(attachedNumbers.every((n, i) => n === inputs[i]));
        expect(div.childNodes.item(3)).toBeInstanceOf(HTMLInputElement);
        expect(div.childNodes.item(4)).toBeInstanceOf(HTMLInputElement);
        expect(div.childNodes.item(5)).toBeInstanceOf(HTMLInputElement);
        expect(div.childNodes.item(6)).toBeInstanceOf(HTMLInputElement);
        expect(div.childNodes.item(7)).toBeInstanceOf(HTMLInputElement);
        expect((div.childNodes.item(3) as HTMLInputElement).value).toBe('3');
        expect((div.childNodes.item(4) as HTMLInputElement).value).toBe('2');
        expect((div.childNodes.item(5) as HTMLInputElement).value).toBe('1');
        expect((div.childNodes.item(6) as HTMLInputElement).value).toBe('0');
        expect((div.childNodes.item(7) as HTMLInputElement).value).toBe('-1');
    });

    test('namespaces', () => {
        render(target, <div><svg><g /></svg></div>);
        expect(target.firstElementChild).toBeInstanceOf(SVGSVGElement);
        expect(target.firstElementChild.firstChild.namespaceURI).toBe(target.firstElementChild.namespaceURI);

        const FAKE_NAMESPACE = 'http://fake.org/v1';
        const el = document.createElementNS(FAKE_NAMESPACE, 'fake');
        render(el, <fake><proove /></fake>);
        expect(el.firstElementChild.tagName).toBe('proove');
        expect(el.firstElementChild.namespaceURI).toBe(FAKE_NAMESPACE);
    });

    test('unsupported spec', () => {
        expect(() => render(target, m('div', null, true as any))).toThrow(/Unable to create virtual node for spec/);
        expect(() => render(target, m('div', null, {} as any))).toThrow(/Unable to create virtual node for spec/);
        expect(() => render(target, m('div', null, 0 as any))).toThrow(/Unable to create virtual node for spec/);
        expect(() => render(target, m('div', null, (() => null) as any))).toThrow(/Unable to create virtual node for spec/);
    });
});
