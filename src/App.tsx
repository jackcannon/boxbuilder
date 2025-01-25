// @ts-ignore
import * as serializer from '@jscad/stl-serializer';
import { Renderer } from 'jscad-react';
import { Geometry } from '@jscad/modeling/src/geometries/types';

import { Box, BoxSchema, default_box } from './form/schema';
import { box_to_solids } from './geometry/boxToSolids';

import { forceDownloadBlob } from './util';
import { AutoForm } from './autoform';
import { useHistoryDoc } from './useHistoryDoc';

import './App.css';

const export_stl = (solids: Geometry[]) => {
  const rawData = serializer.serialize({ binary: true }, solids);
  const blob = new Blob(rawData, { type: 'model/stl' });
  forceDownloadBlob('box.stl', blob);
};

function App() {
  const [box, set_box] = useHistoryDoc<Box>(BoxSchema, default_box);
  const solids = box_to_solids(box);
  return (
    <main>
      <h1>Simple STL Box Generator</h1>
      <h2>For 3D printers</h2>
      <AutoForm object={box} schema={BoxSchema} onChange={set_box} />
      <nav>
        <button onClick={() => export_stl(solids)}>Generate STL</button>
        <a href={'https://github.com/joshmarinacci/boxbuilder'}>GitHub source</a>
      </nav>
      <Renderer solids={solids} width={800} height={450} />
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
}

export default App;
