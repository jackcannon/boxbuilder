import { Grid2, Input, InputAdornment, Slider, Switch, Tooltip, Typography } from '@mui/material';
import HelpIcon from '@mui/icons-material/Help';

import { FormInputConfig } from './schema';

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
          step={config.sliderStep}
          min={config.min ?? config.sliderStep ?? config.inputStep ?? 0}
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
            step: config.inputStep ?? config.sliderStep ?? 1,
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
          step: config.inputStep ?? config.sliderStep ?? 1,
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

const ClickableType = ({ text, onClick }: { text?: string; onClick: () => any }) => {
  if (!text) return null;
  return (
    <Typography variant="body2" onClick={onClick} sx={{ cursor: 'pointer' }}>
      {text}
    </Typography>
  );
};
export const FormInputCheckbox = <T extends unknown>({ propName, config, value, onChange }: InputProps<T>) => {
  const endAdornment = config.unit ? (
    <InputAdornment position="end" sx={{ margin: 0 }}>
      {config.unit}
    </InputAdornment>
  ) : undefined;

  return (
    <Grid2 container flex={1} flexGrow={1} justifyContent="center" alignItems="center">
      <Grid2>
        <ClickableType text={config.falseLabel} onClick={() => onChange(false as T)} />
      </Grid2>
      <Switch
        checked={Boolean(value)}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(Boolean(event.target.checked) as T)}
        inputProps={{ 'aria-label': 'controlled' }}
        sx={{ margin: '0' }}
      />
      <Grid2>
        <ClickableType text={config.trueLabel} onClick={() => onChange(true as T)} />
      </Grid2>
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
      case 'checkbox':
        return <FormInputCheckbox {...props} />;
      default:
        return <FormInputSlider {...props} />;
    }
  };

  return (
    <Grid2 container spacing={0} sx={{ alignItems: 'center', margin: '0 0.25em 0.75em' }}>
      <Grid2 sx={{ width: '100%' }}>
        <Typography variant="body2" id={`input-slider-${propName}`}>
          {config.displayName}{' '}
          <Tooltip
            title={
              config.warning ? (
                <>
                  <div>{config.description}</div>
                  {
                    <>
                      <br />
                      <Typography sx={{ fontSize: '0.9em' }}>
                        <b>
                          <em>Warning!</em>
                        </b>{' '}
                        {config.warning}
                      </Typography>
                    </>
                  }
                </>
              ) : (
                config.description
              )
            }
            arrow
          >
            <HelpIcon
              sx={{
                fontSize: '1.2em',
                verticalAlign: 'middle',
                margin: '-0.5em 0 -0.4em',
                marginLeft: '0.25em',
                opacity: 0.5
              }}
              color={config.warning ? 'warning' : 'inherit'}
            />
          </Tooltip>
        </Typography>
      </Grid2>
      <Grid2 container spacing={2} sx={{ width: '100%' }}>
        {section()}
      </Grid2>
    </Grid2>
  );
};
