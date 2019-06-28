import {isPlainObject} from '../utils/misc';
import {AnimationDeclaration} from './declaration';

export function isAnimatedStyleObj(value: any) {
    return (
        isPlainObject(value) &&
        Object.values(value).some((v) => v instanceof AnimationDeclaration)
    );
}
