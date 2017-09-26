export interface Interpolator<T> {
    (from: T, to: T): (t: number) => T;
}

function interpolate(t: number, from: number, to: number) {
    return from * (1 - t) + to * t;
}

export const interpolateNumbers: Interpolator<number> = function (from: number, to: number) {
    return (t) => interpolate(t, from, to);
};

function createNumRegExp() {
    return /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[e][-+]?\d+)?/igm;
}

function getNumPositions(line: string) {
    const positions: { index: number; length: number; }[] = [];
    const regexp = createNumRegExp();
    let match: RegExpExecArray;
    while (match = regexp.exec(line)) {
        positions.push({ index: match.index, length: match.length });
    }
    return positions;
}

export const interpolateNumbersInString: Interpolator<string> = function (from: string, to: string) {
    const posFrom = getNumPositions(from);
    const posTo = getNumPositions(to);
    return (t) => {
        if (t === 0) {
            return from;
        }
        if (t === 1) {
            return to;
        }
        if (posTo.length === 0) {
            return to;
        }
        let result = '';
        let na: number, nb: number, n: number;
        let last = 0;
        for (let i = 0; i < posTo.length; i++) {
            result += to.substring(last, posTo[i].index);
            na = parseFloat(from.substr(posFrom[i].index, posFrom[i].length));
            nb = parseFloat(to.substr(posTo[i].index, posTo[i].length));
            n = interpolate(t, na, nb);
            result += n.toString();
            last = posTo[i].index + posTo[i].length;
        }
        result += to.substring(last);
        return result;
    };
};
