import React from 'react';
import ReactDOM from 'react-dom/client';
import { TownScene } from './components/TownScene';
import { StateManager } from './services/StateManager';
import { Model } from './services/Model';

const Main: React.FC = () => {
  StateManager.pullParams();
  StateManager.pushParams();

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
