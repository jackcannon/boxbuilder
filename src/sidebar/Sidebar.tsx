import { Geometry } from '@jscad/modeling/src/geometries/types';

import { exportSTL } from '../geometry/exportStl';
import { FormObject, FormSchema } from '../form/schema';
import { AutoForm } from '../autoform';

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
      <AutoForm object={form} schema={FormSchema} onChange={setForm} />
      <nav>
        <button onClick={() => exportSTL(solids)}>Generate STL</button>
        <a href={'https://github.com/joshmarinacci/boxbuilder'}>GitHub source</a>
      </nav>
    </section>
  );
};
