import AdjustIcon from '@mui/icons-material/Adjust';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import { IconButton, Tooltip } from '@mui/material';

import { CameraTarget } from './CameraController';

interface Props {
  height: number;
  onFocus: (target: CameraTarget) => void;
}

export const CameraFocusButtons = ({ height, onFocus }: Props) => {
  return (
    <div className="render-focus-controls">
      <Tooltip title="Centre on origin" arrow placement="left">
        <IconButton
          size="small"
          aria-label="Centre on origin"
          className="render-focus-button"
          onClick={() => onFocus([0, 0, 0])}
        >
          <AdjustIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Centre on box" arrow placement="left">
        <IconButton
          size="small"
          aria-label="Centre on box"
          className="render-focus-button"
          onClick={() => onFocus([0, 0, height / 2])}
        >
          <ViewInArIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </div>
  );
};
