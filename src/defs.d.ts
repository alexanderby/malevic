export interface NodeDeclaration {
    tag: string;
    attrs: Attrs;
    children: Array<NodeDeclaration | string>;
}

export interface DomEventListener {
    (this: Element, e: Event): void;
}

export interface Attrs {
    native?: boolean;
    [attr: string]: any | DomEventListener;
}
