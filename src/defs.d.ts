export interface NodeDeclaration {
    type: string;
    attrs: NodeAttrs;
    children: Child[];
}

export interface ComponentDeclaration<T = any> {
    type: Component<T>;
    attrs: T;
    children: Child[];
}

export type Declaration = NodeDeclaration | ComponentDeclaration;

export type Component<T = any> = (props: T, ...children: Child[]) => Declaration;

export type Child = string | Declaration;

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
