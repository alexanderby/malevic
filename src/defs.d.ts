export interface NodeSpec {
    type: string;
    props: NodeAttrs;
    children: RecursiveArray<Child>;
}

export interface ComponentSpec<T = any, K = any> {
    type: Component<T, K>;
    props: T & {key?: any};
    children: RecursiveArray<Child>;
}

export type Spec = NodeSpec | ComponentSpec;

export type Component<T = any, K = Child> = (props: T & {key?: any}, ...children: RecursiveArray<Child>) => K | RecursiveArray<K>;

export type Child = string | Spec | Node;

export interface DomEventListener {
    (this: Element, e: Event): void;
}

export interface NodeAttrs {
    key?: any;
    class?: string | {[cls: string]: any} | (string | {[cls: string]: any})[];
    style?: string | {[prop: string]: any};
    attached?: (el: Element) => void;
    updated?: (el: Element) => void;
    detached?: (el: Element) => void;
    [attr: string]: any | DomEventListener;
}

export interface RecursiveArray<T> extends Array<T | RecursiveArray<T>> { }
