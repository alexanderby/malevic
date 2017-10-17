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

    plugins.render.setText
        .add(({ element, text }) => {
            if (element instanceof HTMLTextAreaElement) {
                const value = text == null ? '' : String(text);
                if (element.textContent || element.hasAttribute('value')) {
                    element.value = text;
                } else {
                    element.textContent = value;
                }
                return true;
            }
            return null;
        });
}
