import React, { useState, useEffect } from 'react';
import { CityMap } from '../services/CityMap';
import { Model } from '../services/Model';
import { StateManager } from '../services/StateManager';
import { Header } from './Header';
import { ControlPanel } from './ControlPanel';
import { LoadingSpinner } from './LoadingSpinner';
import { Tooltip } from './Tooltip';

const containerStyles: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, var(--primary-bg) 0%, var(--secondary-bg) 100%)',
  position: 'relative',
  overflow: 'hidden',
};

const mainContentStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
};

const mapContainerStyles: React.CSSProperties = {
  flex: 1,
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2rem',
  paddingRight: '400px', // Make room for control panel
  minHeight: 'calc(100vh - 200px)', // Account for header
};

const mapWrapperStyles: React.CSSProperties = {
  background: 'var(--card-bg)',
  borderRadius: 'var(--radius-lg)',
  border: '2px solid var(--border-color)',
  boxShadow: 'var(--shadow-strong)',
  padding: '1rem',
  maxWidth: '100%',
  maxHeight: '100%',
  overflow: 'auto',
  backdropFilter: 'blur(10px)',
  position: 'relative',
};

const mapOverlayStyles: React.CSSProperties = {
  position: 'absolute',
  top: '0',
  left: '0',
  right: '0',
  bottom: '0',
  background: 'linear-gradient(45deg, rgba(212, 175, 55, 0.05) 0%, transparent 25%, transparent 75%, rgba(205, 127, 50, 0.05) 100%)',
  pointerEvents: 'none',
  borderRadius: 'var(--radius-lg)',
};

const errorContainerStyles: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(220, 53, 69, 0.1) 0%, rgba(220, 53, 69, 0.05) 100%)',
  border: '1px solid rgba(220, 53, 69, 0.3)',
  borderRadius: 'var(--radius-md)',
  padding: '1.5rem',
  color: 'var(--text-primary)',
  textAlign: 'center',
  maxWidth: '400px',
  margin: '2rem auto',
};

const errorTitleStyles: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: '600',
  marginBottom: '0.5rem',
  color: '#ff6b6b',
};

const errorMessageStyles: React.CSSProperties = {
  fontSize: '1rem',
  lineHeight: 1.5,
  marginBottom: '1rem',
};

export const TownScene: React.FC = () => {
  const [model, setModel] = useState<Model | null>(null);
  const [tooltipText, setTooltipText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');

  const loadingMessages = [
    'Generating terrain...',
    'Placing settlements...',
    'Building roads...',
    'Constructing walls...',
    'Adding districts...',
    'Final touches...',
  ];

  useEffect(() => {
    initializeScene();
  }, []);

  const initializeScene = async () => {
    setLoading(true);
    setError(null);
    setLoadingMessage('Initializing...');

    try {
      // Initialize StateManager
      StateManager.pullParams();
      StateManager.pushParams();

      // Simulate progressive loading for better UX
      for (let i = 0; i < loadingMessages.length; i++) {
        setLoadingMessage(loadingMessages[i]);
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
      }

      setLoadingMessage('Creating your medieval settlement...');
      
      const newModel = new Model(StateManager.size, StateManager.seed);
      setModel(newModel);
      
    } catch (error) {
      console.error('Error creating initial model:', error);
      setError('Failed to generate the initial town. This might be due to an invalid configuration.');
      
      // Try fallback generation
      try {
        setLoadingMessage('Attempting fallback generation...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const fallbackModel = new Model(8, Date.now() % 100000);
        setModel(fallbackModel);
        setError(null);
      } catch (fallbackError) {
        console.error('Fallback generation also failed:', fallbackError);
        setError('Unable to generate any town. Please refresh the page and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (size: string) => {
    setLoading(true);
    setError(null);

    try {
      let nPatches: number;
      
      // Handle different generation modes
      if (size.startsWith('custom-')) {
        // Custom generation mode
        nPatches = parseInt(size.replace('custom-', ''));
        console.log('Custom generation with', nPatches, 'patches');
      } else {
        // Standard size modes
        switch (size) {
          case 'village':
            nPatches = 6 + Math.floor(Math.random() * 3); // 6-8 patches
            break;
          case 'town':
            nPatches = 10 + Math.floor(Math.random() * 6); // 10-15 patches
            break;
          case 'city':
            nPatches = 18 + Math.floor(Math.random() * 8); // 18-25 patches
            break;
          case 'capital':
            nPatches = 28 + Math.floor(Math.random() * 12); // 28-39 patches
            break;
          default:
            nPatches = 15;
        }
      }

      const seed = Math.floor(Math.random() * 1000000);
      const newModel = new Model(nPatches, seed);
      
      setModel(newModel);
      console.log(`Generated ${size} with ${nPatches} patches, seed: ${seed}`);
    } catch (error) {
      console.error('Error creating model:', error);
      setError('Failed to generate town. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRandomGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const randomSize = 8 + Math.floor(Math.random() * 25); // 8-32 patches
      const seed = Math.floor(Math.random() * 1000000);
      const newModel = new Model(randomSize, seed);
      
      setModel(newModel);
      console.log(`Generated random town with ${randomSize} patches, seed: ${seed}`);
    } catch (error) {
      console.error('Error creating random model:', error);
      setError('Failed to generate random town. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyles}>
      <div style={mainContentStyles}>
        <Header />
        
        <div style={mapContainerStyles} className="map-container">
          {loading ? (
            <LoadingSpinner 
              message={loadingMessage}
              submessage="Please wait while we craft your medieval world..."
            />
          ) : error ? (
            <div style={errorContainerStyles} className="fade-in">
              <div style={errorTitleStyles}>⚠️ Generation Error</div>
              <div style={errorMessageStyles}>{error}</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Try generating a different size settlement or refresh the page.
              </p>
            </div>
          ) : model ? (
            <div style={mapWrapperStyles} className="fade-in map-wrapper">
              <div style={mapOverlayStyles}></div>
              <CityMap model={model} />
            </div>
          ) : null}
        </div>

        <ControlPanel 
          onGenerate={handleGenerate}
          onRandomGenerate={handleRandomGenerate}
          isLoading={loading}
        />
        
        {/* Tooltip is now handled by CityMap component */}
      </div>
    </div>
  );
};
