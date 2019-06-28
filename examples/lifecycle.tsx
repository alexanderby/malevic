import {m} from 'malevic';
import {render, sync, getContext} from 'malevic/dom';
import {withAnimation, animate} from 'malevic/animation';

const Tooltip = withAnimation(({text, cx, cy}) => {
    const {parent} = getContext();
    const temp = sync(
        parent.appendChild(
            document.createElementNS(parent.namespaceURI, 'text'),
        ),
        <text font-size={16}>{text}</text>,
    );
    const box = (temp as SVGTextElement).getBBox();
    parent.removeChild(temp);
    return (
        <g>
            <rect
                fill={animate([255, 255, 0], {duration: 2000})
                    .initial([255, 0, 0])
                    .interpolate((a, b) => (t) => {
                        const mix = (x, y) => Math.round(x * (1 - t) + y * t);
                        const channels = [
                            mix(a[0], b[0]),
                            mix(a[1], b[1]),
                            mix(a[2], b[2]),
                        ];
                        return `rgb(${channels.join(', ')})`;
                    })}
                x={cx - box.width / 2}
                y={cy - box.height / 2}
                width={box.width}
                height={box.height}
            />
            <text
                font-size={16}
                text-anchor="middle"
                x={cx}
                y={cy - box.y - box.height / 2}
            >
                {text}
            </text>
        </g>
    );
});

render(
    document.getElementById('lifecycle'),
    <svg width="100" height="50">
        <Tooltip text="Hello" cx={50} cy={25} />
    </svg>,
);
