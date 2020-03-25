import {classes, styles} from '../src/utils/attrs';
import {LinkedList} from '../src/utils/linked-list';
import {clamp} from '../src/utils/math';
import {isObject, isPlainObject, last} from '../src/utils/misc';

describe('utils', () => {
    test('attrs', () => {
        expect(classes()).toBe('');
        expect(classes('c')).toBe('c');
        expect(classes('a', {b: true, c: false})).toBe('a b');
        expect(classes('a', null, 'b', 0 as any, 'c', true as any)).toBe(
            'a b c',
        );

        expect(styles({color: null})).toBe('');
        expect(
            styles({'background-color': 'red !important', color: 'blue'}),
        ).toBe('background-color: red !important; color: blue;');
    });

    test('math', () => {
        expect(clamp(10, 0, 20)).toBe(10);
        expect(clamp(0, 10, 20)).toBe(10);
        expect(clamp(20, 0, 10)).toBe(10);
    });

    test('miscellaneous', () => {
        expect(isObject(null)).toBe(false);
        expect(isObject(undefined)).toBe(false);
        expect(isObject(true)).toBe(false);
        expect(isObject('')).toBe(false);
        expect(isObject(3)).toBe(false);
        expect(isObject(Symbol())).toBe(false);
        expect(isObject({})).toBe(true);
        expect(isObject([])).toBe(true);
        expect(isObject(() => null)).toBe(false);

        expect(isPlainObject({})).toBe(true);
        expect(isPlainObject([])).toBe(false);
        expect(isPlainObject(Object.create({}))).toBe(false);
        expect(isPlainObject(() => null)).toBe(false);

        expect(last([0, 1, 2, 3])).toBe(3);
        expect(last([0, 1, 2, 3], 2)).toBe(1);
        expect(last([0, 1, 2, 3], 5)).toBe(undefined);
    });

    test('linked list', () => {
        const list = new LinkedList<any>();
        expect(list.first).toBe(null);
        expect(list.last).toBe(null);
        expect(list.map((item) => item).length).toBe(0);

        const item0 = {};
        list.push(item0);
        expect(list.first).toBe(item0);
        expect(list.last).toBe(item0);
        expect(list.before(item0)).toBe(null);
        expect(list.after(item0)).toBe(null);
        expect(list.map((item) => item).length).toBe(1);

        const item1 = {};
        list.push(item1);
        expect(list.first).toBe(item0);
        expect(list.last).toBe(item1);
        expect(list.before(item0)).toBe(null);
        expect(list.after(item0)).toBe(item1);
        expect(list.before(item1)).toBe(item0);
        expect(list.after(item1)).toBe(null);

        const item2 = {};
        list.insertBefore(item2, item1);
        expect(list.first).toBe(item0);
        expect(list.last).toBe(item1);
        expect(list.before(item0)).toBe(null);
        expect(list.after(item0)).toBe(item2);
        expect(list.before(item2)).toBe(item0);
        expect(list.after(item2)).toBe(item1);
        expect(list.before(item1)).toBe(item2);
        expect(list.after(item1)).toBe(null);

        const item3 = {};
        list.insertBefore(item3, item0);
        expect(list.first).toBe(item3);
        expect(list.before(item3)).toBe(null);
        expect(list.after(item3)).toBe(item0);
        expect(list.before(item0)).toBe(item3);

        const arr1 = list.map((item) => ({item}));
        [item3, item0, item2, item1].forEach((item, i) => {
            expect(item).toBe(arr1[i].item);
        });

        const arr2 = [];
        list.forEach((item) => arr2.push(item));
        [item3, item0, item2, item1].forEach((item, i) => {
            expect(item).toBe(arr2[i]);
        });

        const arr3 = list.copy().map((item) => item);
        [item3, item0, item2, item1].forEach((item, i) => {
            expect(item).toBe(arr3[i]);
        });

        expect(list.find((item) => item === 5)).toBe(null);
        expect(list.find((item) => item === item0)).toBe(item0);
        expect(list.find((item) => item === item1)).toBe(item1);
        expect(list.find((item) => item === item2)).toBe(item2);
        expect(list.find((item) => item === item3)).toBe(item3);

        list.delete(item3);
        expect(list.first).toBe(item0);
        expect(list.last).toBe(item1);
        expect(list.before(item0)).toBe(null);
        expect(list.after(item0)).toBe(item2);
        expect(list.before(item2)).toBe(item0);
        expect(list.after(item2)).toBe(item1);
        expect(list.before(item1)).toBe(item2);
        expect(list.after(item1)).toBe(null);

        list.delete(item2);
        expect(list.first).toBe(item0);
        expect(list.last).toBe(item1);
        expect(list.before(item0)).toBe(null);
        expect(list.after(item0)).toBe(item1);
        expect(list.before(item1)).toBe(item0);
        expect(list.after(item1)).toBe(null);

        list.delete(item1);
        expect(list.first).toBe(item0);
        expect(list.last).toBe(item0);
        expect(list.before(item0)).toBe(null);
        expect(list.after(item0)).toBe(null);

        list.delete(item0);
        expect(list.first).toBe(null);
        expect(list.last).toBe(null);

        list.push(item0);
        list.push(item1);
        expect(list.first).toBe(item0);
        expect(list.last).toBe(item1);
        expect(list.before(item0)).toBe(null);
        expect(list.after(item0)).toBe(item1);
        expect(list.before(item1)).toBe(item0);
        expect(list.after(item1)).toBe(null);

        list.delete(item0);
        expect(list.first).toBe(item1);
        expect(list.last).toBe(item1);
        expect(list.before(item1)).toBe(null);
        expect(list.after(item1)).toBe(null);

        list.delete(item1);
        expect(list.first).toBe(null);
        expect(list.last).toBe(null);
    });
});
