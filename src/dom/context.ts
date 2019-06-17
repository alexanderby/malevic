import {isDOMVNode, VNode} from './vnode';

export interface VNodeContext {
    parentNode: Node;
    node: Node;
    nodes: Node[];
    domContext: DOMContext;
}

interface VNodeLink {
    parentNode: Node;
    node: Node;
}

export interface DOMContext {
    addVNode(vnode: VNode): void;
    getVNodeContext(vnode: VNode): VNodeContext;
}

export function createDOMContext(rootNode: Node): DOMContext {
    const contexts = new WeakMap<VNode, VNodeContext>();
    const links = new WeakMap<VNode, VNodeLink[]>();
    const linkedParents = new WeakSet<VNode>();

    function createVNodeContext(vnode: VNode, parentNode: Node) {
        let context: VNodeContext;
        if (isDOMVNode(vnode)) {
            const node = vnode.node;
            context = {
                parentNode,
                node,
                nodes: [node],
                domContext,
            };
        } else {
            context = {
                parentNode,
                get node() {
                    const nonEmptyLink = links.get(vnode).find(({node}) => node != null);
                    return nonEmptyLink ? nonEmptyLink.node : null;
                },
                get nodes() {
                    return links.get(vnode)
                        .map((link) => link.node)
                        .filter((node) => node != null);
                },
                domContext,
            }
        }
        contexts.set(vnode, context);
    }

    function getVNodeContext(vnode: VNode) {
        return contexts.get(vnode);
    }

    function setRootVNode(vnode: VNode) {
        const parentNode = rootNode.parentElement;
        links.set(vnode, [{
            parentNode,
            node: rootNode,
        }]);
        createVNodeContext(vnode, parentNode);
    }

    function addVNode(vnode: VNode) {
        const parent = vnode.parent();

        if (parent == null) {
            setRootVNode(vnode);
            return;
        }

        const isParentDOMVNode = isDOMVNode(parent);
        const isBranch = linkedParents.has(parent);

        const parentContext = contexts.get(parent);
        const parentNode = isParentDOMVNode ?
            parentContext.node :
            parentContext.parentNode;

        const vnodeLinks: VNodeLink[] = [];
        links.set(vnode, vnodeLinks);

        if (isParentDOMVNode || isBranch) {
            const newLink: VNodeLink = {
                parentNode,
                node: null,
            };

            let current = vnode;
            do {
                links.get(current).push(newLink);
                current = current.parent();
            } while (!isDOMVNode(current));
        } else {
            const parentLinks = links.get(parent);
            vnodeLinks.push(...parentLinks);
            linkedParents.add(parent);
        }

        if (isDOMVNode(vnode)) {
            vnodeLinks.forEach((link) => link.node = vnode.node);
        }

        createVNodeContext(vnode, parentNode);
    }

    const domContext = {
        addVNode,
        getVNodeContext,
    };

    return domContext;
}
