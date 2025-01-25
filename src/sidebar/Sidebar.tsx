import { Geometry } from '@jscad/modeling/src/geometries/types';

import { exportSTL } from '../geometry/exportStl';
import { Box, BoxSchema } from '../form/schema';
import { AutoForm } from '../autoform';

import './sidebar.css';

interface Props {
  style: React.CSSProperties | undefined;
  box: Box;
  setBox: (box: Box) => void;
  solids: Geometry[];
}

export const Sidebar = ({ style, box, setBox, solids }: Props) => {
  return (
    <section className="sidebar" style={style}>
      <AutoForm object={box} schema={BoxSchema} onChange={setBox} />
      <nav>
        <button onClick={() => exportSTL(solids)}>Generate STL</button>
        <a href={'https://github.com/joshmarinacci/boxbuilder'}>GitHub source</a>
      </nav>
    </section>
  );
};
