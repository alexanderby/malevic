# Malevič.js

Minimalistic reactive UI library.
As simple as possible.
Extendable.
*6KB minified (12KB with animations)*.

![Malevič.js logo](https://rawgit.com/alexanderby/malevic/master/logo-256x256.svg)

## Basic example

- `html()` function creates DOM element declaration that looks like `{tag, attrs, children}`.
- `render()` function renders nodes inside a DOM element.
If differences with existing DOM nodes are found,
necessary nodes or attributes are replaced.

```javascript
import { html, render } from 'malevic';

function Heading(text) {
    return html('h3', null,
        text
    );
}

function Button(props) {
    return html('button',
        {
            onclick: (e) => {
                e.stopPropagation();
                props.onClick();
            }
        },
        props.text
    );
}

function View(props) {
    return html('div', { class: 'view' },
        Heading(`Count: ${props.count}`),
        (domNode) => {
            const rect = domNode.getBoundingClientRect();
            return Heading(`${rect.width}x${rect.height}`);
        },
        Button({
            onClick: props.onIncrement,
            text: 'Increment'
        })
    );
}

let state = null;
function setState(newState) {
    state = Object.assign({}, state, newState);
    render(
        document.getElementById('core'),
        View({
            count: state.count,
            onIncrement: () => {
                setState({ count: state.count + 1 });
            }
        })
    );
}

setState({ count: 0 });
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
import { html } from 'malevic';

export default function Button({text, onClick}) {
    return (
        <button class='x-button' onclick={onClick}>
            {text}
        </button>
    );
}
```

## Animation plug-in

There is a built-in animation plug-in.
It makes possible to schedule animations like
`attr={animate(to).initial(from).duration(ms).easing('ease-in-out').interpolate((from,to)=>(t)=>string)}`.

```jsx
import { html, render } from 'malevic';
import withAnimation, { animate } from 'malevic/animation';

withAnimation();

const DURATION = 1000;

function Circle({ x, y }) {
    return (
        <circle
            cx={animate(x).duration(DURATION)}
            cy={animate(y).duration(DURATION)}
            r={5}
            fill='#567'
        />
    );
}

function Snake({ points }) {
    const [p0, c0, c1, p1] = points;
    const p = ({ x, y }) => `${x},${y}`;
    return <svg width={100} height={100}>
        <path
            d={animate(`M${p(p0)} C${p(c0)} ${p(c1)} ${p(p1)}`)
                .duration(DURATION)}
            fill='none'
            stroke='#234'
            stroke-width={4}
        />
        <Circle x={p0.x} y={p0.y} />
        <Circle x={p1.x} y={p1.y} />
    </svg>
}

const curve1 = [
    { x: 10, y: 10 },
    { x: 30, y: 40 },
    { x: 70, y: 40 },
    { x: 90, y: 10 }
];
const curve2 = [
    { x: 10, y: 90 },
    { x: 30, y: 60 },
    { x: 70, y: 60 },
    { x: 90, y: 90 }
];
let points = curve1;

const target = document.getElementById('svg-animation');

function draw() {
    render(target, <Snake points={points} />);
}

draw();
setInterval(function () {
    points = points === curve1 ? curve2 : curve1;
    draw();
}, DURATION);
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

## Listening to events

If attribute starts with `on`,
the corresponding event listener is added to DOM element
(or removed if value is `null`).

## Getting parent DOM node before rendering

It is possible to get parent DOM node for tweaking children attibutes. For doing so a function returning declaration should be used instead of declaration.

```jsx
function Tooltip({ text, cx, cy }) {
    return (domNode) => {
        const temp = render(domNode, <text font-size={16}>{text}</text>);
        const box = temp.getBBox();
        return [
            <rect fill='#fe2'
                x={cx - box.width / 2}
                y={cy - box.height / 2}
                width={box.width}
                height={box.height}
            />,
            <text font-size={16} text-anchor='middle'
                x={cx}
                y={cy - box.y - box.height / 2}
            >{text}</text>
        ];
    };
}
render(document.getElementById('lifecycle'), (
    <svg width='100' height='50'>
        <Tooltip text='Hello' cx={50} cy={25} />
    </svg>
));
```

## Assigning data to element

`data` attribute assigns data to DOM element.
It can be retrieved in event handlers by calling `getData(domElement)`.

```javascript
import { html, getData } from 'malevic';
function ListItem(props) {
    return html('li', {
        data: props.data
    });
}
function List(props) {
    return html('ul',
        {
            onclick: (e) => {
                const data = getData(e.target);
                props.onClick(data);
            }
        }
        ...props.items.map(ListItem)
    );
}
```

## Manipulating class list and styles

- Possible **class** attribute values: `class="view active"`, `class={['view', 'active']}`, `class={{'view': true, 'active': props.isActive}}`.
- Possible **style** attribute values: `style="background: red; left: 0;"`, `style={{'background': 'red', 'left': 0}}`.

## Lifecycle management

- `didmount` handler will be invoked after DOM node is created and appended to parent.
- `didupdate` handler will be invoked after all attributes of existing DOM node were synchronized.
- `willunmount` handler will be invoked be invoked before DOM node is removed.
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

```javascript
import { html, renderToString } from 'malevic';
function Icon(props) {
    return html('span', {
        class: ['icon', props.cls]
    });
}
const declaration = Icon({cls: 'x-icon'});
const markup = renderToString(declaration);
```

## Plug-ins

There is API for adding custom logic
and making things more complex.
- `Plugins.add()` method extends plugins list.
- If plugin returns `null` or `undefined` the next plugin (added earlier) will be used.

Extendable plug-ins:
- `render.createElement` creates DOM node.
- `render.mountElement` inserts created element into DOM.
- `render.setAttribute` sets element attribute.
- `render.unmountElement` removes element from DOM.
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
