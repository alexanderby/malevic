import type {RecursiveArray, Child, Component, ComponentSpec} from '../defs';
import {m} from '../spec';
import {getComponentContext} from './vnode';

export function createComponent<TProps, TResult>(
    fn: (
        context: ReturnType<typeof getComponentContext>,
        props: TProps,
        ...children: RecursiveArray<Child>
    ) => TResult,
): (
    props: TProps & {key: any},
    ...children: RecursiveArray<Child>
) => ComponentSpec<TProps, TResult> {
    const component: Component<TProps, TResult> = (props, ...children) => {
        const context = getComponentContext();
        return fn(context, props, ...children);
    };
    return (props, ...children) => {
        return m(component, props, ...children);
    };
}
