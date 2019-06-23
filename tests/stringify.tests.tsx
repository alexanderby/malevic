import {m} from '../src/spec';
import {stringify, isStringifying, plugins} from '../src/stringify';

describe('stringify', () => {
    test('stringify', () => {
        const Component = ({}, ...children) => {
            if (isStringifying()) {
                return m('span', {class: 'fallback'}, ...children);
            }
            return m('span', {class: 'usual'}, ...children);
        };

        const Image = ({url}) => {
            return m('img', {src: url});
        };

        const spec = m('body', {class: {'loaded': true, 'popup': false}, style: null},
            m('input', {autofocus: true}, 'Content'),
            m(Component, null,
                m('b', null, 'Hello!'),
            ),
            null,
            [
                m('button', {class: ['active', 'large'], onclick: () => alert('click')},
                    'Click Me',
                ),
                m('p', {class: null, style: {color: 'red'}},
                    'Paragraph',
                    m('br', {attached: (node) => alert(node.outerHTML)}),
                    'Line 1\nLine 2',
                ),
                m('label', null,
                    '<script>alert(`xss`);</script>',
                ),
                m(Image, {url: '" onload="alert(`xss`);'}),
            ],
        );

        const html = stringify(spec);

        expect(html).toBe([
            '<body class="loaded">',
            '    <input autofocus>',
            '    <span class="fallback">',
            `        <b>Hello!</b>`,
            '    </span>',
            '    <!---->',
            '    <button class="active large">Click Me</button>',
            '    <p style="color: red;">',
            '        Paragraph',
            '        <br>',
            '        Line 1',
            '        Line 2',
            '    </p>',
            '    <label>&lt;script&gt;alert(`xss`);&lt;/script&gt;</label>',
            '    <img src="&quot; onload=&quot;alert(`xss`);">',
            '</body>',
        ].join('\n'));
    });
});
