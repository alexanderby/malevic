import {m, render} from 'malevic';

function View() {
    return (
        <h3>
            Text
            <i>Italic</i>
            Text
            <small>
                small
                <i>Italic</i>
            </small>
            Text
            <br />
            <pre>{'Multi\nline'}</pre>
            {['a', 'b', 'c', ['d', 'e', 'f', ['g', 'h', 'i']]]}
        </h3>
    );
}

render(document.getElementById('text'), <View />);
