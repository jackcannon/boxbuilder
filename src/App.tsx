import { FormObject, FormSchema, defaultForm } from './form/schema';
import { formToSolids } from './geometry/formToSolids';
import { Render } from './render/Render';
import { Sidebar } from './sidebar/Sidebar';

import { SIDEBAR_PERCENT } from './constants';
import { useHistoryDoc } from './useHistoryDoc';

import './App.css';

const getStyle = (percent: number) => ({
  width: `${percent}vw`
});

const App = () => {
  const [form, setForm] = useHistoryDoc<FormObject>(FormSchema, defaultForm);
  const solids = formToSolids(form);

  const sidebarSize = SIDEBAR_PERCENT;
  const renderSize = 100 - SIDEBAR_PERCENT;

  return (
    <main>
      <Sidebar form={form} setForm={setForm} solids={solids} style={getStyle(sidebarSize)} />
      <Render solids={solids} style={getStyle(renderSize)} />
    </main>
  );
};

export default App;
