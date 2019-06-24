import {LinkedList} from '../src/utils/linked-list';

describe('utils', () => {
    test('linked list', () => {
        const list = new LinkedList<any>();
        expect(list.first).toBe(null);
        expect(list.last).toBe(null);

        const item0 = {};
        list.push(item0);
        expect(list.first).toBe(item0);
        expect(list.last).toBe(item0);
        expect(list.before(item0)).toBe(null);
        expect(list.after(item0)).toBe(null);

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
