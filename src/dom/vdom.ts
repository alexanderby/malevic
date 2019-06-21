import LinkedList from '../utils/linked-list';
import exec from './execute';
import {isDOMVNode, VNode} from './vnode';

export interface VDOM {
    execute(vnode: VNode, old: VNode): void;
    addVNode(vnode: VNode): void;
    getVNodeContext(vnode: VNode): VNodeContext;
    replaceVNode(old: VNode, vnode: VNode): void;
    adoptVNode(vnode: VNode, parent: VNode): void;
    LEAVE: Symbol;
}

export interface VNodeContext {
    parentNode: Node;
    node: Node;
    nodes: Node[];
    sibling: Node;
    vdom: VDOM;
}

interface VLink {
    parentNode: Node;
    node: Node;
}

interface VHub {
    node: Node;
    links: LinkedList<VLink>;
}

export default function createVDOM(rootNode: Node): VDOM {
    const contexts = new WeakMap<VNode, VNodeContext>();
    const hubs = new WeakMap<Node, VHub>();
    const parentNodes = new WeakMap<VNode, Node>();
    const passingLinks = new WeakMap<VNode, LinkedList<VLink>>();
    const linkedParents = new WeakSet<VNode>();

    const LEAVE = Symbol();

    function execute(vnode: VNode, old: VNode) {
        exec(vnode, old, vdom);
    }

    function creatVNodeContext(vnode: VNode) {
        const parentNode = parentNodes.get(vnode);

        contexts.set(vnode, {
            parentNode,
            get node() {
                const linked = passingLinks.get(vnode).find((link) => link.node != null);
                return linked ? linked.node : null;
            },
            get nodes() {
                return passingLinks.get(vnode).map((link) => link.node).filter(((node) => node));
            },
            get sibling() {
                if (parentNode === rootNode.parentElement) {
                    return passingLinks.get(vnode).first.node.previousSibling;
                }

                const hub = hubs.get(parentNode);
                let current = passingLinks.get(vnode).first;
                while (current = hub.links.before(current)) {
                    if (current.node) {
                        return current.node;
                    }
                }
                return null;
            },
            vdom,
        });
    }

    function setRootVNode(vnode: VNode) {
        const parentNode = rootNode.parentElement || document.createDocumentFragment();
        const node = rootNode;
        const links = new LinkedList<VLink>({
            parentNode,
            node,
        });
        passingLinks.set(vnode, links.copy());
        parentNodes.set(vnode, parentNode);
        hubs.set(parentNode, {
            node: parentNode,
            links,
        });

        creatVNodeContext(vnode);
    }

    function addVNode(vnode: VNode) {
        if (contexts.has(vnode)) {
            return;
        }

        const parent = vnode.parent();

        if (parent == null) {
            setRootVNode(vnode);
            return;
        }

        const isBranch = linkedParents.has(parent);
        const parentNode = isDOMVNode(parent) ?
            parent.node :
            parentNodes.get(parent);
        parentNodes.set(vnode, parentNode);

        const vnodeLinks = new LinkedList<VLink>()
        passingLinks.set(vnode, vnodeLinks);

        if (isBranch) {
            const newLink: VLink = {
                parentNode,
                node: null,
            };

            for (
                let current = vnode;
                current && !isDOMVNode(current);
                current = current.parent()
            ) {
                passingLinks.get(current).push(newLink);
            }

            hubs.get(parentNode).links.push(newLink);
        } else {
            linkedParents.add(parent);

            const links = isDOMVNode(parent) ? hubs.get(parentNode).links : passingLinks.get(parent);
            links.forEach((link) => vnodeLinks.push(link));
        }

        if (isDOMVNode(vnode)) {
            const {node} = vnode;
            hubs.set(node, {
                node,
                links: new LinkedList({
                    parentNode: node,
                    node: null,
                }),
            });

            vnodeLinks.forEach((link) => link.node = node);
        }

        creatVNodeContext(vnode);
    }

    function getVNodeContext(vnode: VNode) {
        return contexts.get(vnode);
    }

    function getAncestorsLinks(vnode: VNode) {
        const parentNode = parentNodes.get(vnode);
        const hub = hubs.get(parentNode);

        const allLinks: LinkedList<VLink>[] = [];
        let current: VNode = vnode;
        while ((current = current.parent()) && !isDOMVNode(current)) {
            allLinks.push(passingLinks.get(current));
        }
        allLinks.push(hub.links);

        return allLinks;
    }

    function replaceVNode(old: VNode, vnode: VNode) {
        if (vnode.parent() == null) {
            setRootVNode(vnode);
            return;
        }

        const oldContext = contexts.get(old);
        const {parentNode} = oldContext;
        parentNodes.set(vnode, parentNode);
        const oldLinks = passingLinks.get(old);

        const newLink: VLink = {
            parentNode,
            node: null,
        };

        getAncestorsLinks(vnode).forEach((links) => {
            const nextLink = links.after(oldLinks.last);
            oldLinks.forEach((link) => links.delete(link));
            if (nextLink) {
                links.insertBefore(newLink, nextLink);
            } else {
                links.push(newLink);
            }
        });

        const vnodeLinks = new LinkedList(newLink);
        passingLinks.set(vnode, vnodeLinks);

        creatVNodeContext(vnode);
    }

    function adoptVNode(vnode: VNode, parent: VNode) {
        const vnodeLinks = passingLinks.get(vnode);
        const parentLinks = passingLinks.get(parent).copy();
        vnode.parent(parent);
        getAncestorsLinks(vnode).forEach((links) => {
            vnodeLinks.forEach((link) => links.insertBefore(link, parentLinks.first));
            parentLinks.forEach((link) => links.delete(link));
        });
    }

    const vdom: VDOM = {
        execute,
        addVNode,
        getVNodeContext,
        replaceVNode,
        adoptVNode,
        LEAVE
    };

    return vdom;
}
