import { ZodArray, ZodEffects, ZodEnum, ZodNumber, ZodObject, ZodString } from 'zod';
import React, { useState, ChangeEvent } from 'react';
import { HBox } from './common';
import { FormObject, FormSchemaType } from './form/schema';

const RangeNumberInput = <T extends ZodNumber>(props: { schema: T; value: number; name: string; onChange: (n: number) => void; range: boolean }) => {
  let scale = 1;
  if (!props.schema.isInt) {
    scale = 10;
  }
  const update = (e: ChangeEvent<HTMLInputElement>) => {
    if (props.schema.isInt) {
      let v = parseInt(e.target.value);
      props.onChange(v);
    } else {
      let v = parseFloat(e.target.value);
      props.onChange(v / scale);
    }
  };
  return (
    <input
      type="range"
      value={props.value * scale}
      min={props.schema.minValue !== null ? props.schema.minValue * scale : undefined}
      max={props.schema.maxValue !== null ? props.schema.maxValue * scale : undefined}
      onChange={update}
    />
  );
};

const TextNumberInput = <T extends ZodNumber>(props: { schema: T; value: number; name: string; onChange: (n: number) => void; range: boolean }) => {
  let scale = 1;
  if (!props.schema.isInt) {
    scale = 10;
  }
  const update = (e: ChangeEvent<HTMLInputElement>) => {
    if (props.schema.isInt) {
      let v = parseInt(e.target.value);
      props.onChange(v);
    } else {
      let v = parseFloat(e.target.value);
      props.onChange(v / scale);
    }
  };
  return (
    <input
      type="number"
      value={props.value * scale}
      min={props.schema.minValue !== null ? props.schema.minValue * scale : undefined}
      max={props.schema.maxValue !== null ? props.schema.maxValue * scale : undefined}
      onChange={update}
    />
  );
};

const StringInput = <T extends ZodString>(props: { schema: T; value: string; name: string; onChange: (n: string) => void }) => {
  return <input type="text" value={props.value} onChange={(e) => props.onChange(e.target.value)} />;
};

const EnumInput = <T extends ZodEnum<any>>(props: { schema: T; onChange: (v: any) => void; name: string; value: any }) => {
  return (
    <div>
      <select
        value={props.value}
        onChange={(e) => {
          props.onChange(e.target.value);
        }}
      >
        {Object.entries(props.schema.enum).map(([k, v]) => {
          return (
            <option key={k} value={k}>
              {v}
            </option>
          );
        })}
      </select>
    </div>
  );
};

const ArrayInput = <T extends ZodArray<any>>(props: { schema: T; onChange: (v: any[]) => void; name: string; value: any[] }) => {
  const [txt, setTxt] = useState('');
  const add = () => {
    let arr = [...props.value];
    arr.push(txt);
    props.onChange(arr);
    setTxt('');
  };
  const nuke = (index: number) => {
    let arr = props.value.slice();
    arr.splice(index, 1);
    props.onChange(arr);
  };
  return (
    <ul>
      {props.value.map((v, i) => {
        return (
          <li key={i}>
            {v}
            <button onClick={() => nuke(i)}>[x]</button>
          </li>
        );
      })}
      <HBox>
        <input
          type="text"
          value={txt}
          onChange={(e) => setTxt(e.target.value)}
          onKeyDown={(e) => {
            if (e.code === 'Enter') add();
          }}
        />
        <button onClick={add}>add</button>
      </HBox>
    </ul>
  );
};

const ObjectInput = <T extends ZodObject<any>>(props: { schema: T; name: string; onChange: (e: any) => void; object: any }) => {
  const updateObjectProperty = (k: string, v: any) => {
    let newObj = { ...props.object };
    newObj[k] = v;
    props.onChange(newObj);
  };
  return (
    <div className={'object-input'}>
      {Object.entries(props.schema.shape).map(([k, v]) => {
        if (v instanceof ZodNumber) {
          return (
            <div className="row" key={k}>
              <label>{k}</label>
              <RangeNumberInput range={false} schema={v} name={k} value={props.object[k]} onChange={(v) => updateObjectProperty(k, v)} />
              <TextNumberInput range={false} schema={v} name={k} value={props.object[k]} onChange={(v) => updateObjectProperty(k, v)} />
              {/*<label className="value">{props.object[k]}</label>*/}
              <i>mm</i>
            </div>
          );
        }
        if (v instanceof ZodString) {
          return (
            <div className="row" key={k}>
              <label>{k}</label>
              <StringInput schema={v as ZodString} name={k} value={props.object[k]} onChange={(v) => updateObjectProperty(k, v)} />
            </div>
          );
        }
        if (v instanceof ZodEnum) {
          return (
            <div className="row" key={k}>
              <label>{k}</label>
              <EnumInput schema={v as ZodEnum<any>} name={k} value={props.object[k]} onChange={(v) => updateObjectProperty(k, v)} />
            </div>
          );
        }
        if (v instanceof ZodArray) {
          return (
            <div className="row" key={k}>
              <label>{k}</label>
              <ArrayInput schema={v as ZodArray<any>} name={k} value={props.object[k] as any[]} onChange={(v) => updateObjectProperty(k, v)} />
            </div>
          );
        }
        if (v instanceof ZodObject) {
          return (
            <div className="row" key={k}>
              <label>{k}</label>
              <ObjectInput schema={v as ZodObject<any>} name={k} object={props.object[k]} onChange={(v) => updateObjectProperty(k, v)} />
            </div>
          );
        }
        if (v instanceof ZodEffects && v._def.schema instanceof ZodObject) {
          return (
            <div className="row" key={k}>
              <label>{k}</label>
              <label>effect</label>
              <ObjectInput schema={v._def.schema as ZodObject<any>} name={k} object={props.object[k]} onChange={(v) => updateObjectProperty(k, v)} />
            </div>
          );
        }
        return <div key={k}>child prop {k}</div>;
      })}
    </div>
  );
};

export const AutoForm = <T extends any>(props: { schema: FormSchemaType; object: FormObject; onChange: (v: T) => void }) => {
  return (
    <div className="auto-form">
      <ObjectInput schema={props.schema} name="self" onChange={props.onChange} object={props.object} />
    </div>
  );
};
