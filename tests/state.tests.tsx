import { html, render } from '../src';
import withState from '../src/state';
import { dispatchClick } from './utils';

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
        const Component = withState(function Component(props: { text: string; state; setState; }, ...children) {
            return (
                <div class={{ 'empty': props.state.count === 0 }}>
                    <button onclick={() => props.setState({ count: props.state.count + 1 })}>
                        {props.text}
                    </button> {props.state.count}
                    {children}
                </div>
            );
        }, { count: 0 });

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
            '<div class=""><button>Apples</button> 1</div>',
        ].join(''));

        render(container, (
            <main>
                <Component text="Oranges" key="o" />
                <Component text="Apples" key="a" />
            </main>
        ));
        expect(element.innerHTML).toEqual([
            '<div class="empty"><button>Oranges</button> 0</div>',
            '<div class=""><button>Apples</button> 1</div>',
        ].join(''));

        const buttons = Array.from(element.querySelectorAll('button'));
        buttons.forEach(dispatchClick);
        expect(element.innerHTML).toEqual([
            '<div class=""><button>Oranges</button> 1</div>',
            '<div class=""><button>Apples</button> 2</div>',
        ].join(''));

        render(container, (
            <main>
                <Component text="Oranges" key="o" />
            </main>
        ));
        expect(element.innerHTML).toEqual([
            '<div class=""><button>Oranges</button> 1</div>',
        ].join(''));

        render(container, (
            <main>
                <Component text="Apples" key="a" />
                <Component text="Oranges" key="o" />
            </main>
        ));
        expect(element.innerHTML).toEqual([
            '<div class="empty"><button>Apples</button> 0</div>',
            '<div class=""><button>Oranges</button> 1</div>',
        ].join(''));

        dispatchClick(element.querySelector('button'));
        expect(element.innerHTML).toEqual([
            '<div class=""><button>Apples</button> 1</div>',
            '<div class=""><button>Oranges</button> 1</div>',
        ].join(''));

        render(container, (
            <main>
                <Component text="Apples" key="a">
                    <Component text="Oranges" key="o" />
                </Component>
            </main>
        ));
        expect(element.innerHTML).toEqual([
            '<div class=""><button>Apples</button> 1',
            '<div class="empty"><button>Oranges</button> 0</div>',
            '</div>',
        ].join(''));

        dispatchClick(element.querySelector('.empty button'));
        expect(element.innerHTML).toEqual([
            '<div class=""><button>Apples</button> 1',
            '<div class=""><button>Oranges</button> 1</div>',
            '</div>',
        ].join(''));

        dispatchClick(element.querySelector('button'));
        expect(element.innerHTML).toEqual([
            '<div class=""><button>Apples</button> 2',
            '<div class=""><button>Oranges</button> 1</div>',
            '</div>',
        ].join(''));
    });

    test('prevent infinite recursion', () => {
        const RecursiveComponent = withState(({ state, setState }) => {
            setState({ text: 5 });
            return <span>{state.text}</span>;
        });

        expect(() => render(container, <RecursiveComponent />)).toThrow(/infinite recursion/);
    });
});
