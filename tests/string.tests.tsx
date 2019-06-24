import {m} from 'malevic';
import {stringify, isStringifying, plugins, escapeHTML} from 'malevic/string';

describe('string', () => {
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
            m(Array, null,
                m('input', {autofocus: true}, 'Content'),
                m(Component, null,
                    m('b', null, 'Hello!'),
                ),
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

    test('indent', () => {
        const html = stringify(m('div', null,
            m('h3', null, 'Heading'),
            m('p', null, [
                'Line 1',
                'Line 2',
            ].join('\n'))
        ), {indent: '  ', depth: 2});

        expect(html).toBe([
            '    <div>',
            '      <h3>Heading</h3>',
            '      <p>',
            '        Line 1',
            '        Line 2',
            '      </p>',
            '    </div>',
        ].join('\n'));
    });

    test('plugins', () => {
        const Doc = ({}, ...children) => m('div', null, ...children);
        plugins.stringifyAttribute.add(Doc, ({attr, value}) => {
            if (attr === 'color' && Array.isArray(value)) {
                return `rgb(${value.join(', ')})`;
            }
            return null;
        });
        plugins.skipAttribute.add(Doc, ({attr, value}) => {
            if (attr === 'skip') {
                if (value === 'no-skip') {
                    return false;
                }
                return true;
            }
            return null;
        });
        plugins.isVoidTag.add(Doc, (tag) => {
            if (tag === 'keygen') {
                return true;
            }
            return null;
        });

        const specs = [
            m('keygen', null,
                'Content',
            ),
            m('span', {skip: 'usual'}),
            m('span', {skip: 'no-skip'}),
            m('span', {color: [255, 128, 0]}),
            m('span', {color: [0, 0, '0)" onload="alert(`xss`']}),
        ];

        const html = stringify(m('div', null,
            m(Doc, null, ...specs),
            m('div', null, ...specs),
        ));

        expect(html).toBe([
            '<div>',
            '    <div>',
            '        <keygen>',
            '        <span></span>',
            '        <span skip="no-skip"></span>',
            '        <span color="rgb(255, 128, 0)"></span>',
            '        <span color="rgb(0, 0, 0)" onload="alert(`xss`)"></span>',
            '    </div>',
            '    <div>',
            '        <keygen>Content</keygen>',
            '        <span skip="usual"></span>',
            '        <span skip="no-skip"></span>',
            '        <span color="255,128,0"></span>',
            '        <span color="0,0,0)&quot; onload=&quot;alert(`xss`"></span>',
            '    </div>',
            '</div>',
        ].join('\n'));
    });

    test('unsupported spec', () => {
        expect(() => stringify(m('div', null, document.createElement('a')))).toThrow(/Unable to stringify spec/);
        expect(() => stringify(m('div', null, (() => null) as any))).toThrow(/Unable to stringify spec/);
        expect(() => stringify(m('div', null, true as any))).toThrow(/Unable to stringify spec/);
        expect(() => stringify(m('div', null, 0 as any))).toThrow(/Unable to stringify spec/);
        expect(() => stringify(m('div', null, {} as any))).toThrow(/Unable to stringify spec/);
        expect(() => stringify({} as any)).toThrow(/Not a spec/);
    });

    test('escape', () => {
        expect(escapeHTML(`<script src='..' onload="&"></script>`))
            .toBe('&lt;script src=&#039;..&#039; onload=&quot;&amp;&quot;&gt;&lt;/script&gt;');
    });
});
