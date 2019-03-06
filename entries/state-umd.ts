import withState, {useState} from '../src/state';
(withState as any).useState = useState;
export default withState;
