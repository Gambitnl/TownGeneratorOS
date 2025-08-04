import React from 'react';
import ReactDOM from 'react-dom/client';
import { TownScene } from './components/TownScene';
import { StateManager } from './services/StateManager';
import { Model } from './services/Model';
import { CityMap } from './services/CityMap';

const Main: React.FC = () => {
  StateManager.pullParams();
  StateManager.pushParams();

  // This would be part of the component's style
  // document.body.style.backgroundColor = `#${CityMap.palette.paper.toString(16)}`;

  // Font setup would be handled with CSS

  new Model(StateManager.size, StateManager.seed);

  return <TownScene />;
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);