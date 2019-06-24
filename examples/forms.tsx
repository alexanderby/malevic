import {m} from 'malevic';
import {render} from 'malevic/dom';
import {withForms} from 'malevic/forms';

let state: {text: string, checked: boolean, num: number} = null;

const Form = withForms(({checked, text, num, onCheckChange, onTextChange, onNumChange}) => {
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
                onchange={(e) => !isNaN(e.target.valueAsNumber) && onNumChange(e.target.valueAsNumber)}
                onkeypress={(e) => {
                    if (e.code === 'Enter' && !isNaN(e.target.valueAsNumber)) {
                        onNumChange(e.target.valueAsNumber);
                    }
                }}
            />
            <textarea oninput={(e) => onTextChange(e.target.value)}>
                {text}
            </textarea>
            <pre>{JSON.stringify({checked, text, num}, null, 4)}</pre>
        </form>
    );
});

function setState(newState) {
    state = Object.assign({}, state, newState);
    render(document.getElementById('forms'), (<div>
        <Form
            text={state.text}
            checked={state.checked}
            num={state.num}
            onCheckChange={(checked) => setState({checked})}
            onTextChange={(text) => setState({text})}
            onNumChange={(num) => setState({num})}
        />
    </div>));
}

setState({checked: true, text: 'text', num: 5});
