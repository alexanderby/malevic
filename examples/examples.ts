import malevic, { html, render } from '../index';
import svgPlugin from '../svg';
import animationPlugin, { animate } from '../animation';

// Core
// --------------------------------------------

(function () {

    function Heading(text) {
        return html('h3', null,
            text
        );
    }

    function Button(props: { text: string; onClick: () => void; }) {
        return html('button',
            {
                onclick: (e: MouseEvent) => {
                    props.onClick();
                }
            },
            props.text
        );
    }

    function View(props: {
        count: number;
        onIncrement: () => void;
    }) {
        return html('div', { class: 'view' },
            Heading(`Count: ${props.count}`),
            Button({
                onClick: props.onIncrement,
                text: 'Increment'
            })
        );
    }

    let state: { count: number; } = null;

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
})();

// SVG & Animation
// ---------------------------------------------

svgPlugin(malevic);
animationPlugin(malevic);

(function () {

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

})();
