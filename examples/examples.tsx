import malevic, { html, render } from '../entries';
import svgPlugin from '../entries/svg';
import animationPlugin, { animate } from '../entries/animation';

// Core
// --------------------------------------------

(function () {

    function Heading({ text }) {
        return <h3>{text}</h3>;
    }

    function Button(props: { text: string; onClick: () => void; }) {
        return (
            <button onclick={(e: MouseEvent) => props.onClick()} >
                {props.text}
            </button>
        );
    }

    function PrintSize() {
        return (
            <h4
                native
                didmount={(domNode: Element) => {
                    const width = document.documentElement.clientWidth;
                    const height = document.documentElement.clientHeight;
                    render(domNode, `Window: ${width}x${height}`);
                }}
            ></h4>
        );
    }

    function View(props: {
        count: number;
        onIncrement: () => void;
    }) {
        return (
            <div class='view' style='width: 300px; height: 200px;'>
                <PrintSize />
                {(domNode: Element) => {
                    const rect = domNode.getBoundingClientRect();
                    return <Heading text={`View: ${rect.width}x${rect.height}`} />;
                }}
                <Heading text={`Count: ${props.count}`} />
                <Button
                    onClick={props.onIncrement}
                    text='Increment'
                />
            </div>
        );
    }

    let state: { count: number; } = null;

    function setState(newState) {
        state = Object.assign({}, state, newState);
        render(
            document.getElementById('core'),
            <View
                count={state.count}
                onIncrement={() => {
                    setState({ count: state.count + 1 });
                }}
            />
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

    function Circle({ x, y, x0, y0 }) {
        return (
            <circle
                cx={animate(x).initial(x0).duration(DURATION)}
                cy={animate(y).initial(y0).duration(DURATION)}
                r={5}
                fill='#567'
            />
        );
    }

    function getCurve(p: { x, y }[]) {
        return [
            `M${p[0].x},${p[0].y}`,
            `C${p[1].x},${p[1].y}`,
            `${p[2].x},${p[2].y}`,
            `${p[3].x},${p[3].y}`
        ].join(' ');
    }

    function Snake({ points }) {
        return <svg width={100} height={100}>
            <path
                d={animate(getCurve(points))
                    .initial(getCurve(curve1))
                    .duration(DURATION)}
                fill='none'
                stroke='#234'
                stroke-width={4}
            />
            <Circle x={points[0].x} y={points[0].y} x0={curve1[0].x} y0={curve1[0].y} />
            <Circle x={points[3].x} y={points[3].y} x0={curve1[3].x} y0={curve1[3].y} />
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
    let points = curve2;

    const target = document.getElementById('svg-animation');

    function draw() {
        render(target, <Snake points={points} />);
    }

    draw();
    setInterval(function () {
        points = points === curve1 ? curve2 : curve1;
        draw();
    }, DURATION);

})();

// Lifecycle
// ---------------------------------------

(function () {

    function Tooltip({ text, cx, cy }) {
        return (domNode: SVGSVGElement) => {
            const temp = render(domNode, <text font-size={16}>{text}</text>);
            const box = (temp as SVGTextElement).getBBox();
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
        <svg width="100" height="50">
            <Tooltip text='Hello' cx={50} cy={25} />
        </svg>
    ));

})();
