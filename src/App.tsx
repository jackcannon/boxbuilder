import { FormObject, FormSchema, defaultForm } from './form/schema';
import { formToSolids } from './geometry/formToSolids';
import { CadRender } from './render/Render';
import { Sidebar } from './sidebar/Sidebar';

import { SIDEBAR_PERCENT } from './constants';
import { useHistoryDoc } from './useHistoryDoc';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import './App.css';

const theme = createTheme({
  colorSchemes: {
    dark: true
  }
});

const getStyle = (percent: number) => ({
  width: `${percent}vw`
});

const App = () => {
  const [form, setForm] = useHistoryDoc(FormSchema, defaultForm);
  const solids = formToSolids(form);

  const sidebarSize = SIDEBAR_PERCENT;
  const renderSize = 100 - SIDEBAR_PERCENT;

  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <main>
        <Sidebar form={form} setForm={setForm} solids={solids} style={getStyle(sidebarSize)} />
        <CadRender solids={solids} style={getStyle(renderSize)} />
      </main>
    </ThemeProvider>
  );
};

export default App;
