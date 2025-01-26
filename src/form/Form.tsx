import { FormInput } from './FormInputs';
import { formConfig, FormObject, FormSchemaType } from './schema';

import './form.css';

interface Props {
  schema: FormSchemaType;
  object: FormObject;
  onChange: (v: FormObject) => void;
}

export const Form = ({ schema, object, onChange }: Props) => {
  return (
    <div className="form">
      {Object.entries(formConfig).map(([key, config]) => {
        const value = object[key as unknown as keyof FormObject];
        const onChangeValue = <T extends unknown>(v: T) => onChange({ ...object, [key]: v });

        return <FormInput key={key} propName={key} config={config} value={value} onChange={onChangeValue} />;
      })}
    </div>
  );
};
