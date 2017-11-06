import { plugins } from 'malevic';

let registered = false;

export default function withForms() {
    if (registered) {
        return;
    }
    registered = true;

    plugins.render.setAttribute
        .add(({ element, attr, value }) => {
            if (attr === 'value' && element instanceof HTMLInputElement) {
                const text = value == null ? '' : String(value);
                if (element.hasAttribute('value')) {
                    element.value = text;
                } else {
                    element.setAttribute('value', text);
                }
                return true;
            }
            return null;
        });

    plugins.render.createNode
        .add(({ d, parent }) => {
            if (typeof d === 'string' && parent instanceof HTMLTextAreaElement) {
                const text = d;
                const value = text == null ? '' : String(text);
                if (parent.textContent || parent.hasAttribute('value')) {
                    parent.value = text;
                } else {
                    parent.textContent = value;
                }
                return parent.firstChild;
            }
            return null;
        });
}
