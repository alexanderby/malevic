import {m} from 'malevic';
import {withAnimation, animate} from 'malevic/animation';
import {render} from 'malevic/dom';
import {stringify} from 'malevic/string';

function assert(value) {
    if (!value) {
        throw new Error('Something went wrong');
    }
}

const View = withAnimation(({color, child}) => {
    return (
        <div id="static-container">
            <h1
                id="static-animation"
                style={{
                    position: 'relative',
                    display: 'inline-block',
                    left: animate(`0px`).initial(`100px`),
                }}
            >
                Animation
            </h1>
            <br />
            {child}
            <h3 id="static-color" style={{color}}>
                Color
            </h3>
        </div>
    );
});

const container = document.getElementById('static');
const markup = stringify(
    <View color="red" child={<span id="static-replacement">Initial</span>} />,
);
container.innerHTML = markup;

const items = new Set();
items.add(container.querySelector('#static-container'));
items.add(container.querySelector('#static-animation'));
items.add(container.querySelector('#static-replacement'));
items.add(container.querySelector('#static-color'));

setTimeout(() => {
    render(
        container.firstElementChild,
        <View
            color="blue"
            child={<code id="static-replacement">Replacement</code>}
        />,
    );
    assert(items.has(container.querySelector('#static-container')));
    assert(items.has(container.querySelector('#static-animation')));
    assert(!items.has(container.querySelector('#static-replacement')));
    assert(items.has(container.querySelector('#static-color')));
}, 1000);
