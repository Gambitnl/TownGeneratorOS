import React, { useState, useEffect } from 'react';
import { CityMap } from '../services/CityMap';
import { Model } from '../services/Model';
import { StateManager } from '../services/StateManager';
import { generateVillageLayout, VillageLayout } from '../services/villageGenerationService';
import { VillagePane } from './VillagePane';
import EnhancedVillagePane from './EnhancedVillagePane';
import { StandaloneBuildingGenerator, BuildingOptions } from '../services/StandaloneBuildingGenerator';
import { BuildingPane } from './BuildingPane';
import { TestSimpleBuilding } from './TestSimpleBuilding';
import { Header } from './Header';
import { TopBarMenu } from './TopBarMenu';
import { LoadingSpinner } from './LoadingSpinner';
import { Tooltip } from './Tooltip';
import { Button } from './Button';

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

const topBarStyles: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 1000,
  background: 'rgba(0, 0, 0, 0.95)',
  backdropFilter: 'blur(15px)',
};



const mapContainerStyles: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2rem',
  minHeight: '600px',
};

const mapWrapperStyles: React.CSSProperties = {
  background: 'var(--card-bg)',
  borderRadius: 'var(--radius-lg)',
  border: '3px solid var(--border-color)',
  boxShadow: 'var(--shadow-strong)',
  padding: '1rem',
  width: 'calc(100vw - 4rem)',
  maxWidth: '1400px',
  height: 'calc(100vh - 200px)',
  overflow: 'hidden',
  backdropFilter: 'blur(10px)',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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

const zoomControlsStyles: React.CSSProperties = {
  position: 'fixed',
  bottom: '2rem',
  right: '2rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  zIndex: 100,
  background: 'rgba(0, 0, 0, 0.1)',
  borderRadius: 'var(--radius-lg)',
  backdropFilter: 'blur(10px)',
  border: '1px solid var(--border-color)',
  padding: '0.5rem'
};

export const TownScene: React.FC = () => {
  const [model, setModel] = useState<Model | null>(null);
  const [villageLayout, setVillageLayout] = useState<VillageLayout | null>(null);
  const [buildingPlan, setBuildingPlan] = useState<any | null>(null);
  const [generationType, setGenerationType] = useState<'city' | 'village' | 'building' | 'simple_building' | null>(null);
  const [tooltipText, setTooltipText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [proceduralBuildings, setProceduralBuildings] = useState(true);
  const [useEnhancedAssets, setUseEnhancedAssets] = useState(true);

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
  };

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
    setModel(null);
    setVillageLayout(null);
    setBuildingPlan(null);

    try {
      const seed = Math.floor(Math.random() * 1000000).toString();

      // Use village generator for small settlements
      if (size === 'village' || size === 'hamlet' || size.startsWith('village-')) {
        setLoadingMessage('Crafting your medieval village...');
        setGenerationType('village');
        
        let villageSize: 'tiny' | 'small' | 'medium' = 'small';
        let villageType: 'farming' | 'fishing' | 'fortified' | 'forest' | 'crossroads' = 'farming';
        
        // Determine village size
        if (size === 'hamlet') {
          villageSize = 'tiny';
        } else if (size === 'village') {
          villageSize = 'small';
        }
        
        // Determine village type based on suffix
        if (size === 'village-coastal') {
          villageType = 'fishing';
        } else if (size === 'village-forest') {
          villageType = 'forest';
        } else {
          villageType = 'farming';
        }
        
        const layout = await generateVillageLayout(seed, {
          type: villageType,
          size: villageSize,
          includeWalls: false,
          includeFarmland: villageType === 'farming',
          proceduralBuildings
        });
        
        setVillageLayout(layout);
        console.log(`Generated ${size} (${villageType} ${villageSize}) with ${layout.buildings.length} buildings, seed: ${seed}`);
      }
      // Use building generator for individual buildings
      else if (size.startsWith('building-')) {
        setLoadingMessage('Crafting your medieval building...');
        setGenerationType('building');
        
        const buildingType = size.replace('building-', '').split('-')[0] as any;
        const socialClass = size.includes('-poor') ? 'poor' :
                           size.includes('-wealthy') ? 'wealthy' :
                           size.includes('-noble') ? 'noble' : 'common';
        
        const options: BuildingOptions = {
          buildingType: buildingType || 'house_small',
          socialClass,
          seed: parseInt(seed)
        };
        
        const plan = StandaloneBuildingGenerator.generateBuilding(options);
        setBuildingPlan(plan);
        console.log(`Generated ${buildingType} building for ${socialClass} class, seed: ${seed}`);
      } 
      // Use city generator for larger settlements  
      else {
        setLoadingMessage('Building your medieval city...');
        setGenerationType('city');
        
        let nPatches: number;
        
        if (size.startsWith('custom-')) {
          nPatches = parseInt(size.replace('custom-', ''));
        } else {
          switch (size) {
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

        const newModel = new Model(nPatches, parseInt(seed));
        setModel(newModel);
        console.log(`Generated ${size} city with ${nPatches} patches, seed: ${seed}`);
      }
    } catch (error) {
      console.error('Error creating settlement:', error);
      setError('Failed to generate settlement. Please try again.');
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
        <div style={topBarStyles}>
          <Header />
          <TopBarMenu 
            onGenerate={handleGenerate}
            onRandomGenerate={handleRandomGenerate}
            isLoading={loading}
            proceduralBuildings={proceduralBuildings}
            onProceduralBuildingsChange={setProceduralBuildings}
            useEnhancedAssets={useEnhancedAssets}
            onEnhancedAssetsChange={setUseEnhancedAssets}
          />
        </div>
        
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
          ) : generationType === 'village' && villageLayout ? (
            <div 
              style={mapWrapperStyles}
              className="fade-in map-wrapper"
            >
              <div style={mapOverlayStyles}></div>
              <div 
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isPanning ? 'grabbing' : 'grab'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
              >
                {proceduralBuildings ? (
                  <EnhancedVillagePane 
                    village={villageLayout} 
                    scale={zoom} 
                    showGrid={true}
                    showRoomLabels={true}
                    showFurniture={true}
                  />
                ) : (
                  <VillagePane layout={villageLayout} />
                )}
              </div>
            </div>
          ) : generationType === 'building' && buildingPlan ? (
            <div 
              style={mapWrapperStyles}
              className="fade-in map-wrapper"
            >
              <div style={mapOverlayStyles}></div>
              <div 
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isPanning ? 'grabbing' : 'grab'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
              >
                <BuildingPane 
                  building={buildingPlan} 
                  scale={zoom}
                  showGrid={true}
                  showRoomLabels={true}
                  showFurniture={true}
                  useEnhancedRenderer={useEnhancedAssets}
                />
              </div>
            </div>
          ) : generationType === 'simple_building' ? (
            <div 
              style={mapWrapperStyles}
              className="fade-in map-wrapper"
            >
              <div style={mapOverlayStyles}></div>
              <TestSimpleBuilding />
            </div>
          ) : generationType === 'city' && model ? (
            <div 
              style={mapWrapperStyles}
              className="fade-in map-wrapper"
            >
              <div style={mapOverlayStyles}></div>
              <div 
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isPanning ? 'grabbing' : 'grab'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
              >
                <CityMap model={model} />
              </div>
            </div>
          ) : null}
        </div>

      </div>
      
      <div style={zoomControlsStyles}>
        <Button onClick={handleZoomIn} variant="secondary" title="Zoom In">🔍+</Button>
        <Button onClick={handleZoomOut} variant="secondary" title="Zoom Out">🔍-</Button>
      </div>
    </div>
  );
};
