export interface NodeDeclaration {
    tag: string;
    attrs: NodeAttrs;
    children: RecursiveArray<ChildDeclaration | ChildFunction>;
}

export type ChildDeclaration = NodeDeclaration | string;

export type ChildFunction = (parent: Element) => ChildDeclaration | RecursiveArray<ChildDeclaration>;

export type SingleChildFunction = (parent: Element) => ChildDeclaration;

export interface DomEventListener {
    (this: Element, e: Event): void;
}

export interface NodeAttrs {
    data?: any;
    class?: string | {[cls: string]: any;} | (string | {[cls: string]: any;})[];
    style?: string | {[prop: string]: any;};
    native?: boolean;
    didmount?: (el: Element) => void;
    didupdate?: (el: Element) => void;
    willunmount?: (el: Element) => void;
    [attr: string]: any | DomEventListener;
}

export interface RecursiveArray<T> extends Array<T | RecursiveArray<T>> { }
