import {sync, getDOMNode, Component, Child, NodeDeclaration} from 'malevic';

interface ComponentData {
    component: Component;
    node: Node;
    props: any;
    state: any;
    children: Child[];
}

const nodesData = new WeakMap<Node, ComponentData>();
let current: ComponentData = null;
let isComponentUnboxing = false;

export function useState<S>(initialState: S) {
    if (!isComponentUnboxing) {
        throw new Error('Component does not support state, wrap it into `withState');
    }
    const info = current;
    info.state = info.state || initialState;
    const state = info.state;
    const setState = (newState: Partial<S>) => {
        if (isComponentUnboxing) {
            throw new Error('Calling `setState` inside a component leads to infinite loop');
        }
        const {component, node, props, children, state} = info;
        info.state = Object.assign({}, state, newState);
        sync(node as Element, {
            type: component,
            attrs: props,
            children,
        });
    };
    return {state, setState};
}

export default function withState<P = any, S = any>(component: Component): Component {
    function StateComponent<P>(props: P, ...children: Child[]) {
        isComponentUnboxing = true;
        const node = getDOMNode();
        const prev = current;
        const info = node && nodesData.has(node) ?
            nodesData.get(node) :
            ({component: StateComponent} as ComponentData);
        Object.assign(info, {
            props,
            children,
        });
        current = info;
        const d = component(props, ...children);
        current = prev;
        isComponentUnboxing = false;
        if (typeof d.type !== 'string') {
            throw new Error('A component with state should not contain another component');
        }
        (d as NodeDeclaration).attrs = d.attrs || {};
        let prevDidMount = (d as NodeDeclaration).attrs.didmount;
        (d as NodeDeclaration).attrs.didmount = (el) => {
            info.node = el;
            nodesData.set(el, info);
            prevDidMount && prevDidMount(el);
        };
        return d;
    }

    return StateComponent;
}
