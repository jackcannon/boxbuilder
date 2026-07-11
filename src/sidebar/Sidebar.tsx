import { Button, Tooltip } from '@mui/material';
import { Geometry } from '@jscad/modeling/src/geometries/types';
import GitHubIcon from '@mui/icons-material/GitHub';

import { exportSTL } from '../geometry/exportStl';
import { FormObject, FormSchema } from '../form/schema';
import { Form } from '../form/Form';

import logo from '/logo.svg';
import patternModifiersLogo from '/pattern-modifiers-logo.svg';

import './sidebar.css';

interface Props {
  style: React.CSSProperties | undefined;
  form: FormObject;
  setForm: (form: FormObject) => void;
}

export const Sidebar = ({ style, form, setForm }: Props) => {
  return (
    <section className="sidebar" style={style}>
      <img src={logo} alt="logo" className="logo" />

      <Form object={form} schema={FormSchema} onChange={setForm} />

      {/* <pre>{JSON.stringify(form, null, 2)}</pre> */}

      <div>
        <Button variant="contained" color="primary" onClick={() => exportSTL(form, form.fileName)}>
          Download STL
        </Button>
      </div>

      <div className="gap"></div>

      <div className="footer">
        <Tooltip title="Pattern Modifiers" arrow>
          <a
            href="https://patterns.cannonbury.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link pattern-modifiers-link"
          >
            <img src={patternModifiersLogo} alt="Pattern Modifiers" />
          </a>
        </Tooltip>
        <Tooltip title="View source on GitHub" arrow>
          <a
            href="https://github.com/jackcannon/boxbuilder"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link github-link"
          >
            <GitHubIcon />
          </a>
        </Tooltip>
      </div>
    </section>
  );
};
