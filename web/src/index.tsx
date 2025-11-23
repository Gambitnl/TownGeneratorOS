
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import { TownScene } from './components/TownScene';
import RealmSmithCanvas from './components/RealmSmithCanvas';
import { StateManager } from './services/StateManager';

const Main: React.FC = () => {
  const [mode, setMode] = useState<'classic' | 'realmsmith'>('realmsmith');

  StateManager.pullParams();
  StateManager.pushParams();

  return (
    <>
      <div style={{ position: 'fixed', top: 10, left: 10, zIndex: 1000, display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setMode('classic')}
          style={{ padding: '5px 10px', background: mode === 'classic' ? '#3b82f6' : '#374151', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Classic Grid
        </button>
        <button
          onClick={() => setMode('realmsmith')}
          style={{ padding: '5px 10px', background: mode === 'realmsmith' ? '#3b82f6' : '#374151', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          RealmSmith
        </button>
      </div>
      {mode === 'classic' ? <TownScene /> : <RealmSmithCanvas />}
    </>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
