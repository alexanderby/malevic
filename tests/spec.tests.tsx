import {m} from 'malevic';

function Component({isHidden = false}, ...children) {
    const style = isHidden ? {'display': 'none'} : null;
    return (
        <div class="component" style={style}>
            {children}
        </div>
    );
}

test('spec', () => {
    expect(
        <main>
            <Component isHidden>
                Hello <strong>World</strong>
            </Component>
            <Component></Component>
        </main>
    ).toEqual({
        type: 'main',
        props: {},
        children: [
            {
                type: Component,
                props: {
                    isHidden: true,
                },
                children: [
                    'Hello ',
                    {
                        type: 'strong',
                        props: {},
                        children: [
                            'World'
                        ]
                    }
                ]
            },
            {
                type: Component,
                props: {},
                children: []
            }
        ]
    });

    const C = {} as any;
    expect(() => <C />).toThrow(/Unsupported spec type/);
});
