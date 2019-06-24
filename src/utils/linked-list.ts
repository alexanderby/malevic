export class LinkedList<T extends {}> {
    first: T;
    last: T;
    private nexts = new WeakMap<T, T>();
    private prevs = new WeakMap<T, T>();

    constructor(...items: T[]) {
        this.first = null;
        this.last = null;
        items.forEach((item) => this.push(item));
    }

    empty() {
        return this.first == null;
    }

    push(item: T) {
        if (this.empty()) {
            this.first = item;
            this.last = item;
        } else {
            this.nexts.set(this.last, item);
            this.prevs.set(item, this.last);
            this.last = item;
        }
    }

    insertBefore(newItem: T, refItem: T) {
        const prev = this.before(refItem);
        this.prevs.set(newItem, prev);
        this.nexts.set(newItem, refItem);
        this.prevs.set(refItem, newItem);
        prev && this.nexts.set(prev, newItem);
        refItem === this.first && (this.first = newItem);
    }

    delete(item: T) {
        const prev = this.before(item);
        const next = this.after(item);
        prev && this.nexts.set(prev, next);
        next && this.prevs.set(next, prev);
        item === this.first && (this.first = next);
        item === this.last && (this.last = prev);
    }

    before(item: T) {
        return this.prevs.get(item) || null;
    }

    after(item: T) {
        return this.nexts.get(item) || null;
    }

    private loop(iterator: (item: T) => boolean) {
        if (this.empty()) {
            return;
        }
        let current = this.first;
        do {
            if (iterator(current)) {
                break;
            }
        } while (current = this.after(current));
    }

    copy() {
        const list = new LinkedList<T>();
        this.loop((item) => {
            list.push(item);
            return false;
        });
        return list;
    }

    forEach(iterator: (item: T) => void) {
        this.loop((item) => {
            iterator(item);
            return false;
        });
    }

    find(iterator: (item: T) => boolean) {
        let result: T = null;
        this.loop((item) => {
            if (iterator(item)) {
                result = item;
                return true;
            }
            return false;
        });
        return result;
    }

    map<K>(iterator: (item: T) => K) {
        const results: K[] = [];
        this.loop((item) => {
            results.push(iterator(item));
            return false;
        });
        return results;
    }
}
