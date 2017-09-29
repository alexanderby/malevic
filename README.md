# Malevič.js

> Minimalistic reactive UI library.
> As simple as possible.
> Extendable.
> 4KB minified.

![Malevič.js logo](examples/malevic-js.svg)

### Simple example

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

### SVG and Animation plugins

```javascript
import malevic, { html, render } from 'malevic';
import svgPlugin from 'malevic/svg';
import animationPlugin, { animate } from 'malevic/animation';

svgPlugin(malevic);
animationPlugin(malevic);

const DURATION = 1000;

function Circle({ x, y }) {
    return html('circle', {
        cx: animate(x).duration(DURATION),
        cy: animate(y).duration(DURATION),
        r: 5,
        fill: '#567'
    });
}

function Snake(points) {
    const [p0, c0, c1, p1] = points;
    const p = ({ x, y }) => `${x},${y}`;
    return html('svg',
        {
            width: 100,
            height: 100
        },
        html('path', {
            d: animate(`M${p(p0)} C${p(c0)} ${p(c1)} ${p(p1)}`)
                .duration(DURATION),
            fill: 'none',
            stroke: '#234',
            'stroke-width': 4
        }),
        Circle(p0),
        Circle(p1),
    )
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
render(target, Snake(points));

setInterval(function () {
    points = points === curve1 ? curve2 : curve1;
    render(target, Snake(points));
}, DURATION);
```

### JSX

Works with JSX using `html` pragma.

```jsx
import { html, render } from 'malevic';
function Button({text, onClick}) {
    return (
        <button class="btn" onclick={onClick}>
            {text}
        </button>
    );
}
render(document.body, <Button text="Alert" onClick={(e) => alert(e.button)} />);
```

### Assign data to element

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

### Server-side rendering

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

### Plug-ins

```javascript
import { plugins } from 'malevic';

const map = new WeakMap();

plugins.render.setAttribute
    .add(function ({element, attr, value}) {
        if (attr === 'data') {
            const values = map.get(element) || {};
            map.set(element, Object.assign(values, {
                [attr]: value
            }));
            return true;
        }
        return null;
    })
    .add(function ({element, attr, value}) {
        if (attr === 'active') {
            element.classList.toggle('x-active', value);
            return true;
        }
        return null;
    });
```
