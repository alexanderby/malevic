import {html, render, sync} from 'malevic';
import withState from 'malevic/state';
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
        const Component = withState((props: {text: string; state; setState;}, ...children) => (
            <div class={{'empty': props.state.count === 0}}>
                <button onclick={() => props.setState({count: props.state.count + 1})}>
                    {props.text}
                </button> {props.state.count}
                {children}
            </div>
        ), {count: 0});

        const element = render(container, (
            <main>
                <Component text="Apples" key="a" />
            </main>
        ));
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
            '<div class="empty"><button>Oranges</button> 0</div>',
            '</div>',
        ].join(''));

        dispatchClick(element.querySelector('.empty button'));
        expect(element.innerHTML).toEqual([
            '<div><button>Apples</button> 1',
            '<div><button>Oranges</button> 1</div>',
            '</div>',
        ].join(''));

        dispatchClick(element.querySelector('button'));
        expect(element.innerHTML).toEqual([
            '<div><button>Apples</button> 2',
            '<div><button>Oranges</button> 1</div>',
            '</div>',
        ].join(''));
    });

    test('prevent infinite recursion', () => {
        const RecursiveComponent = withState(({state, setState}) => {
            setState({text: 5});
            return <span>{state.text}</span>;
        });

        expect(() => render(container, <RecursiveComponent />)).toThrow(/infinite recursion/);
    });

    test('call state after component update', () => {
        const Child = withState(({onChange, state, setState}, text) => (
            <button
                onclick={() => {
                    const count = state.count + 1;
                    onChange(count);
                    setState({count});
                }}
            >
                {text}
            </button>
        ), {count: 0});
        const Root = withState(({state, setState}) => (
            <div>
                {state.count}
                <Child onChange={(count) => {setState({count})}}>
                    {state.count > 0 ? 'Checked' : 'Unchecked'}
                </Child>
            </div>
        ));
        const element = render(container, <Root />);
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

    test('sync', () => {
        const Component = withState(
            ({state, setState}) => <button style={state.isActive ? {'color': 'red'} : {}} onclick={() => setState({isActive: true})} />,
            {isActiv: false}
        );
        const element = render(container, <button />);
        sync(element, <Component />);
        expect(element.outerHTML).toEqual('<button></button>');
        dispatchClick(element);
        expect(element.outerHTML).toEqual('<button style="color: red;"></button>');
    });
});
