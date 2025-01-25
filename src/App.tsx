// @ts-ignore
import * as serializer from '@jscad/stl-serializer';
import { Renderer } from 'jscad-react';
import { Geom3, Geometry } from '@jscad/modeling/src/geometries/types';

import { Box, BoxSchema, defaultBox } from './form/schema';
import { boxToSolids } from './geometry/boxToSolids';
import { exportSTL } from './geometry/exportStl';

import { AutoForm } from './autoform';
import { useHistoryDoc } from './useHistoryDoc';

import './App.css';

const App = () => {
  const [box, setBox] = useHistoryDoc<Box>(BoxSchema, defaultBox);
  const solids = boxToSolids(box);
  return (
    <main>
      <h1>Simple STL Box Generator</h1>
      <h2>For 3D printers</h2>
      <AutoForm object={box} schema={BoxSchema} onChange={setBox} />
      <nav>
        <button onClick={() => exportSTL(solids)}>Generate STL</button>
        <a href={'https://github.com/joshmarinacci/boxbuilder'}>GitHub source</a>
      </nav>
      <Renderer solids={solids as Geom3[]} width={800} height={450} />
      <aside>
        <table>
          <tr>
            <th>action</th> <th>gesture</th>
          </tr>
          <tr>
            <td>rotate</td> <td>left mouse drag</td>
          </tr>
          <tr>
            <td>pan</td> <td>shift left mouse drag</td>
          </tr>
          <tr>
            <td>zoom</td> <td>scroll wheel</td>
          </tr>
        </table>
      </aside>
    </main>
  );
};

export default App;
