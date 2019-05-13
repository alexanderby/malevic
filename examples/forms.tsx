import {m, render} from 'malevic';
import withForms from 'malevic/forms';

withForms();

let state: {text: string; checked: boolean; num: number;} = null;

function Form({checked, text, num, onCheckChange, onTextChange, onNumChange}) {
    return (
        <form onsubmit={(e) => e.preventDefault()}>
            <input
                type="checkbox"
                checked={checked}
                onchange={(e) => onCheckChange(e.target.checked)}
            />
            <input
                type="number"
                value={num}
                readonly={!checked}
                onchange={(e) => !isNaN(parseFloat(e.target.value)) && onNumChange(e.target.value)}
                onkeypress={(e) => {
                    if (e.keyCode === 13 && !isNaN(parseFloat(e.target.value))) {
                        onNumChange(e.target.value);
                    }
                }}
            />
            <textarea oninput={(e) => onTextChange(e.target.value)}>
                {text}
            </textarea>
            <pre>{JSON.stringify({checked, text, num}, null, 4)}</pre>
        </form>
    );
}

function setState(newState) {
    state = Object.assign({}, state, newState);
    render(
        document.getElementById('forms'),
        <Form
            text={state.text}
            checked={state.checked}
            num={state.num}
            onCheckChange={(checked) => setState({checked})}
            onTextChange={(text) => setState({text})}
            onNumChange={(num) => setState({num})}
        />
    );
}

setState({checked: true, text: 'text', num: 5});
