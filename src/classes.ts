export function classes(
    ...args: Array<string | { [cls: string]: boolean }>
) {
    const classes = [];
    args.filter((c) => Boolean(c))
        .forEach((c) => {
            if (typeof c === 'string') {
                classes.push(c);
            } else if (typeof c === 'object') {
                classes.push.apply(
                    classes,
                    Object.keys(c)
                        .filter((key) => Boolean(c[key]))
                );
            }
        });
    return classes.join(' ');
}
