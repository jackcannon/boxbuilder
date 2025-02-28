import { Renderer } from 'jscad-react';
import { Geom3 } from '@jscad/modeling/src/geometries/types';
import debounceRender from 'react-debounce-render';

import { FormObject } from '../form/schema';
import { formToSolids } from '../geometry/formToSolids';

import { useWindowSize } from './useWindowSize';
import { SIDEBAR_PERCENT } from '../constants';
import { GET_DEBUG_TIMER } from '../utils';

import './render.css';

interface Props {
  style: React.CSSProperties | undefined;
  form: FormObject;
}

const CadRenderComponent = ({ style, form }: Props) => {
  const DEBUG_TIMER = GET_DEBUG_TIMER('formToSolids - CadRender');
  const solids = formToSolids(form, true);
  DEBUG_TIMER.stop();
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

const DEBOUNCE_WAIT = 30;
const DEBOUNCE_MAX_WAIT = DEBOUNCE_WAIT * 5;
export const CadRender = debounceRender(CadRenderComponent, DEBOUNCE_WAIT, {
  leading: true,
  maxWait: DEBOUNCE_MAX_WAIT
});
