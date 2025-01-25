import { Box, BoxSchema, defaultBox } from './form/schema';
import { boxToSolids } from './geometry/boxToSolids';
import { Render } from './render/Render';
import { Sidebar } from './sidebar/Sidebar';

import { SIDEBAR_PERCENT } from './constants';
import { useHistoryDoc } from './useHistoryDoc';

import './App.css';

const getStyle = (percent: number) => ({
  width: `${percent}vw`
});

const App = () => {
  const [box, setBox] = useHistoryDoc<Box>(BoxSchema, defaultBox);
  const solids = boxToSolids(box);

  const sidebarSize = SIDEBAR_PERCENT;
  const renderSize = 100 - SIDEBAR_PERCENT;

  return (
    <main>
      <Sidebar box={box} setBox={setBox} solids={solids} style={getStyle(sidebarSize)} />
      <Render solids={solids} style={getStyle(renderSize)} />
    </main>
  );
};

export default App;
