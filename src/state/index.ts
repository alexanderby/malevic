import {Component} from 'malevic';
import {getContext} from 'malevic/dom';
import {isObject} from '../utils/misc';

interface StateWrapper<T> {
    state: T;
    setState(newState: Partial<T>): void;
}

type UseStateFn<T> = (initialState: T) => StateWrapper<T>;

let currentUseStateFn: UseStateFn<any> = null;

export function useState<T>(initialState: T): StateWrapper<T> {
    return currentUseStateFn(initialState);
}

export function withState<T extends Component>(type: T): T {
    const Stateful: any = (props: any, ...children: any) => {
        const {store, refresh} = getContext();

        const setState = (newState: any) => {
            if (lock) {
                throw new Error('Setting state during unboxing causes infinite loop');
            }
            store.state = isObject(newState) ? {...(store.state || {}), ...newState} : newState;
            refresh();
        };
        const useState: UseStateFn<T> = (initial: T) => {
            store.state = store.state || initial;
            return {
                state: store.state,
                setState,
            };
        };

        let lock = true;
        const prevUseStateFn = currentUseStateFn;
        currentUseStateFn = useState;
        const result = type(props, ...children);
        currentUseStateFn = prevUseStateFn;
        lock = false;

        return result;
    };
    return Stateful;
}
