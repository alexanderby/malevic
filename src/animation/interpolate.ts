export interface Interpolator<T> {
    (from: T, to: T): (t: number) => T;
}

function interpolate(t: number, from: number, to: number) {
    return from * (1 - t) + to * t;
}

export const interpolateNumbers: Interpolator<number> = function (
    from: number,
    to: number,
) {
    return (t) => interpolate(t, from, to);
};

function createNumRegExp() {
    return /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[e][-+]?\d+)?/gim;
}

function getNumPositions(line: string) {
    const positions: {index: number; length: number}[] = [];
    const regexp = createNumRegExp();
    let match: RegExpExecArray;
    while ((match = regexp.exec(line))) {
        positions.push({index: match.index, length: match[0].length});
    }
    return positions;
}

export const interpolateNumbersInString: Interpolator<string> = function (
    from: string,
    to: string,
) {
    const posFrom = getNumPositions(from);
    const posTo = getNumPositions(to);

    const numsFrom = posFrom.map((p) =>
        parseFloat(from.substring(p.index, p.index + p.length)),
    );
    const numsTo = posTo.map((p) =>
        parseFloat(to.substring(p.index, p.index + p.length)),
    );
    const segments: string[] = [];
    let last = 0;
    for (let i = 0; i < posTo.length; i++) {
        segments.push(to.substring(last, posTo[i].index));
        last = posTo[i].index + posTo[i].length;
    }
    const tail = to.substring(last);

    return (t) => {
        let result = '';
        let na: number, nb: number, n: number;
        for (let i = 0; i < numsTo.length; i++) {
            na = numsFrom[i];
            nb = numsTo[i];
            if (i < numsFrom.length) {
                n = interpolate(t, na, nb);
            } else {
                n = nb;
            }
            result += segments[i] + n.toString();
        }
        return result + tail;
    };
};
