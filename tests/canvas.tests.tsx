import {createCanvas} from 'canvas';
import {m} from 'malevic';
import {draw, getContext} from 'malevic/canvas';

let container: Element = null;

beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
});

afterEach(() => {
    document.body.removeChild(container);
    container = null;
});

test('canvas', () => {
    function Background({color}) {
        const context = getContext();
        context.fillStyle = color;
        const {width, height} = context.canvas;
        context.fillRect(0, 0, width, height);
    }

    function Rect({x, y, width, height, fill}) {
        const context = getContext();
        context.fillStyle = fill;
        context.fillRect(x, y, width, height);
    }

    function Transform({translate: {x, y}}, ...children) {
        const context = getContext();
        context.translate(x, y);
        return [children, () => context.resetTransform()];
    }

    const width = 4;
    const height = 4;
    const canvas = createCanvas(width, height);

    draw(
        canvas.getContext('2d'),
        <Array>
            <Background color="yellow" />
            <Rect fill="red" x={0} y={0} width={2} height={2} />
            <Transform translate={{x: 2, y: 2}}>
                <Rect fill="blue" x={0} y={0} width={2} height={2} />
            </Transform>
            <Rect fill="#00FF00" x={0} y={2} width={2} height={2} />
        </Array>,
    );

    const data = canvas.getContext('2d').getImageData(0, 0, width, height).data;
    const pixel = (x, y) =>
        [0, 1, 2, 3].map((i) => data[4 * (y * height + x) + i]);

    expect(pixel(0, 0)).toEqual([255, 0, 0, 255]);
    expect(pixel(1, 0)).toEqual([255, 0, 0, 255]);
    expect(pixel(2, 0)).toEqual([255, 255, 0, 255]);
    expect(pixel(3, 0)).toEqual([255, 255, 0, 255]);
    expect(pixel(0, 1)).toEqual([255, 0, 0, 255]);
    expect(pixel(1, 1)).toEqual([255, 0, 0, 255]);
    expect(pixel(2, 1)).toEqual([255, 255, 0, 255]);
    expect(pixel(3, 1)).toEqual([255, 255, 0, 255]);
    expect(pixel(0, 2)).toEqual([0, 255, 0, 255]);
    expect(pixel(1, 2)).toEqual([0, 255, 0, 255]);
    expect(pixel(2, 2)).toEqual([0, 0, 255, 255]);
    expect(pixel(3, 2)).toEqual([0, 0, 255, 255]);
    expect(pixel(0, 3)).toEqual([0, 255, 0, 255]);
    expect(pixel(1, 3)).toEqual([0, 255, 0, 255]);
    expect(pixel(2, 3)).toEqual([0, 0, 255, 255]);
    expect(pixel(3, 3)).toEqual([0, 0, 255, 255]);

    expect(() => draw(canvas.getContext('2d'), <div />)).toThrow(
        /Unable to draw spec/,
    );
});
