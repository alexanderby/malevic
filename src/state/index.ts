import {sync, NodeDeclaration} from 'malevic';

interface StateMatch<S, P> {
    node: Element;
    state: S;
    attrs: P;
    children: any[];
}

type ParentStateMap<S, P> = Map<string, StateMatch<S, P>>;

let componentsCounter = 0;

export default function withState<P = any, S = any>(
    fn: (
        attrs: P & {state: S; setState: (state: S) => void;},
        ...children
    ) => NodeDeclaration,
    initialState: S = {} as S
) {
    const parentsStates = new WeakMap<Element, ParentStateMap<S, P>>();

    const defaultKey = `state-${componentsCounter++}`;

    return function (attrs: P & {key?: string} = {} as P, ...children) {
        const key = attrs.key == null ? defaultKey : attrs.key;

        return function (parentDomNode: Element) {
            let states: ParentStateMap<S, P>;
            if (parentsStates.has(parentDomNode)) {
                states = parentsStates.get(parentDomNode);
            } else {
                states = new Map();
                parentsStates.set(parentDomNode, states);
            }

            let match: StateMatch<S, P>;
            if (states.has(key)) {
                match = states.get(key);
            } else {
                match = {
                    node: null,
                    state: initialState,
                    attrs: null,
                    children: [],
                };
                states.set(key, match);
            }
            match.attrs = attrs;
            match.children = children;

            let callingComponent = false;

            function invokeComponentFn(state: S, attrs: P, children) {
                callingComponent = true;
                const declaration = fn(Object.assign({}, attrs, {state, setState}), ...children);
                callingComponent = false;

                declaration.attrs = declaration.attrs || {};
                const oldDidMount = declaration.attrs.didmount;
                const oldDidUpdate = declaration.attrs.didupdate;
                const oldWillUnmount = declaration.attrs.oldDidUnmount;
                declaration.attrs.didmount = function (domNode) {
                    states.get(key).node = domNode;
                    oldDidMount && oldDidMount(domNode);
                };
                declaration.attrs.didupdate = function (domNode) {
                    states.get(key).node = domNode;
                    oldDidUpdate && oldDidUpdate(domNode);
                };
                declaration.attrs.willunmount = function (domNode) {
                    states.delete(key);
                    oldWillUnmount && oldWillUnmount(domNode);
                };
                return declaration;
            }

            function setState(newState: S) {
                if (callingComponent) {
                    throw new Error('Calling `setState` inside component function leads to infinite recursion');
                }
                const match = states.get(key);
                const merged = Object.assign({}, match.state, newState);
                match.state = merged;
                sync(match.node, invokeComponentFn(merged, match.attrs, match.children));
            }

            return invokeComponentFn(match.state, match.attrs, match.children);
        };
    };
}
