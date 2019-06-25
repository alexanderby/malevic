import {escapeHTML} from './escape';

export function processText(text: string) {
    return escapeHTML(text);
}
