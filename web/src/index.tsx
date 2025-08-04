import React from 'react';
import ReactDOM from 'react-dom/client';
import { TownScene } from './components/TownScene';
import './styles/global.css';

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
