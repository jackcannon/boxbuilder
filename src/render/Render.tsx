import { Renderer } from 'jscad-react';
import { Geom3, Geometry } from '@jscad/modeling/src/geometries/types';

import { useWindowSize } from './useWindowSize';
import { SIDEBAR_PERCENT } from '../constants';

import './render.css';

interface Props {
  style: React.CSSProperties | undefined;
  solids: Geometry[];
}

export const Render = ({ style, solids }: Props) => {
  const [width, height] = useWindowSize();

  const sectionRatio = (100 - SIDEBAR_PERCENT) / 100;

  return (
    <section className="render" style={style}>
      <Renderer solids={solids as Geom3[]} width={width * sectionRatio} height={height} />
    </section>
  );
};
