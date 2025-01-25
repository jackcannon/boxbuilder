import React, { ReactNode } from 'react';

export const HBox = (props: { children: ReactNode }) => {
  return <div className="hbox">{props.children}</div>;
};
