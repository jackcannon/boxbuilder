import { TextField } from '@mui/material';
import { Geometry } from '@jscad/modeling/src/geometries/types';

import { exportSTL } from '../geometry/exportStl';
import { FormObject, FormSchema } from '../form/schema';
import { Form } from '../form/Form';

import logo from '/logo.svg';

import './sidebar.css';

interface Props {
  style: React.CSSProperties | undefined;
  form: FormObject;
  setForm: (form: FormObject) => void;
  solids: Geometry[];
}

export const Sidebar = ({ style, form, setForm, solids }: Props) => {
  return (
    <section className="sidebar" style={style}>
      <img src={logo} alt="logo" className="logo" />

      <Form object={form} schema={FormSchema} onChange={setForm} />

      <pre>{JSON.stringify(form, null, 2)}</pre>

      <nav>
        <button onClick={() => exportSTL(solids, form.fileName)}>Generate STL</button>
        <a href={'https://github.com/joshmarinacci/boxbuilder'}>GitHub source</a>
      </nav>
    </section>
  );
};
