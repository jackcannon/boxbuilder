import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { NoToneMapping } from 'three';

import { FormObject } from '../form/schema';
import { SIDEBAR_PERCENT } from '../constants';

import { BoxModel } from './BoxModel';
import { CameraAngleResetButton } from './CameraAngleResetButton';
import { CameraController, CameraTarget } from './CameraController';
import { CameraFocusButtons } from './CameraFocusButtons';
import { defaultCameraTarget, DEFAULT_CAMERA_FOV, DEFAULT_CAMERA_POSITION, DEFAULT_CAMERA_UP } from './cameraDefaults';
import { useWindowSize } from './useWindowSize';

import './render.css';

interface Props {
  style: React.CSSProperties | undefined;
  form: FormObject;
}

export const CadRender = ({ style, form }: Props) => {
  const [width, height] = useWindowSize();
  const sectionRatio = (100 - SIDEBAR_PERCENT) / 100;
  const [cameraTarget, setCameraTarget] = useState<CameraTarget>(() => defaultCameraTarget(form.height));
  const [cameraAngleReset, setCameraAngleReset] = useState(0);

  return (
    <section className="render" style={style}>
      <CameraFocusButtons height={form.height} onFocus={setCameraTarget} />
      <CameraAngleResetButton onReset={() => setCameraAngleReset((n) => n + 1)} />
      <Canvas
        style={{ width: width * sectionRatio, height }}
        camera={{
          position: DEFAULT_CAMERA_POSITION,
          up: DEFAULT_CAMERA_UP,
          fov: DEFAULT_CAMERA_FOV,
          near: 1,
          far: 10000
        }}
        gl={{ alpha: true, toneMapping: NoToneMapping }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = NoToneMapping;
        }}
      >
        {/*
          Top-weighted key light: Lz > Lx > |Ly| so +Z is lightest, and the two
          side axes still diverge enough for clear vertical edges.
        */}
        <ambientLight intensity={0.14} />
        <directionalLight position={[0.55, -0.28, 1]} intensity={1.55} />
        <directionalLight position={[-0.55, 0.75, 0.35]} intensity={0.16} />
        <Suspense fallback={null}>
          <BoxModel form={form} />
        </Suspense>
        <CameraController target={cameraTarget} resetAngleSignal={cameraAngleReset} />
      </Canvas>
    </section>
  );
};
