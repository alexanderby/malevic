import {m} from 'malevic';
import {render} from 'malevic/dom';
import {withForms} from 'malevic/forms';

let container: Element = null;

beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
});

afterEach(() => {
    document.body.removeChild(container);
    container = null;
});

describe('forms', () => {
    test('input value', () => {
        const Form = withForms(({text}) => (<Array>
            <input value={text} />
            <textarea readonly>
                {text}
            </textarea>
        </Array>));

        render(container, <Form text="x" />);
        expect(container.firstElementChild).toBeInstanceOf(HTMLInputElement);
        expect(container.lastElementChild).toBeInstanceOf(HTMLTextAreaElement);
        expect((container.firstElementChild as HTMLInputElement).value).toBe('x');
        expect((container.lastElementChild as HTMLTextAreaElement).value).toBe('x');
        expect((container.lastElementChild as HTMLTextAreaElement).readOnly).toBe(true);

        render(container, <Form text="y" />);
        expect((container.firstElementChild as HTMLInputElement).value).toBe('y');
        expect((container.lastElementChild as HTMLTextAreaElement).value).toBe('y');

        render(container, <Form text={null} />);
        expect((container.firstElementChild as HTMLInputElement).value).toBe('');
        expect((container.lastElementChild as HTMLTextAreaElement).value).toBe('');
    });
});
