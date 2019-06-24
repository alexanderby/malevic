import {Component} from 'malevic';
import {getContext} from 'malevic/dom';
import {isObject} from '../utils/misc';

type StateTuple<T> = [T, (newState: Partial<T>) => void];
type UseStateFn<T> = (initialState: T) => StateTuple<T>;

let currentUseStateFn: UseStateFn<any> = null;

export function useState<T>(initialState: T): StateTuple<T> {
    return currentUseStateFn(initialState);
}

export function withState<T extends Component>(type: T): T {
    const Stateful: any = (props: any, ...children: any) => {
        const {store, refresh} = getContext();

        const setState = (newState: any) => {
            store.state = isObject(newState) ? {...(store.state || {}), newState} : newState;
            refresh();
        };
        const useState: UseStateFn<T> = (initial: T) => {
            store.state = store.state || initial;
            return [store.state, setState];
        };

        const prevUseStateFn = currentUseStateFn;
        currentUseStateFn = useState;
        const result = type(props, ...children);
        currentUseStateFn = prevUseStateFn;

        return result;
    };
    return Stateful;
}
