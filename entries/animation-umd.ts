import withAnimation, { animate } from '../src/animation';
(withAnimation as any).animate = animate;
export default withAnimation;
