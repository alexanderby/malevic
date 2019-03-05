# Malevič.js

Minimalistic reactive UI library.
As simple as possible.
Extendable.
*7KB minified (13KB with animations)*.

![Malevič.js logo](https://rawgit.com/alexanderby/malevic/master/logo-256x256.svg)

Suitable for building framework-independent dynamic widgets as well as small web apps.

## Basic example

- `html()` function creates DOM element declaration that looks like `{tag, attrs, children}`.
- `render()` function renders nodes inside a DOM element.
If differences with existing DOM nodes are found,
necessary nodes or attributes are replaced.

```javascript
import { html, render } from 'malevic';

render(document.body, (
    html('h3', { class: 'heading' },
        'Hello, World!'
    )
));
```

## JSX

`html` pragma should be used to make it work with **JSX**:
- Babel:
```json
{
    "plugins": [
        ["transform-react-jsx", {
            "pragma": "html"
        }]
    ]
}
```
- TypeScript:
```json
{
    "compilerOptions": {
        "jsx": "react",
        "jsxFactory": "html"
    }
}
```

Component written with JSX will look like:
```jsx
import { html, render } from 'malevic';

function Button({label, handler}) {
    return (
        <button class="x-button" onclick={handler}>
            {label}
        </button>
    );
}

render(document.body, (
    <Button
        label="Click me"
        handler={(e) => alert(e.target)}
    />
));
```

## Animation plug-in

There is a built-in animation plug-in.
It makes possible to schedule animations like
`attr={animate(to).initial(from).duration(ms).easing('ease-in-out').interpolate((from,to)=>(t)=>string)}`.

```jsx
import { html, render } from 'malevic';
import withAnimation, { animate } from 'malevic/animation';

withAnimation();

render(document.body, (
    <svg width={100} height={100}>
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
```

It is possible to animate separate style properties:
```jsx
function Tooltip({ text, color, isVisible, x, y }) {
    return (
        <div
            class={['tooltip', { 'visible': isVisible }]}
            style={{
                'transform': animate(`translate(${x}px, ${y}px)`),
                'background-color': animate(color)
                    .interpolate(interpolateRGB)
            }}
        ></div>
    );
}
```

Built-in interpolator can interpolate between numbers and strings containing numbers with floating points. For other cases (e.g. colors) use custom interpolators:
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

## Forms plug-in

Forms plug-in makes form elements work in reactive manner:
```jsx
import { html } from 'malevic';
import withForms from 'malevic/forms';

withForms();

function Form({ checked, text, num, onCheckChange, onTextChange, onNumChange }) {
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
                onchange={(e) => !isNaN(e.target.value) && onNumChange(e.target.value)}
                onkeypress={(e) => {
                    if (e.keyCode === 13 && !isNaN(e.target.value)) {
                        onNumChange(e.target.value);
                    }
                }}
            />
            <textarea oninput={(e) => onTextChange(e.target.value)}>
                {text}
            </textarea>
        </form>
    );
}
```

## Listening to events

If attribute starts with `on`,
the corresponding event listener is added to DOM element
(or removed if value is `null`).

## Assigning data to element

`data` attribute assigns data to DOM element.
It can be retrieved in event handlers by calling `getData(domElement)`.
This can be useful for event delegation.

```jsx
import { html, getData } from 'malevic';

function ListItem(props) {
    return <li class="list__item" data={props.data} />;
}

function List(props) {
    return (
        <ul
            class="list"
            onclick={(e) => {
                const data = getData(e.target);
                props.onClick(data);
            }}
        >
            {...props.items.map(ListItem)}
        </ul>
    );
}
```

## Syncing with existing DOM element
```jsx
import {html, sync} from 'malevic';

sync(document.body, (
    <body class={{'popup-open': state.isPopupOpen}}>
        <main />
    </body>
));
```

## Manipulating class list and styles

- Possible **class** attribute values: `class="view active"`, `class={['view', 'active']}`, `class={{'view': true, 'active': props.isActive}}`.
- Possible **style** attribute values: `style="background: red; left: 0;"`, `style={{'background': 'red', 'left': 0}}`.

## Lifecycle management

- `didmount` handler will be invoked after DOM node is created and appended to parent.
- `didupdate` handler will be invoked after all attributes of existing DOM node were synchronized.
- `willunmount` handler will be invoked before DOM node is removed.
- `native` set to `true` will prevent Malevič.js from touching DOM node's children.

```jsx
function PrintSize() {
    return (
        <h4
            native
            didmount={(domNode) => {
                const width = document.documentElement.clientWidth;
                const height = document.documentElement.clientHeight;
                domNode.textContent = `${width}x${height}`;
            }}
        ></h4>
    );
}
render(document.body, <PrintSize />);
```

## Server-side rendering

Malevič.js can simply render inside existing HTML
without unnecessary DOM tree modifications.

```jsx
import {html, renderToString} from 'malevic';
import {createServer} from 'http';
import App from './app';

createServer((request, response) => response.end(`<!DOCTYPE html>
<html>
<head></head>
${renderToString(
    <body>
        <App state={{}} />
    </body>
)}
</html>`));
```

## Plug-ins

There is API for adding custom logic
and making things more complex.
- `Plugins.add()` method extends plugins list.
- If plugin returns `null` or `undefined` the next plugin (added earlier) will be used.

Extendable plug-ins:
- `render.createNode` creates DOM node.
- `render.matchNodes` matches declarations with existing DOM nodes.
- `render.mountNode` inserts created node into DOM.
- `render.setAttribute` sets element's attribute.
- `render.unmountNode` removes node from DOM.
- `static.isVoidTag` determines if self-closing tag should be used.
- `static.processText` returns text content.
- `static.skipAttr` determines whether attribute should be skipped.
- `static.stringifyAttr` converts attribute to string.

```javascript
import { plugins, classes } from 'malevic';

const map = new WeakMap();

plugins.render.setAttribute
    .add(function ({element, attr, value}) {
        if (attr === 'data') {
            map.set(element, data);
            return true;
        }
        return null;
    })
    .add(function ({element, attr, value}) {
        if (attr === 'class' && typeof value === 'object') {
            element.setAttribute('class', classes(value));
            return true;
        }
        return null;
    });
```
