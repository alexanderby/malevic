export function classes(...args: Array<string | {[cls: string]: boolean}>) {
    const classes = [];
    args.filter((c) => Boolean(c)).forEach((c) => {
        if (typeof c === 'string') {
            classes.push(c);
        } else if (typeof c === 'object') {
            classes.push(...Object.keys(c).filter((key) => Boolean(c[key])));
        }
    });
    return classes.join(' ');
}

export function styles(declarations: {[cssProp: string]: string}) {
    return Object.keys(declarations)
        .filter((cssProp) => declarations[cssProp] != null)
        .map((cssProp) => `${cssProp}: ${declarations[cssProp]};`)
        .join(' ');
}

export function setInlineCSSPropertyValue(
    element: HTMLElement,
    prop: string,
    $value: any,
) {
    if ($value != null && $value !== '') {
        let value = String($value);
        let important = '';
        if (value.endsWith('!important')) {
            value = value.substring(0, value.length - 10);
            important = 'important';
        }
        element.style.setProperty(prop, value, important);
    } else {
        element.style.removeProperty(prop);
    }
}
