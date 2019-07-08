import {m} from 'malevic';
import {draw, getContext} from 'malevic/canvas';
import {render} from 'malevic/dom';

function Background({color}) {
    const context = getContext();
    context.fillStyle = color;
    const {width, height} = canvas;
    context.fillRect(0, 0, width, height);
}

function Rect({x, y, width, height, fill}) {
    const context = getContext();
    context.fillStyle = fill;
    context.fillRect(x, y, width, height);
}

function Transform({translate: {x, y}}, ...children) {
    const context = getContext();
    const prevTransform = context.getTransform();
    context.translate(x, y);
    return [children, () => context.setTransform(prevTransform)];
}

function Red({}, ...children) {
    const context = getContext();
    const prevFill = context.fillStyle;
    context.fillStyle = 'red';
    return [
        children,
        () => {
            context.fill();
            context.fillStyle = prevFill;
        },
    ];
}

const canvas = render(
    document.getElementById('canvas'),
    <canvas width="200" height="200" />,
).firstElementChild as HTMLCanvasElement;

draw(
    canvas.getContext('2d'),
    <Array>
        <Background color="#dddcda" />
        <Rect fill="#d24000" x={10} y={10} width={20} height={20} />
        <Transform translate={{x: 5, y: 5}}>
            <Rect fill="#24a072" x={40} y={10} width={20} height={20} />
        </Transform>
        <Rect fill="#0042a4" x={70} y={10} width={20} height={20} />
        <Red>
            {(context: CanvasRenderingContext2D) =>
                context.rect(20, 80, 100, 2)
            }
        </Red>
    </Array>,
);
