import { Grid2, Input, InputAdornment, Slider, TextField, Typography } from '@mui/material';
import { FormInputConfig, FormObject } from './schema';

interface InputProps<T> {
  propName: string;
  config: FormInputConfig;
  value: T;
  onChange: (v: T) => void;
}

export const FormInputSlider = <T extends unknown>(props: InputProps<T>) => {
  const { propName, config, value, onChange } = props;

  const endAdornment = config.unit ? (
    <InputAdornment position="end" sx={{ margin: 0 }}>
      {config.unit}
    </InputAdornment>
  ) : undefined;

  const labelId = `input-slider-${propName}`;

  return (
    <Grid2 container spacing={2} sx={{ alignItems: 'center', margin: '0 0.25em' }}>
      <Grid2 sx={{ width: '125px' }}>
        <Typography id={labelId} gutterBottom>
          {config.displayName}
        </Typography>
      </Grid2>
      <Grid2 flex={1} flexGrow={1}>
        <Slider
          value={typeof value === 'number' ? value : 0}
          onChange={(event: Event, newValue: number | number[]) => {
            onChange(Number((newValue as number[])[0] ?? newValue) as any);
          }}
          aria-labelledby={labelId}
        />
      </Grid2>
      <Grid2>
        <Input
          type="number"
          value={value}
          size="small"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value;
            const num = Number(value);
            if (!isNaN(num)) onChange(num as any);
          }}
          sx={{ width: '85px' }}
          inputProps={{ 'aria-labelledby': labelId }}
          endAdornment={endAdornment}
        />
      </Grid2>
    </Grid2>
  );
};

export const FormInputNumber = <T extends unknown>(props: InputProps<T>) => {
  const { propName, config, value, onChange } = props;

  return (
    <div>
      <TextField
        type="number"
        label={config.displayName}
        variant="outlined"
        size="small"
        value={value}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          onChange(Number(event.target.value) as any);
        }}
      />
    </div>
  );
};

export const FormInput = <T extends unknown>(props: InputProps<T>) => {
  switch (props.config.type) {
    case 'slider':
      return <FormInputSlider {...props} />;
    case 'number':
      return <FormInputNumber {...props} />;
    default:
      return <FormInputSlider {...props} />;
  }
};
export const FormInput_OLD = <T extends unknown>(props: InputProps<T>) => {
  const { propName, config, value, onChange } = props;

  return (
    <div>
      <label>{config.displayName}</label>
      <input
        type="number"
        value={value as any}
        onChange={(e) => {
          const value = parseFloat(e.target.value);
          if (!isNaN(value)) {
            onChange(value as T);
          }
        }}
      />
    </div>
  );
};
