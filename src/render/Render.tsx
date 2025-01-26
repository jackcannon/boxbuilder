import { Renderer } from 'jscad-react';
import { Geom3, Geometry } from '@jscad/modeling/src/geometries/types';
import debounceRender from 'react-debounce-render';

import { useWindowSize } from './useWindowSize';
import { SIDEBAR_PERCENT } from '../constants';

import './render.css';

interface Props {
  style: React.CSSProperties | undefined;
  solids: Geometry[];
}

const CadRenderComponent = ({ style, solids }: Props) => {
  const [width, height] = useWindowSize();

  const sectionRatio = (100 - SIDEBAR_PERCENT) / 100;

  const initialDistance = 100;

  return (
    <section className="render" style={style}>
      <Renderer
        solids={solids as Geom3[]}
        options={{
          viewerOptions: {
            initialPosition: [initialDistance, -initialDistance, initialDistance]
          }
        }}
        width={width * sectionRatio}
        height={height}
      />
    </section>
  );
};

export const CadRender = debounceRender(CadRenderComponent, 10, {
  leading: true,
  maxWait: 50
});
