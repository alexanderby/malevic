# Malevič.js

Minimalistic reactive UI library.
As simple as possible.
Extendable.
*4KB minified*.

![Malevič.js logo](https://cdn.rawgit.com/alexanderby/malevic/master/logo.svg =256x256)

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

## SVG and Animation plug-ins + JSX

There are some built-in plug-ins.
- **SVG plug-in** simply creates elements in SVG namespace using SVG tag name or `svg:` prefix (some SVG tags overlap with HTML tags).
- **Animation plugin** makes it possible to schedule animations like `attr={animate(to).initial(from).duration(ms).easing('ease-in-out')}`.
- `html` pragma should be used to make it work with **JSX**.

```jsx
import malevic, { html, render } from 'malevic';
import svgPlugin from 'malevic/svg';
import animationPlugin, { animate } from 'malevic/animation';

svgPlugin(malevic);
animationPlugin(malevic);

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
    { x: 10, y: 50 },
    { x: 30, y: 50 },
    { x: 60, y: 40 },
    { x: 90, y: 10 }
];
const curve2 = [
    { x: 10, y: 50 },
    { x: 30, y: 50 },
    { x: 60, y: 60 },
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

## Listening to events

If attribute starts with `on`,
the corresponding event listener is added
(or removed if value is `null`) to DOM element.

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

## Lifecycle management

- `didmount` handler will be invoked after DOM node is created and appended to parent.
- `didupdate` handler will be invoked after all attributes of existing DOM node were synchronized.
- `willunmount` handler will be invoked be invoked before DOM node is removed.
- `native` set to `true` will prevent Malevič.js from touching DOM node's children.

```javascript
function PrintSize() {
    return (
        <h4
            native={true}
            didmount={(domNode: Element) => {
                const width = document.documentElement.clientWidth;
                const height = document.documentElement.clientHeight;
                render(domNode, `${width}x${height}`);
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
import { html, renderToString, classes } from 'malevic';
function Icon(props) {
    return html('span', {
        class: classes('icon', props.cls)
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

### Extendable plug-ins:
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
