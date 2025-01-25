import { Grid2, Input, InputAdornment, Slider, TextField, Typography } from '@mui/material';
import { FormInputConfig, FormObject } from './schema';

interface InputProps<T> {
  propName: string;
  config: FormInputConfig;
  value: T;
  onChange: (v: T) => void;
}

export const FormInputSlider = <T extends unknown>({ propName, config, value, onChange }: InputProps<T>) => {
  const endAdornment = config.unit ? (
    <InputAdornment position="end" sx={{ margin: 0 }}>
      {config.unit}
    </InputAdornment>
  ) : undefined;

  return (
    <>
      <Grid2 flex={1} flexGrow={1} sx={{ paddingLeft: '0.5em' }}>
        <Slider
          value={typeof value === 'number' ? value : 0}
          onChange={(event: Event, newValue: number | number[]) => {
            onChange(Number((newValue as number[])[0] ?? newValue) as any);
          }}
          aria-labelledby={`input-slider-${propName}`}
          step={config.step}
          min={config.min ?? config.step ?? 0}
          max={config.max}
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
          inputProps={{
            step: config.step ?? 1,
            'aria-labelledby': `input-slider-${propName}`
          }}
          endAdornment={endAdornment}
        />
      </Grid2>
    </>
  );
};

export const FormInputNumber = <T extends unknown>({ propName, config, value, onChange }: InputProps<T>) => {
  const endAdornment = config.unit ? (
    <InputAdornment position="end" sx={{ margin: 0 }}>
      {config.unit}
    </InputAdornment>
  ) : undefined;
  return (
    <Grid2 flex={1} flexGrow={1}>
      <Input
        type="number"
        value={value}
        size="small"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          const value = event.target.value;
          const num = Number(value);
          if (!isNaN(num)) onChange(num as any);
        }}
        sx={{ width: '100%' }}
        inputProps={{
          step: config.step ?? 1,
          'aria-labelledby': `input-slider-${propName}`
        }}
        endAdornment={endAdornment}
      />
    </Grid2>
  );
};

export const FormInputText = <T extends unknown>({ propName, config, value, onChange }: InputProps<T>) => {
  const endAdornment = config.unit ? (
    <InputAdornment position="end" sx={{ margin: 0 }}>
      {config.unit}
    </InputAdornment>
  ) : undefined;
  return (
    <Grid2 flex={1} flexGrow={1}>
      <Input
        value={value}
        size="small"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value as any)}
        sx={{ width: '100%' }}
        inputProps={{ 'aria-labelledby': `input-slider-${propName}` }}
        endAdornment={endAdornment}
      />
    </Grid2>
  );
};

export const FormInput = <T extends unknown>(props: InputProps<T>) => {
  const { propName, config, value, onChange } = props;

  const section = () => {
    switch (props.config.type) {
      case 'slider':
        return <FormInputSlider {...props} />;
      case 'number':
        return <FormInputNumber {...props} />;
      case 'text':
        return <FormInputText {...props} />;
      default:
        return <FormInputSlider {...props} />;
    }
  };

  return (
    <Grid2 container spacing={0} sx={{ alignItems: 'center', margin: '0 0.25em 0.75em' }}>
      <Grid2 sx={{ width: '100%' }}>
        <Typography variant="body2" id={`input-slider-${propName}`}>
          {config.displayName}
        </Typography>
      </Grid2>
      <Grid2 container spacing={2} sx={{ width: '100%' }}>
        {section()}
      </Grid2>
    </Grid2>
  );
};
