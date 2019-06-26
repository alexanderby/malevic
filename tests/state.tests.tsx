import {m} from 'malevic';
import {render} from 'malevic/dom';
import {withState, useState} from 'malevic/state';
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

describe('state', () => {
    test('stateful component', () => {
        const Component = withState(({text}, ...children) => {
            const {state, setState} = useState({count: 0});
            return (
                <div class={{'empty': state.count === 0}}>
                    <button onclick={() => setState({count: state.count + 1})}>
                        {text}
                    </button> {String(state.count)}
                    {children.length > 0 ? (
                        <span>
                            {children}
                        </span>
                    ) : null}
                </div>
            );
        });

        const element = render(container, (
            <main>
                <Component text="Apples" key="a" />
            </main>
        )).firstElementChild;
        expect(element.innerHTML).toEqual([
            '<div class="empty"><button>Apples</button> 0</div>',
        ].join(''));

        dispatchClick(element.querySelector('button'));
        expect(element.innerHTML).toEqual([
            '<div><button>Apples</button> 1</div>',
        ].join(''));

        render(container, (
            <main>
                <Component text="Oranges" key="o" />
                <Component text="Apples" key="a" />
            </main>
        ));
        expect(element.innerHTML).toEqual([
            '<div class="empty"><button>Oranges</button> 0</div>',
            '<div><button>Apples</button> 1</div>',
        ].join(''));

        const buttons = Array.from(element.querySelectorAll('button'));
        buttons.forEach(dispatchClick);
        expect(element.innerHTML).toEqual([
            '<div><button>Oranges</button> 1</div>',
            '<div><button>Apples</button> 2</div>',
        ].join(''));

        render(container, (
            <main>
                <Component text="Oranges" key="o" />
            </main>
        ));
        expect(element.innerHTML).toEqual([
            '<div><button>Oranges</button> 1</div>',
        ].join(''));

        render(container, (
            <main>
                <Component text="Apples" key="a" />
                <Component text="Oranges" key="o" />
            </main>
        ));
        expect(element.innerHTML).toEqual([
            '<div class="empty"><button>Apples</button> 0</div>',
            '<div><button>Oranges</button> 1</div>',
        ].join(''));

        dispatchClick(element.querySelector('button'));
        expect(element.innerHTML).toEqual([
            '<div><button>Apples</button> 1</div>',
            '<div><button>Oranges</button> 1</div>',
        ].join(''));

        render(container, (
            <main>
                <Component text="Apples" key="a">
                    <Component text="Oranges" key="o" />
                </Component>
            </main>
        ));
        expect(element.innerHTML).toEqual([
            '<div><button>Apples</button> 1',
            '<span>',
            '<div class="empty"><button>Oranges</button> 0</div>',
            '</span>',
            '</div>',
        ].join(''));

        dispatchClick(element.querySelector('.empty button'));
        expect(element.innerHTML).toEqual([
            '<div><button>Apples</button> 1',
            '<span>',
            '<div><button>Oranges</button> 1</div>',
            '</span>',
            '</div>',
        ].join(''));

        dispatchClick(element.querySelector('button'));
        expect(element.innerHTML).toEqual([
            '<div><button>Apples</button> 2',
            '<span>',
            '<div><button>Oranges</button> 1</div>',
            '</span>',
            '</div>',
        ].join(''));
    });

    test('multiple state props', () => {
        const Component = withState(({x}) => {
            const {state: {y, z}, setState} = useState({y: 20, z: 30});
            return (
                <div>
                    <button class="y" onclick={() => setState({y: y + 1})}></button>
                    <button class="z" onclick={() => setState({z: z + 1})}></button>
                    <p>{`x: ${x}; y: ${y}; z: ${z};`}</p>
                </div>
            );
        });

        render(container, <Component x={10} />);
        expect(container.querySelector('p').textContent).toEqual('x: 10; y: 20; z: 30;');

        dispatchClick(container.querySelector('.y'));
        expect(container.querySelector('p').textContent).toEqual('x: 10; y: 21; z: 30;');

        render(container, <Component x={11} />);
        expect(container.querySelector('p').textContent).toEqual('x: 11; y: 21; z: 30;');

        dispatchClick(container.querySelector('.z'));
        expect(container.querySelector('p').textContent).toEqual('x: 11; y: 21; z: 31;');
    });

    test('prevent infinite recursion', () => {
        const RecursiveComponent = withState(() => {
            const {state, setState} = useState({text: 0});
            setState({text: 5});
            return <span>{state.text}</span>;
        });

        expect(() => render(container, <RecursiveComponent />)).toThrow(/infinite loop/);
    });

    test('call state after component update', () => {
        const Child = withState(({onChange}, text) => {
            const {state, setState} = useState({count: 0});
            return (
                <button
                    onclick={() => {
                        const count = state.count + 1;
                        onChange(count);
                        setState({count});
                    }}
                >
                    {text}
                </button>
            );
        });
        const Root = withState(() => {
            const {state, setState} = useState({count: 0});
            return (
                <div>
                    {String(state.count)}
                    <Child onChange={(count) => {
                        setState({count});
                    }}>
                        {state.count > 0 ? 'Checked' : 'Unchecked'}
                    </Child>
                </div>
            );
        });
        const element = render(container, <Root />).firstElementChild;
        dispatchClick(element.querySelector('button'));
        dispatchClick(element.querySelector('button'));
        expect(element.outerHTML).toEqual([
            '<div>',
            '2',
            '<button>',
            'Checked',
            '</button>',
            '</div>',
        ].join(''));
    });
});
