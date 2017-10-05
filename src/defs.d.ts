export interface NodeDeclaration {
    tag: string;
    attrs: Attrs;
    children: Array<ChildDeclaration | ChildFunction>;
}

export type ChildDeclaration = NodeDeclaration | string;

export type ChildFunction = (parent: Element) => NodeDeclaration | string | (NodeDeclaration | string)[];

export interface DomEventListener {
    (this: Element, e: Event): void;
}

export interface Attrs {
    native?: boolean;
    didmount?: (el: Element) => void;
    didupdate?: (el: Element) => void;
    willunmount?: (el: Element) => void;
    [attr: string]: any | DomEventListener;
}
