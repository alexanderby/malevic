import { sync, NodeDeclaration } from 'malevic';
// https://github.com/kulshekhar/ts-jest/issues/414
// import { sync } from '../index';
// import { NodeDeclaration } from '../defs';

interface StateMatch<S> {
    node: Element;
    state: S;
}

type ParentStateMap<S> = Map<string, StateMatch<S>>;

let componentsCounter = 0;

export default function withState<P = any, S = any>(
    fn: (
        attrs: P & { state: S; setState: (state: S) => void; },
        ...children
    ) => NodeDeclaration,
    initialState: S = {} as S
) {
    const parentsStates = new WeakMap<Element, ParentStateMap<S>>();

    const defaultKey = `state-${componentsCounter++}`;

    return function (attrs: P & { key?: string } = {} as P, ...children) {
        const key = attrs.key == null ? defaultKey : attrs.key;

        return function (parentDomNode: Element) {
            let states: ParentStateMap<S>;
            if (parentsStates.has(parentDomNode)) {
                states = parentsStates.get(parentDomNode);
            } else {
                states = new Map();
                parentsStates.set(parentDomNode, states);
            }

            let match: StateMatch<S>;
            if (states.has(key)) {
                match = states.get(key);
            } else {
                match = {
                    node: null,
                    state: initialState,
                };
                states.set(key, match);
            }

            let callingComponent = false;

            function invokeComponentFn(state) {
                callingComponent = true;
                const declaration = fn(Object.assign({}, attrs, { state, setState }), ...children);
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
                sync(match.node, invokeComponentFn(merged));
            }

            return invokeComponentFn(match.state);
        };
    };
}