import {m} from 'malevic';

function Component({isHidden = false} = {}, ...children) {
    const style = isHidden ? {'display': 'none'} : null;
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
        type: 'main',
        attrs: null,
        children: [
            {
                type: Component,
                attrs: {
                    isHidden: true,
                },
                children: [
                    'Hello ',
                    {
                        type: 'strong',
                        attrs: null,
                        children: [
                            'World'
                        ]
                    }
                ]
            },
            {
                type: Component,
                attrs: null,
                children: []
            }
        ]
    });
});
