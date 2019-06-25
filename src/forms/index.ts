import {Component} from 'malevic';
import {plugins as domPlugins} from 'malevic/dom';

export function withForms<T extends Component>(type: T): T {
    domPlugins.setAttribute.add(type, ({element, attr, value}) => {
        if (attr === 'value' && element instanceof HTMLInputElement) {
            const text = (element.value = value == null ? '' : value);
            element.value = text;
            return true;
        }
        return null;
    });

    return type;
}
