import {m} from 'malevic';
import {render} from 'malevic/dom';

function Heading({text}) {
    return <h3>{text}</h3>;
}

function Button(props: {text: string; onClick: () => void}) {
    return <button onclick={(e) => props.onClick()}>{props.text}</button>;
}

function View(props: {count: number; onIncrement: () => void}) {
    return (
        <div class="view" style={{width: '300px', height: '200px'}}>
            {() => {
                const width = document.documentElement.clientWidth;
                const height = document.documentElement.clientHeight;
                return <h4>{`Window: ${width}x${height}`}</h4>;
            }}
            {({parent}) => {
                const rect = parent.getBoundingClientRect();
                return <Heading text={`View: ${rect.width}x${rect.height}`} />;
            }}
            <Heading text={`Count: ${props.count}`} />
            <Button onClick={props.onIncrement} text="Increment" />
        </div>
    );
}

let state: {count: number} = null;

function setState(newState) {
    state = Object.assign({}, state, newState);
    render(
        document.getElementById('core'),
        <View
            count={state.count}
            onIncrement={() => {
                setState({count: state.count + 1});
            }}
        />,
    );
}

setState({count: 0});

window.addEventListener('resize', () => setState({}));
