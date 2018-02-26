import { html } from '../src';

function Component({ isHidden = false } = {}, ...children) {
    const style = isHidden ? { 'display': 'none' } : null;
    return (
        <div class="component" style={style}>
            {children}
        </div>
    );
}

test('declaration', () => {
    expect(
        <main>
            <Component isHidden>
                Hello <strong>World</strong>
            </Component>
            <Component></Component>
        </main>
    ).toEqual({
        tag: 'main',
        attrs: null,
        children: [
            {
                tag: 'div',
                attrs: {
                    class: 'component',
                    style: {
                        display: 'none'
                    }
                },
                children: [
                    [
                        'Hello ',
                        {
                            tag: 'strong',
                            attrs: null,
                            children: [
                                'World'
                            ]
                        }
                    ]
                ]
            },
            {
                tag: 'div',
                attrs: {
                    class: 'component',
                    style: null
                },
                children: [[]]
            }
        ]
    });
});
