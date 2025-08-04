import React from 'react';
import ReactDOM from 'react-dom/client';
import { TownScene } from './components/TownScene';

const Main: React.FC = () => {
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
