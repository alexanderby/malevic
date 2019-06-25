# Malevič.js [![npm version](https://img.shields.io/npm/v/malevic.svg?style=flat)](https://www.npmjs.com/package/malevic)

Minimalistic reactive UI library.
As simple as possible.
Extendable.
*5KB gzipped (7KB with animations)*.

![Malevič.js logo](https://rawgit.com/alexanderby/malevic/master/logo-256x256.svg)

Suitable for building framework-independent dynamic widgets as well as small web apps.

## Samples

- [Data visualization](https://alexanderby.github.io/malevic-samples/)
- [Chrome extension UI](https://chrome.google.com/webstore/detail/dark-reader/eimadpbcbfnmbkopoojfekhnkhdbieeh)

## Basic example

- `m()` function creates a DOM node specification that looks like `{type, props, children}`.
- `render()` function synchronizes a DOM node with specification.
If differences are found,
then necessary children or attributes are replaced.

```javascript
import {m} from 'malevic';
import {render} from 'malevic/dom';

const h3 = render(document.createElement('h3'), (
    m('h3', {class: 'heading'},
        'Hello, World!'
    )
));
```

## JSX

`m` pragma should be used to make it work with **JSX**:
- Babel:
```json
{
    "plugins": [
        ["transform-react-jsx", {
            "pragma": "m"
        }]
    ]
}
```
- TypeScript:
```json
{
    "compilerOptions": {
        "jsx": "react",
        "jsxFactory": "m"
    }
}
```

Component written in JSX will look like:
```jsx
import {m} from 'malevic';
import {render} from 'malevic/dom';

function Button({handler}, ...children) {
    return (
        <button class="x-button" onclick={handler}>
            {...children}
        </button>
    );
}

render(document.body, (
    <body>
        <Button handler={(e) => alert(e.target)}>
            Click me
        </Button>
    </body>
));
```

`m` is a factory function for creating a spec tree from JSX, so `import {m} from 'malevic';` should be included in every JSX or TSX file.

## Listening to events

If attribute starts with `on`,
a corresponding event listener is added to a DOM element
(or removed if value is `null`).

```jsx
<button onclick={(e) => alert(e.target)} />
```

 ## Getting DOM node before rendering	

 It is possible to get parent DOM node and target DOM node (if it was already rendered) before updating DOM tree.
 For doing so `getContext` function is used.	

 ```jsx	
import {m} from 'malevic';
import {render, getContext} from 'malevic/dom';

function App() {
    const context = getContext();
    const {parent, node} = context;
    const rect = parent.getBoundingClientRect();
    return (<body>
        <header></header>
        <main>
            <h3>Size</h3>
            <p>{`Width: ${rect.width}`}</p>
            <p>{`Height: ${rect.height}`}</p>
        </main>
        <footer></footer>
    </body>);
}

render(document.body, <App/>);	
```

If component creates multiple DOM nodes, `context.nodes` property will return all of them
(when compoent will be rendered the next time):

```jsx
function Many({items}) {
    const {nodes} = getContext(); // [header, span, span, footer]
    return (
        <Array>
            <header/>
            {...items.map((item) => <span>{item}</span>)}
            <footer/>
        </Array>
    );
}
```

## Manipulating class list and styles

- Possible **class** attribute values:

```jsx
<div
    class="view active"
    class={['view', null, 'active']}
    class={{'view': true, 'active': props.isActive}}
/>
```
- Possible **style** attribute values:
```jsx
<div
    style="background: red !important; left: 0;"
    style={{'background': 'red !important', 'left': 0}}
/>
```

## Lifecycle management

- `attached` handler will be invoked after DOM node is created and appended to parent.
- `updated` handler will be invoked after all attributes of existing DOM node were synchronized.
- `detached` handler will be invoked after DOM node was removed.

```jsx
function Heading() {
    return (
        <h4
            native
            attached={(domNode) => {
                domNode.classList.add('rendered');
                domNode.textContent = 'Hello';
            }}
        ></h4>
    );
}
render(document.body, <body><Heading /></body>);
```

It is possible to assign lifecycle handlers for components as well:

```jsx
function Component() {
    const context = getContext();

    context.attached((domNode) => domNode.classList.add('init'));
    context.detached((domNode) => domNode.parentNode == null);
    context.updated((domNode) => domNode === context.node;

    return <div>Hello</div>;
}
```

## Optimizing component re-renders

When virtual DOM checks should be skipped, `context.leave()` function could be used.

```jsx
function Component(props) {
    const {prev} = getContext();

    if (prev && prev.props.value === props.value) {
        return context.leave();
    }

    return <Nested value={props.value} />;
}
```

Here `context.prev` property returns the previous component specification.

## Virtual nodes matching

By default virtual children are matched by component type or element tag name. The `key` property should be used to prevent detaching virtual nodes when children order changes:

```jsx
render(target, (
    <List>
        <Item key={0} />
        <Item key={1} />
        <Item key={2} />
    </List>
));
// Attached items: 0, 1, 2

render(target, (
    <List>
        <Item key={3} />
        <Item key={2} />
        <Item key={1} />
    </List>
));
// Attached items: 3
// Detached items: 0
// Updated items: 1, 2
```

Any value can be used for a `key`, matching is done by strict `===` comparison.

## Using DOM node as a child

Yes. You can just create a DOM node and it will be later injected into the DOM tree:

```jsx
function Component({class: className}) {
    let {node} = getContext();
    if (!node) {
        node = document.createElement('div');
    }
    node.className = className;
    return node;
}

render(document.body, (
    <body>
        <Component class="native" />
    </body>
));
```

Other possible spec child types are:
- Object where `type` is a string (will create DOM element).
- Object where `type` is a function (will invoke a component).
- Array or object with `type` equal to Array constructor.
- String (will create a text node).
- `null` (will leave a placeholder for future nodes).

## Server-side rendering

Malevič.js can simply render inside existing HTML
without unnecessary DOM tree modifications.

```jsx
import {m} from 'malevic';
import {stringify} from 'malevic/string';
import {createServer} from 'http';
import App from './app';

createServer((request, response) => response.end(`<!DOCTYPE html>
<html>
<head></head>
${renderToString(
    <body>
        <App state={{}} />
    </body>
, {indent: '  '})}
</html>`));
```

Sometimes a component is tied to DOM and cannot be converted to string properly. `isStringifying` function comes for rescue:

```jsx
import {m} from 'malevic';
import {getContext} from 'malevic/dom';
import {isStringifying} from 'malevic/string';

function Component() {
    if (isStringifying()) {
        return <div class="target" />;
    }

    const {parent} = getContext();
    const rect = parent.getBoundingClientRect();
    return <div
        class="target"
        style={{width: `${rect.width}px`}}
    />
}
```

## Animation plug-in

There is a built-in animation plug-in,
which makes it possible to schedule attribute animations.

```jsx
import {m} from 'malevic';
import {render} from 'malevic/dom';
import {withAnimation, animate} from 'malevic/animation';

const Chart = withAnimation(({width, height}) => (
    <svg width={width} height={height}>
        <circle
            r={5}
            fill="red"
            cx={animate(90).initial(10).duration(1000)}
            cy={animate(10).initial(90).duration(1000)}
        />
        <path
            fill="none"
            stroke="blue"
            stroke-width={1}
            d={animate('M10,90 Q50,10 90,90')
              .initial('M10,10 Q50,90 90,10')}
        />
    </svg>
));

render(document.body, (
    <body>
        <Chart width={200} height={150} />
    </body>
));


```

It is possible to animate separate style properties:
```jsx
const Tooltip = withAnimation(({text, color, isVisible, x, y}) => {
    return (
        <div
            class={['tooltip', {'visible': isVisible}]}
            style={{
                'transform': animate(`translate(${x}px, ${y}px)`),
                'background-color': animate(color)
                    .interpolate(d3.interpolateRgb)
            }}
        ></div>
    );
});
```

Built-in interpolator can interpolate between numbers and strings containing numbers with floating points.
For other cases (e.g. colors) please use custom interpolators:
```jsx
<rect
    fill={animate([255, 255, 0])
        .initial([255, 0, 0])
        .duration(2000)
        .interpolate((a, b) => (t) => {
            const mix = (x, y) => Math.round(x * (1 - t) + y * t);
            const channels = [
                mix(a[0], b[0]),
                mix(a[1], b[1]),
                mix(a[2], b[2])
            ];
            return `rgb(${channels.join(', ')})`;
        })}
/>
```

## State plug-in	

State plug-in lets re-render a subtree in response for interaction:	
```jsx	
import {m} from 'malevic';	
import {withState, useState} from 'malevic/state';	

export const Stateful = withState(({items}) => {
    const {state, setState} = useState({isExpanded: false});
    return (	
        <div>	
            <button onclick={() => setState({isExpanded: !state.isExpanded})}>	
                Expand	
            </button>	
            <ul class={{'expanded': state.isExpanded}}>	
                {items.map((text) => <li>{text}</li>)}	
            </ul>	
        </div>	
    );	
});
```

Initial state should be passed to `useState` function.
`setState` should not be called inside a component,
only in event handlers or async callbacks.

State plug-in is a shorthand for manipulating `context.store` property and `context.refresh()` method.

`context.store` is an object that is transferred between matched virtual nodes. Any values can be stored there and used when next component unboxing happens.

`context.refresh()` function refreshes a part of the virtual DOM. It should not be called during the component unboxing.

```jsx
import {m} from 'malevic';	
import {getContext} from 'malevic/dom';	

function Stateful(({items}) {
    const context = getContext();
    const {store} = context;
    return (	
        <div>	
            <button onclick={() => {
                context.store.isExpanded = !store.isExpanded;
                context.refresh();
            }}>	
                Expand	
            </button>	
            <ul class={{'expanded': store.isExpanded}}>	
                {items.map((text) => <li>{text}</li>)}	
            </ul>	
        </div>	
    );	
});
```

## Forms plug-in

Forms plug-in makes form elements work in reactive manner:
```jsx
import {m} from 'malevic';
import {withForms} from 'malevic/forms';

const Form = withForms(({checked, text, num, onCheckChange, onTextChange, onNumChange}) => {
    return (
        <form onsubmit={(e) => e.preventDefault()}>
            <input
                type="checkbox"
                checked={checked}
                onchange={(e) => onCheckChange(e.target.checked)}
            />
            <input
                type="number"
                value={num}
                readonly={!checked}
                onchange={(e) => {
                    if (!isNaN(e.target.valueAsNumber)) {
                        onNumChange(e.target.valueAsNumber);
                    }
                }}
                onkeypress={(e) => {
                    if (e.code === 'Enter' && !isNaN(e.target.valueAsNumber)) {
                        onNumChange(e.target.valueAsNumber);
                    }
                }}
            />
            <textarea oninput={(e) => onTextChange(e.target.value)}>
                {text}
            </textarea>
        </form>
    );
});
```

## Custom plug-ins

There is API for adding custom logic
and making things more complex.
- `Plugins.add(Component, plugin)` method extends plugins list.
- If plugin returns `null` or `undefined` the next plugin (added earlier) will be used.

Extendable plug-ins:
- `dom.createElement` creates DOM element.
- `dom.setAttribute` sets DOM element's attribute.
- `string.isVoidTag` determines if HTML tag is void (empty) and cannot have closing tag.
- `string.skipAttribute` determines whether attribute should be skipped.
- `string.stringifyAttribute` converts attribute value to string.
**To prevent XSS attacks always use `escapeHTML` function**.

```javascript
import {plugins} from 'malevic/dom';

const Component = () => <div/>;

const map = new WeakMap();

plugins.setAttribute
    .add(Component, ({element, attr, value, prev}) => {
        if (attr === 'data' && value !== prev) {
            map.set(element, value);
            return true;
        }
        return null;
    });

const div = render(
    document.createElement('div'),
    <Component data={5} />
);

map.get(div) === 5;
```

## Breaking changes since version 0.12

Everything was broken up:
- `render` function now works as a `sync`.
- Built-in ability to read previous props and store state.
- Parent and target DOM nodes can be retrieved using `getContext()` function.
- Lifecycle methods were renamed from `didmount`, `didupdate` and `willunmount` to `attached`, `updated` and `detached` (called after DOM node removal).
- Components can return arrays.
- `native` attribute was removed, just use a DOM node as a child.
- Added ability to leave a component without changes.
- Limited plug-ins scope.
