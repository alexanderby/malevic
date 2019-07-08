import {m} from 'malevic';
import {draw, getContext} from 'malevic/canvas';
import {render} from 'malevic/dom';

function Background({color}) {
    const {canvas, renderingContext: ctx} = getContext<CanvasRenderingContext2D>();
    ctx.fillStyle = color;
    const {width, height} = canvas;
    ctx.fillRect(0, 0, width, height);
}

function Rect({x, y, width, height, fill}) {
    const {renderingContext: ctx} = getContext<CanvasRenderingContext2D>();
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, width, height);
}

function Transform({translate: {x, y}}, ...children) {
    const {renderingContext: ctx, rendered} = getContext<CanvasRenderingContext2D>();
    const prevTransform = ctx.getTransform();
    ctx.translate(x, y);
    rendered(() => ctx.setTransform(prevTransform));
    return children;
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
    </Array>,
);
