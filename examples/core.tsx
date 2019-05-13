import {m, render, getParentDOMNode} from 'malevic';

function Heading({text}) {
    return <h3>{text}</h3>;
}

function Button(props: {text: string; onClick: () => void;}) {
    return (
        <button onclick={(e: MouseEvent) => props.onClick()} >
            {props.text}
        </button>
    );
}

function PrintSize() {
    const printSize = (domNode: Element) => {
        const width = document.documentElement.clientWidth;
        const height = document.documentElement.clientHeight;
        render(domNode, `Window: ${width}x${height}`);
    };
    return (
        <h4
            native
            didmount={printSize}
            didupdate={printSize}
        ></h4>
    );
}

function View(props: {
    count: number;
    onIncrement: () => void;
}) {
    function inline(fn) {
        return {
            type: fn,
            attrs: null,
            children: [],
        };
    }

    return (
        <div class='view' style={{width: '300px', height: '200px'}}>
            <PrintSize />
            {inline(() => {
                const rect = getParentDOMNode().getBoundingClientRect();
                return <Heading text={`View: ${rect.width}x${rect.height}`} />;
            })}
            <Heading text={`Count: ${props.count}`} />
            <Button
                onClick={props.onIncrement}
                text='Increment'
            />
        </div>
    );
}

let state: {count: number;} = null;

function setState(newState) {
    state = Object.assign({}, state, newState);
    render(
        document.getElementById('core'),
        <View
            count={state.count}
            onIncrement={() => {
                setState({count: state.count + 1});
            }}
        />
    );
}

setState({count: 0});

window.addEventListener('resize', () => setState({}));
