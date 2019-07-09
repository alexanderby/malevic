import {Component} from 'malevic';
import {getContext} from 'malevic/dom';

interface StateWrapper<T> {
    state: T;
    setState(newState: Partial<T>): void;
}

type UseStateFn<T> = (initialState: T) => StateWrapper<T>;

let currentUseStateFn: UseStateFn<any> = null;

export function useState<T extends {[prop: string]: any}>(
    initialState: T,
): StateWrapper<T> {
    if (!currentUseStateFn) {
        throw new Error('`useState()` should be called inside a component');
    }

    return currentUseStateFn(initialState);
}

export function withState<T extends Component>(type: T): T {
    const Stateful: any = (props: any, ...children: any) => {
        const context = getContext();

        const useState: UseStateFn<T> = (initial: T) => {
            if (!context) {
                return {state: initial, setState: null};
            }

            const {store, refresh} = context;
            store.state = store.state || initial;

            const setState = (newState: any) => {
                if (lock) {
                    throw new Error(
                        'Setting state during unboxing causes infinite loop',
                    );
                }
                store.state = {...store.state, ...newState};
                refresh();
            };

            return {
                state: store.state,
                setState,
            };
        };

        let lock = true;
        const prevUseStateFn = currentUseStateFn;
        currentUseStateFn = useState;
        let result;
        try {
            result = type(props, ...children);
        } finally {
            currentUseStateFn = prevUseStateFn;
            lock = false;
        }

        return result;
    };
    return Stateful;
}
