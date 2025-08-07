import React, { FC, useState, useEffect } from 'react';
import { VillageLayout } from '../services/villageGenerationService';
import { BuildingDetails, BuildingLibrary } from '../services/BuildingLibrary';
import { BuildingDetailsModal } from './BuildingDetailsModal';
import { Point } from '../types/point';
import { AssetManager, AssetInfo } from '../services/AssetManager';

interface Props {
  layout: VillageLayout;
  onEnterBuilding?: (id: string, type: string) => void;
}

export const VillagePane: FC<Props> = ({ layout, onEnterBuilding }) => {
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingDetails | null>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  useEffect(() => {
    AssetManager.loadAssets().then(() => {
      setAssetsLoaded(true);
    });
  }, []);
  const fillForType: Record<string, string> = {
    // Basic Buildings
    house: '#8fbc8f',
    inn: '#daa520', 
    blacksmith: '#696969',
    farm: '#deb887',
    mill: '#d2691e',
    woodworker: '#cd853f',
    fisher: '#4682b4',
    market: '#ff69b4',
    chapel: '#dcdcdc',
    stable: '#bc8f8f',
    well: '#708090',
    granary: '#f4a460',
    farmland: '#deb887',
    
    // Magical Practitioners - Purple/Violet spectrum
    alchemist: '#9370db',
    herbalist: '#228b22',
    magic_shop: '#8a2be2',
    enchanter: '#4169e1',
    fortune_teller: '#da70d6',
    wizard_tower: '#663399',
    sorcerer_den: '#8b00ff',
    warlock_sanctum: '#4b0082',
    druid_grove: '#228b22',
    shaman_hut: '#8fbc8f',
    necromancer_lair: '#2f4f2f',
    artificer_workshop: '#4682b4',
    sage_library: '#6495ed',
    oracle_shrine: '#dda0dd',
    witch_cottage: '#556b2f',
    crystal_gazer: '#e6e6fa',
    rune_carver: '#708090',
    spell_components_shop: '#9370db',
    
    // Religious & Divine - Gold/Yellow spectrum
    temple: '#f0e68c',
    monastery: '#daa520',
    shrine: '#ffd700',
    cathedral: '#ffb347',
    abbey: '#f4a460',
    pilgrimage_stop: '#deb887',
    holy_spring: '#87ceeb',
    cleric_sanctuary: '#f0e68c',
    paladin_hall: '#ffd700',
    divine_oracle: '#ffe4b5',
    sacred_grove: '#9acd32',
    ancestor_shrine: '#d2b48c',
    prayer_circle: '#f5deb3',
    
    // Combat & Military - Red/Orange spectrum
    monster_hunter: '#dc143c',
    mercenary_hall: '#b22222',
    weapon_master: '#8b0000',
    armor_smith: '#a0522d',
    ranger_station: '#228b22',
    guard_house: '#696969',
    training_grounds: '#cd853f',
    veterans_hall: '#bc8f8f',
    battle_academy: '#d2691e',
    siege_engineer: '#808080',
    castle_ruins: '#778899',
    watchtower: '#a9a9a9',
    
    // Exotic Traders - Teal/Turquoise spectrum
    exotic_trader: '#20b2aa',
    gem_cutter: '#48d1cc',
    rare_books: '#5f9ea0',
    cartographer: '#4682b4',
    beast_tamer: '#2e8b57',
    exotic_animals: '#3cb371',
    curiosity_shop: '#66cdaa',
    antique_dealer: '#8fbc8f',
    relic_hunter: '#6b8e23',
    treasure_appraiser: '#daa520',
    map_maker: '#4682b4',
    compass_maker: '#708090',
    astrolabe_crafter: '#483d8b',
    
    // Artisans & Crafters - Brown/Earth spectrum
    master_jeweler: '#daa520',
    instrument_maker: '#cd853f',
    clockwork_tinker: '#a0522d',
    glass_blower: '#87ceeb',
    scroll_scribe: '#f5deb3',
    ink_maker: '#2f4f4f',
    parchment_maker: '#f4a460',
    bookbinder: '#8b4513',
    portrait_artist: '#dda0dd',
    sculptor: '#696969',
    tapestry_weaver: '#bc8f8f',
    dye_maker: '#9370db',
    
    // Entertainment & Culture - Pink/Magenta spectrum
    bards_college: '#ff1493',
    theater_troupe: '#ff69b4',
    storyteller_circle: '#db7093',
    minstrel_hall: '#c71585',
    dance_instructor: '#ff6347',
    puppet_theater: '#ffa500',
    gaming_house: '#ff4500',
    riddle_master: '#8a2be2',
    gladiator_arena: '#dc143c',
    fighting_pit: '#8b0000',
    race_track: '#daa520',
    festival_grounds: '#ff69b4',
    
    // Mystical Services - Indigo/Deep Purple spectrum
    dream_interpreter: '#6a5acd',
    curse_breaker: '#9370db',
    ghost_whisperer: '#e6e6fa',
    spirit_medium: '#dda0dd',
    exorcist: '#f0e68c',
    blessing_giver: '#ffe4b5',
    ward_crafter: '#708090',
    protective_charms: '#87ceeb',
    luck_changer: '#32cd32',
    fate_reader: '#4169e1',
    time_keeper: '#483d8b',
    memory_keeper: '#6495ed',
    
    // Guilds & Organizations - Dark colors
    thieves_guild: '#2f4f2f',
    assassins_guild: '#1c1c1c',
    merchants_guild: '#daa520',
    crafters_guild: '#cd853f',
    mages_guild: '#4b0082',
    adventurers_guild: '#b22222',
    scholars_society: '#483d8b',
    secret_society: '#696969',
    underground_network: '#2f2f2f',
    information_broker: '#708090',
    spy_network: '#556b2f',
    code_breaker: '#6a5acd',
    
    // Unique Establishments - Bright/Exotic colors
    dragons_roost: '#ff4500',
    griffon_stable: '#daa520',
    pegasus_aerie: '#87ceeb',
    unicorn_sanctuary: '#ffffff',
    phoenix_nest: '#ff6347',
    magical_menagerie: '#9370db',
    planar_gateway: '#8a2be2',
    time_rift: '#483d8b',
    dimensional_shop: '#6a5acd',
    void_touched: '#1c1c1c',
    fey_crossing: '#32cd32',
    shadowfell_portal: '#2f4f2f',
    
    // Alchemical & Magical Industries - Chemical colors
    potion_brewery: '#9370db',
    magical_forge: '#ff4500',
    elemental_workshop: '#4169e1',
    crystal_mine: '#e6e6fa',
    mana_well: '#00bfff',
    ley_line_nexus: '#8a2be2',
    arcane_laboratory: '#6a5acd',
    transmutation_circle: '#dda0dd',
    summoning_chamber: '#4b0082',
    scrying_pool: '#5f9ea0',
    divination_center: '#9370db',
    illusion_parlor: '#da70d6'
  };

  const handleBuildingMouseEnter = (event: React.MouseEvent, buildingId: string, buildingType: string) => {
    if (!isPanning) {
      const tooltipText = BuildingLibrary.generateTooltip(buildingType);
      
      setTooltip({
        text: tooltipText,
        x: event.clientX,
        y: event.clientY - 10
      });
    }
  };

  const handleBuildingMouseLeave = () => {
    setTooltip(null);
  };

  const handleBuildingClick = (buildingId: string, buildingType: string) => {
    if (!isPanning) {
      const buildingDetails = BuildingLibrary.generateBuilding(buildingType);
      setSelectedBuilding(buildingDetails);
      onEnterBuilding?.(buildingId, buildingType);
    }
  };

  const handleCloseModal = () => {
    setSelectedBuilding(null);
  };

  // Zoom is now handled by TownScene component, no need for local wheel handler

  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.button === 0) { // Left mouse button
      setIsPanning(true);
      setLastMousePos({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = event.clientX - lastMousePos.x;
      const deltaY = event.clientY - lastMousePos.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX / zoom,
        y: prev.y + deltaY / zoom
      }));
      
      setLastMousePos({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
    setTooltip(null);
  };

  const resetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const renderBuildingDetails = (building: any) => {
    const vertices = building.polygon.vertices;
    if (vertices.length < 4) return null;

    // Calculate building center and dimensions
    const center = {
      x: vertices.reduce((sum: number, v: Point) => sum + v.x, 0) / vertices.length,
      y: vertices.reduce((sum: number, v: Point) => sum + v.y, 0) / vertices.length
    };

    // Calculate building orientation (angle of longest side)
    let maxDistance = 0;
    let buildingAngle = 0;
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];
      const distance = Math.sqrt((v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2);
      if (distance > maxDistance) {
        maxDistance = distance;
        buildingAngle = Math.atan2(v2.y - v1.y, v2.x - v1.x);
      }
    }

    // Calculate building width and height
    const width = maxDistance;
    const height = Math.min(...vertices.map((v: Point, i: number) => {
      const v2 = vertices[(i + 1) % vertices.length];
      return Math.sqrt((v2.x - v.x) ** 2 + (v2.y - v.y) ** 2);
    }));

    const details = [];

    // Render roof
    if (building.type !== 'well') {
      details.push(renderRoof(building, center, width, height, buildingAngle));
    }

    // Render door
    details.push(renderDoor(building, center, width, height, buildingAngle));

    // Render windows
    details.push(...renderWindows(building, center, width, height, buildingAngle));

    // Render chimney (for certain building types)
    if (['house', 'inn', 'blacksmith', 'woodworker'].includes(building.type)) {
      details.push(renderChimney(building, center, width, height, buildingAngle));
    }

    // Render building-specific details
    details.push(...renderBuildingSpecificDetails(building, center, width, height, buildingAngle));

    return <g className="building-details">{details}</g>;
  };

  // Render vegetation asset or fallback SVG
  const renderVegetationAsset = (asset: AssetInfo | null, x: number, y: number, scale: number = 1, fallbackElement: JSX.Element) => {
    if (!assetsLoaded || !asset) {
      console.log(`Using fallback for asset: ${asset?.name || 'unknown'} (assetsLoaded: ${assetsLoaded})`);
      return fallbackElement;
    }

    // For PNG assets, we need to scale them appropriately for the village map
    // Forgotten Adventures assets are typically designed for battle maps (5ft per square)
    // We'll scale them down for village overview
    const assetScale = scale * 0.3; // Scale down for village view
    const width = asset.size === 'large' ? 60 : asset.size === 'medium' ? 40 : 20;
    const height = width; // Keep square aspect ratio
    
    console.log(`Rendering asset: ${asset.name} at ${x},${y} with path: ${asset.path}`);

    return (
      <image
        key={`${asset.name}-${x}-${y}`}
        x={x - (width * assetScale) / 2}
        y={y - (height * assetScale) / 2}
        width={width * assetScale}
        height={height * assetScale}
        href={asset.path}
        opacity="0.9"
        onLoad={() => {
          console.log(`Successfully loaded asset: ${asset.name}`);
        }}
        onError={(e) => {
          console.log(`Failed to load asset: ${asset.path}`, e);
        }}
      />
    );
  };

  const renderRoof = (building: any, center: any, width: number, height: number, angle: number) => {
    // Create roof offset points
    const roofOffsetX = Math.cos(angle) * 2;
    const roofOffsetY = Math.sin(angle) * 2;
    const roofWidthX = Math.cos(angle + Math.PI/2) * (height/2 + 1);
    const roofWidthY = Math.sin(angle + Math.PI/2) * (height/2 + 1);

    const roofPoints = [
      { x: center.x - Math.cos(angle) * width/2 + roofWidthX, y: center.y - Math.sin(angle) * width/2 + roofWidthY },
      { x: center.x + Math.cos(angle) * width/2 + roofWidthX, y: center.y + Math.sin(angle) * width/2 + roofWidthY },
      { x: center.x + Math.cos(angle) * width/2 - roofWidthX, y: center.y + Math.sin(angle) * width/2 - roofWidthY },
      { x: center.x - Math.cos(angle) * width/2 - roofWidthX, y: center.y - Math.sin(angle) * width/2 - roofWidthY }
    ];

    return (
      <polygon
        key={`roof-${building.id}`}
        points={roofPoints.map(p => `${p.x},${p.y}`).join(' ')}
        fill="#8B4513"
        stroke="#654321"
        strokeWidth="0.5"
        opacity="0.8"
        style={{ pointerEvents: 'none' }}
      />
    );
  };

  const renderDoor = (building: any, center: any, width: number, height: number, angle: number) => {
    const doorWidth = Math.min(width * 0.15, 3);
    const doorHeight = Math.min(height * 0.4, 4);
    
    // Position door on the front face (closest to entry point)
    const frontX = building.entryPoint.x;
    const frontY = building.entryPoint.y;
    
    return (
      <rect
        key={`door-${building.id}`}
        x={frontX - doorWidth/2}
        y={frontY - doorHeight/2}
        width={doorWidth}
        height={doorHeight}
        fill="#654321"
        stroke="#4a2c17"
        strokeWidth="0.3"
        rx="0.5"
        style={{ pointerEvents: 'none' }}
      />
    );
  };

  const renderWindows = (building: any, center: any, width: number, height: number, angle: number) => {
    const windows = [];
    const windowSize = Math.min(width * 0.08, height * 0.08, 2);
    
    // Number of windows based on building size and type
    let windowCount = 2;
    if (building.type === 'inn') windowCount = 4;
    if (building.type === 'house') windowCount = 2;
    if (building.type === 'blacksmith') windowCount = 1;
    if (width < 8) windowCount = 1;

    for (let i = 0; i < windowCount; i++) {
      const offsetX = (i - windowCount/2 + 0.5) * (width / (windowCount + 1));
      const windowX = center.x + Math.cos(angle) * offsetX + Math.cos(angle + Math.PI/2) * height * 0.2;
      const windowY = center.y + Math.sin(angle) * offsetX + Math.sin(angle + Math.PI/2) * height * 0.2;
      
      windows.push(
        <rect
          key={`window-${building.id}-${i}`}
          x={windowX - windowSize/2}
          y={windowY - windowSize/2}
          width={windowSize}
          height={windowSize}
          fill="#87CEEB"
          stroke="#4a4a4a"
          strokeWidth="0.2"
          style={{ pointerEvents: 'none' }}
        />
      );
    }

    return windows;
  };

  const renderChimney = (building: any, center: any, width: number, height: number, angle: number) => {
    const chimneyWidth = 1.5;
    const chimneyHeight = 3;
    
    // Position chimney on one side of the building
    const chimneyX = center.x + Math.cos(angle) * width * 0.3 + Math.cos(angle + Math.PI/2) * height * 0.3;
    const chimneyY = center.y + Math.sin(angle) * width * 0.3 + Math.sin(angle + Math.PI/2) * height * 0.3;
    
    return (
      <g key={`chimney-${building.id}`}>
        <rect
          x={chimneyX - chimneyWidth/2}
          y={chimneyY - chimneyHeight}
          width={chimneyWidth}
          height={chimneyHeight}
          fill="#8B4513"
          stroke="#654321"
          strokeWidth="0.2"
          style={{ pointerEvents: 'none' }}
        />
        {/* Smoke */}
        <circle
          cx={chimneyX}
          cy={chimneyY - chimneyHeight - 1}
          r="0.8"
          fill="#D3D3D3"
          opacity="0.6"
          style={{ pointerEvents: 'none' }}
        />
      </g>
    );
  };

  const renderBuildingSpecificDetails = (building: any, center: any, width: number, height: number, angle: number) => {
    const details = [];

    switch (building.type) {
      case 'blacksmith':
        // Forge fire glow
        details.push(
          <circle
            key={`forge-${building.id}`}
            cx={center.x}
            cy={center.y}
            r="2"
            fill="#FF6B35"
            opacity="0.6"
            style={{ pointerEvents: 'none' }}
          />
        );
        break;
        
      case 'mill':
        // Windmill blades
        const bladeLength = Math.max(width, height) * 0.6;
        details.push(
          <g key={`mill-blades-${building.id}`}>
            <line
              x1={center.x - bladeLength/2}
              y1={center.y}
              x2={center.x + bladeLength/2}
              y2={center.y}
              stroke="#8B4513"
              strokeWidth="1"
              style={{ pointerEvents: 'none' }}
            />
            <line
              x1={center.x}
              y1={center.y - bladeLength/2}
              x2={center.x}
              y2={center.y + bladeLength/2}
              stroke="#8B4513"
              strokeWidth="1"
              style={{ pointerEvents: 'none' }}
            />
          </g>
        );
        break;
        
      case 'well':
        // Well bucket and rope
        details.push(
          <g key={`well-details-${building.id}`}>
            <circle
              cx={center.x}
              cy={center.y}
              r="1.5"
              fill="#4a4a4a"
              style={{ pointerEvents: 'none' }}
            />
            <line
              x1={center.x}
              y1={center.y - 1.5}
              x2={center.x}
              y2={center.y - 4}
              stroke="#8B4513"
              strokeWidth="0.3"
              style={{ pointerEvents: 'none' }}
            />
          </g>
        );
        break;
        
      case 'chapel':
      case 'temple':
        // Cross or religious symbol
        details.push(
          <g key={`cross-${building.id}`}>
            <line
              x1={center.x}
              y1={center.y - height/2 - 2}
              x2={center.x}
              y2={center.y - height/2 - 6}
              stroke="#DAA520"
              strokeWidth="0.5"
              style={{ pointerEvents: 'none' }}
            />
            <line
              x1={center.x - 1}
              y1={center.y - height/2 - 5}
              x2={center.x + 1}
              y2={center.y - height/2 - 5}
              stroke="#DAA520"
              strokeWidth="0.5"
              style={{ pointerEvents: 'none' }}
            />
          </g>
        );
        break;
    }

    return details;
  };

  const renderBuildingLot = (building: any) => {
    // Don't add lots to wells or very small buildings
    if (building.type === 'well' || building.type === 'market') return null;

    const vertices = building.polygon.vertices;
    if (vertices.length < 4) return null;

    // Calculate building center and size
    const center = {
      x: vertices.reduce((sum: number, v: Point) => sum + v.x, 0) / vertices.length,
      y: vertices.reduce((sum: number, v: Point) => sum + v.y, 0) / vertices.length
    };

    // Calculate building dimensions for lot sizing
    const width = Math.max(...vertices.map((v: Point) => v.x)) - Math.min(...vertices.map((v: Point) => v.x));
    const height = Math.max(...vertices.map((v: Point) => v.y)) - Math.min(...vertices.map((v: Point) => v.y));

    const lotElements = [];

    // Create lot boundary (fence)
    if (['house', 'farm', 'inn'].includes(building.type)) {
      const lotPadding = building.type === 'farm' ? 12 : 8;
      const lotBoundary = createLotBoundary(vertices, lotPadding);
      
      lotElements.push(
        <polygon
          key={`lot-${building.id}`}
          points={lotBoundary.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#8B7355"
          strokeWidth="0.5"
          strokeDasharray="2,1"
          opacity="0.6"
          style={{ pointerEvents: 'none' }}
        />
      );

      // Add garden elements for houses and inns
      if (['house', 'inn'].includes(building.type)) {
        const gardenElements = createGardenElements(building, center, width, height);
        lotElements.push(...gardenElements);
      }

      // Add farm field elements
      if (building.type === 'farm') {
        const farmElements = createFarmElements(building, center, width, height, lotBoundary);
        lotElements.push(...farmElements);
      }
    }

    return <g className="building-lot">{lotElements}</g>;
  };

  const createLotBoundary = (buildingVertices: Point[], padding: number): Point[] => {
    // Create expanded boundary around building
    const minX = Math.min(...buildingVertices.map(v => v.x)) - padding;
    const maxX = Math.max(...buildingVertices.map(v => v.x)) + padding;
    const minY = Math.min(...buildingVertices.map(v => v.y)) - padding;
    const maxY = Math.max(...buildingVertices.map(v => v.y)) + padding;

    return [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY }
    ];
  };

  const createGardenElements = (building: any, center: any, width: number, height: number) => {
    const elements = [];
    const gardenSize = Math.min(width, height) * 0.3;
    
    // Use building ID as seed for consistent positioning
    const seed = building.id.split('_').reduce((acc: number, part: string) => acc + part.charCodeAt(0), 0);
    const seededRandom = (index: number) => {
      const x = Math.sin(seed + index) * 10000;
      return x - Math.floor(x);
    };
    
    // Small garden patches - deterministic count
    const numPatches = seededRandom(0) > 0.5 ? 2 : 3;
    
    for (let i = 0; i < numPatches; i++) {
      const angle = (i / numPatches) * Math.PI * 2 + seededRandom(i + 1) * Math.PI / 2;
      const distance = (width + height) * 0.3 + seededRandom(i + 2) * 5;
      
      const gardenX = center.x + Math.cos(angle) * distance;
      const gardenY = center.y + Math.sin(angle) * distance;
      
      // Vegetable patch
      elements.push(
        <rect
          key={`garden-${building.id}-${i}`}
          x={gardenX - gardenSize/2}
          y={gardenY - gardenSize/2}
          width={gardenSize}
          height={gardenSize}
          fill="#7d8f47"
          stroke="#6b7a3e"
          strokeWidth="0.3"
          opacity="0.7"
          style={{ pointerEvents: 'none' }}
        />
      );

      // Small plants/vegetables in the patch - deterministic
      const numPlants = 2 + Math.floor(seededRandom(i + 3) * 3);
      for (let j = 0; j < numPlants; j++) {
        const plantX = gardenX + (seededRandom(i * 10 + j) - 0.5) * gardenSize * 0.6;
        const plantY = gardenY + (seededRandom(i * 10 + j + 5) - 0.5) * gardenSize * 0.6;
        
        elements.push(
          <circle
            key={`plant-${building.id}-${i}-${j}`}
            cx={plantX}
            cy={plantY}
            r={0.5 + seededRandom(i * 10 + j + 10) * 0.5}
            fill="#4a5d23"
            opacity="0.8"
            style={{ pointerEvents: 'none' }}
          />
        );
      }
    }

    return elements;
  };

  const createFarmElements = (building: any, center: any, width: number, height: number, lotBoundary: Point[]) => {
    const elements = [];
    
    // Create field furrows
    const lotWidth = Math.max(...lotBoundary.map(p => p.x)) - Math.min(...lotBoundary.map(p => p.x));
    const lotHeight = Math.max(...lotBoundary.map(p => p.y)) - Math.min(...lotBoundary.map(p => p.y));
    const lotMinX = Math.min(...lotBoundary.map(p => p.x));
    const lotMinY = Math.min(...lotBoundary.map(p => p.y));
    
    // Horizontal furrows
    const numFurrows = Math.floor(lotHeight / 4);
    for (let i = 0; i < numFurrows; i++) {
      const furrowY = lotMinY + (i + 1) * (lotHeight / (numFurrows + 1));
      
      elements.push(
        <line
          key={`furrow-${building.id}-${i}`}
          x1={lotMinX + 2}
          y1={furrowY}
          x2={lotMinX + lotWidth - 2}
          y2={furrowY}
          stroke="#deb887"
          strokeWidth="0.5"
          opacity="0.6"
          style={{ pointerEvents: 'none' }}
        />
      );
    }

    // Add some crop indicators - deterministic
    const seed = building.id.split('_').reduce((acc: number, part: string) => acc + part.charCodeAt(0), 0);
    const seededRandom = (index: number) => {
      const x = Math.sin(seed + index) * 10000;
      return x - Math.floor(x);
    };
    
    const numCrops = 3 + Math.floor(seededRandom(100) * 4);
    for (let i = 0; i < numCrops; i++) {
      const cropX = lotMinX + 3 + seededRandom(i + 101) * (lotWidth - 6);
      const cropY = lotMinY + 3 + seededRandom(i + 201) * (lotHeight - 6);
      
      elements.push(
        <circle
          key={`crop-${building.id}-${i}`}
          cx={cropX}
          cy={cropY}
          r={1 + seededRandom(i + 301)}
          fill="#90a955"
          opacity="0.5"
          style={{ pointerEvents: 'none' }}
        />
      );
    }

    return elements;
  };

  const getRoadPoints = (road: any): string => {
    // Handle both old format (Street with vertices) and new format (Point[])
    if (Array.isArray(road.pathPoints)) {
      return road.pathPoints.map((p: Point) => `${p.x},${p.y}`).join(' ');
    } else if (road.pathPoints.vertices) {
      return road.pathPoints.vertices.map((p: Point) => `${p.x},${p.y}`).join(' ');
    }
    return '';
  };

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%',
      minWidth: '1000px',
      minHeight: '700px',
      overflow: 'hidden'
    }}>
      {/* Zoom Controls */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '8px',
        borderRadius: '8px'
      }}>
        <button 
          onClick={() => setZoom(prev => Math.min(5, prev * 1.2))}
          style={{
            background: '#4CAF50',
            border: 'none',
            color: 'white',
            width: '30px',
            height: '30px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          +
        </button>
        <button 
          onClick={() => setZoom(prev => Math.max(0.1, prev / 1.2))}
          style={{
            background: '#f44336',
            border: 'none',
            color: 'white',
            width: '30px',
            height: '30px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          -
        </button>
        <button 
          onClick={resetView}
          style={{
            background: '#2196F3',
            border: 'none',
            color: 'white',
            width: '30px',
            height: '30px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          ⌂
        </button>
      </div>

      {/* Zoom Level Indicator */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        zIndex: 200,
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        Zoom: {Math.round(zoom * 100)}%
      </div>

      <div 
        style={{ 
          width: '100%',
          height: '100%',
          cursor: isPanning ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <svg 
          width="100%" 
          height="100%" 
          viewBox="-300 -225 600 450" 
          style={{ 
            border: '3px solid #8B4513',
            borderRadius: '12px',
            width: '100%',
            height: '100%',
            minWidth: '1000px',
            minHeight: '700px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}
        >
          {/* Apply transform to a group containing all map content */}
          <g transform={`translate(${panOffset.x * 0.5}, ${panOffset.y * 0.5}) scale(${zoom})`}>
          {/* Background defs for patterns and gradients */}
          <defs>
            <pattern id="grassPattern" patternUnits="userSpaceOnUse" width="20" height="20">
              <rect width="20" height="20" fill="#7d8f47"/>
              <circle cx="5" cy="5" r="1" fill="#6b7a3e"/>
              <circle cx="15" cy="10" r="1.5" fill="#8a9b52"/>
              <circle cx="10" cy="15" r="1" fill="#6b7a3e"/>
            </pattern>
            
            <pattern id="fieldPattern" patternUnits="userSpaceOnUse" width="30" height="30">
              <rect width="30" height="30" fill="#deb887"/>
              <rect x="0" y="10" width="30" height="2" fill="#d2b48c"/>
              <rect x="0" y="20" width="30" height="2" fill="#d2b48c"/>
            </pattern>
            
            <radialGradient id="meadowGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style={{ stopColor: '#90a955', stopOpacity: 1 }}/>
              <stop offset="100%" style={{ stopColor: '#7d8f47', stopOpacity: 1 }}/>
            </radialGradient>
          </defs>
          
          {/* Base background */}
          <rect x="-300" y="-225" width="600" height="450" fill="url(#meadowGradient)"/>
          
          {/* Field patches */}
          <rect x="-280" y="-200" width="120" height="80" fill="url(#fieldPattern)" opacity="0.7"/>
          <rect x="150" y="-180" width="100" height="60" fill="url(#fieldPattern)" opacity="0.6"/>
          <rect x="-200" y="100" width="140" height="90" fill="url(#fieldPattern)" opacity="0.8"/>
          
          {/* Grass texture overlay */}
          <rect x="-300" y="-225" width="600" height="450" fill="url(#grassPattern)" opacity="0.3"/>
          
          {/* Scattered vegetation - trees and bushes */}
          <g className="vegetation">
            {/* Large Trees */}
            {renderVegetationAsset(
              AssetManager.getAsset('fey_tree_large'), 
              -250, -180, 1.2,
              <g transform="translate(-250, -180)">
                <circle cx="0" cy="5" r="8" fill="#2d5016"/>
                <rect x="-2" y="5" width="4" height="15" fill="#8B4513"/>
                <circle cx="-3" cy="3" r="3" fill="#1a3008" opacity="0.6"/>
              </g>
            )}
            {renderVegetationAsset(
              AssetManager.getAsset('fir_tree_large'), 
              220, -150, 1.4,
              <g transform="translate(220, -150)">
                <circle cx="0" cy="5" r="12" fill="#2d5016"/>
                <rect x="-2" y="5" width="4" height="20" fill="#8B4513"/>
                <circle cx="4" cy="2" r="4" fill="#1a3008" opacity="0.6"/>
              </g>
            )}
            {renderVegetationAsset(
              AssetManager.getAsset('fey_tree_large'), 
              -180, 180, 1.1,
              <g transform="translate(-180, 180)">
                <circle cx="0" cy="5" r="10" fill="#2d5016"/>
                <rect x="-2" y="5" width="4" height="18" fill="#8B4513"/>
                <circle cx="-2" cy="4" r="3" fill="#1a3008" opacity="0.6"/>
              </g>
            )}
            {renderVegetationAsset(
              AssetManager.getAsset('fir_tree_large'), 
              200, 160, 1.0,
              <g transform="translate(200, 160)">
                <circle cx="0" cy="5" r="9" fill="#2d5016"/>
                <rect x="-2" y="5" width="4" height="16" fill="#8B4513"/>
              </g>
            )}

            {/* Medium Trees */}
            {renderVegetationAsset(
              AssetManager.getAsset('fey_tree_medium'), 
              -120, -200, 0.8,
              <g transform="translate(-120, -200)">
                <circle cx="0" cy="4" r="6" fill="#3a6b1e"/>
                <rect x="-1.5" y="4" width="3" height="12" fill="#8B4513"/>
              </g>
            )}
            {renderVegetationAsset(
              AssetManager.getAsset('fey_tree_medium'), 
              150, -200, 0.9,
              <g transform="translate(150, -200)">
                <circle cx="0" cy="4" r="7" fill="#3a6b1e"/>
                <rect x="-1.5" y="4" width="3" height="13" fill="#8B4513"/>
              </g>
            )}
            {renderVegetationAsset(
              AssetManager.getAsset('fey_tree_medium'), 
              -280, 120, 0.8,
              <g transform="translate(-280, 120)">
                <circle cx="0" cy="4" r="6" fill="#3a6b1e"/>
                <rect x="-1.5" y="4" width="3" height="11" fill="#8B4513"/>
              </g>
            )}
            {renderVegetationAsset(
              AssetManager.getAsset('fey_tree_medium'), 
              280, 100, 1.0,
              <g transform="translate(280, 100)">
                <circle cx="0" cy="4" r="8" fill="#3a6b1e"/>
                <rect x="-1.5" y="4" width="3" height="14" fill="#8B4513"/>
              </g>
            )}
            
            {/* Bush clusters */}
            {renderVegetationAsset(
              AssetManager.getAsset('fey_bush_large'), 
              -270, -100, 0.7,
              <g transform="translate(-270, -100)">
                <circle cx="0" cy="0" r="6" fill="#4a5d23"/>
                <circle cx="5" cy="2" r="4" fill="#5d6e2e"/>
                <circle cx="-4" cy="3" r="3" fill="#4a5d23"/>
              </g>
            )}
            {renderVegetationAsset(
              AssetManager.getAsset('fey_bush_small'), 
              260, -120, 0.6,
              <g transform="translate(260, -120)">
                <circle cx="0" cy="0" r="5" fill="#4a5d23"/>
                <circle cx="-3" cy="2" r="3" fill="#5d6e2e"/>
              </g>
            )}
            {renderVegetationAsset(
              AssetManager.getAsset('fey_bush_large'), 
              -230, 200, 0.8,
              <g transform="translate(-230, 200)">
                <circle cx="0" cy="0" r="7" fill="#4a5d23"/>
                <circle cx="6" cy="-1" r="5" fill="#5d6e2e"/>
                <circle cx="-5" cy="2" r="4" fill="#4a5d23"/>
              </g>
            )}
            {renderVegetationAsset(
              AssetManager.getAsset('fey_bush_small'), 
              240, 180, 0.7,
              <g transform="translate(240, 180)">
                <circle cx="0" cy="0" r="6" fill="#4a5d23"/>
                <circle cx="4" cy="2" r="4" fill="#5d6e2e"/>
              </g>
            )}
            
            {/* Small vegetation clusters and wildflowers */}
            <g opacity="0.7">
              <circle cx="-150" cy="-50" r="3" fill="#5d6e2e"/>
              <circle cx="-145" cy="-48" r="2" fill="#5d6e2e"/>
              <circle cx="180" cy="50" r="3" fill="#5d6e2e"/>
              <circle cx="175" cy="52" r="2" fill="#5d6e2e"/>
              <circle cx="-100" cy="120" r="2" fill="#7d8f47"/>
              <circle cx="100" cy="-80" r="2.5" fill="#7d8f47"/>
              <circle cx="-50" cy="-120" r="1.5" fill="#6b7a3e"/>
              <circle cx="50" cy="100" r="2" fill="#6b7a3e"/>
            </g>

            {/* Wildflowers */}
            <g opacity="0.8">
              <circle cx="-200" cy="-100" r="1" fill="#ff69b4"/>
              <circle cx="-195" cy="-102" r="0.8" fill="#ff1493"/>
              <circle cx="220" cy="80" r="1" fill="#9370db"/>
              <circle cx="225" cy="82" r="0.8" fill="#8a2be2"/>
              <circle cx="-80" cy="150" r="0.9" fill="#ffd700"/>
              <circle cx="-75" cy="152" r="0.7" fill="#daa520"/>
              <circle cx="160" cy="-120" r="1" fill="#ff6347"/>
              <circle cx="165" cy="-118" r="0.8" fill="#ff4500"/>
            </g>

            {/* Small grass tufts - deterministic positioning */}
            <g opacity="0.5">
              {Array.from({length: 20}).map((_, i) => {
                // Use seeded random for consistent positioning
                const seededRandom = (index: number) => {
                  const x = Math.sin(i * 1000 + index) * 10000;
                  return x - Math.floor(x);
                };
                
                const x = -250 + seededRandom(1) * 500;
                const y = -200 + seededRandom(2) * 400;
                const size = 0.5 + seededRandom(3) * 1;
                return (
                  <circle 
                    key={`grass-${i}`}
                    cx={x} 
                    cy={y} 
                    r={size} 
                    fill="#7d8f47" 
                  />
                );
              })}
            </g>

            {/* Mushroom rings */}
            <g opacity="0.6" transform="translate(-50, 50)">
              <circle cx="0" cy="-5" r="1.5" fill="#8B4513"/>
              <circle cx="4" cy="-2" r="1.5" fill="#8B4513"/>
              <circle cx="2" cy="4" r="1.5" fill="#8B4513"/>
              <circle cx="-3" cy="3" r="1.5" fill="#8B4513"/>
              <circle cx="-4" cy="-1" r="1.5" fill="#8B4513"/>
            </g>

            {/* Rock formations */}
            <g opacity="0.7">
              <ellipse cx="-200" cy="50" rx="8" ry="4" fill="#696969"/>
              <ellipse cx="-195" cy="48" rx="6" ry="3" fill="#778899"/>
              <ellipse cx="180" cy="-40" rx="10" ry="5" fill="#696969"/>
              <ellipse cx="175" cy="-42" rx="7" ry="4" fill="#778899"/>
              <ellipse cx="-30" cy="180" rx="6" ry="3" fill="#696969"/>
              <ellipse cx="30" cy="-180" rx="9" ry="4" fill="#696969"/>
            </g>

            {/* Path markers (small stone cairns) */}
            <g opacity="0.8">
              <g transform="translate(-100, -150)">
                <ellipse cx="0" cy="2" rx="2" ry="1" fill="#696969"/>
                <ellipse cx="0" cy="0" rx="1.5" ry="0.8" fill="#778899"/>
                <ellipse cx="0" cy="-1.5" rx="1" ry="0.5" fill="#696969"/>
              </g>
              <g transform="translate(120, 140)">
                <ellipse cx="0" cy="2" rx="2" ry="1" fill="#696969"/>
                <ellipse cx="0" cy="0" rx="1.5" ry="0.8" fill="#778899"/>
                <ellipse cx="0" cy="-1.5" rx="1" ry="0.5" fill="#696969"/>
              </g>
            </g>
          </g>
      {layout.roads.map((road) => (
        <polyline
          key={road.id}
          points={getRoadPoints(road)}
          stroke={road.roadType === 'main' ? '#8B4513' : road.roadType === 'side' ? '#A0522D' : '#D2691E'}
          fill="none"
          strokeWidth={road.width ? road.width * 0.5 : 1.2}
        />
      ))}
      {layout.buildings.map((b) => (
        <g key={b.id} className="building-group">
          {/* Main building structure */}
          <polygon
            points={b.polygon.vertices.map((p: Point) => `${p.x},${p.y}`).join(' ')}
            fill={fillForType[b.type] || '#8fbc8f'}
            stroke="#2c3e50"
            strokeWidth="1"
            onClick={() => handleBuildingClick(b.id, b.type)}
            onMouseEnter={(e) => handleBuildingMouseEnter(e, b.id, b.type)}
            onMouseLeave={handleBuildingMouseLeave}
            style={{ 
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              filter: 'brightness(1)'
            }}
            className="village-building"
            data-type={b.type}
          />
          {/* Building details */}
          {renderBuildingDetails(b)}
          {/* Building lot fencing and gardens */}
          {renderBuildingLot(b)}
        </g>
      ))}
      
      {/* Building Entrances */}
      {layout.buildings.map((b) => (
        <circle
          key={`entrance_${b.id}`}
          cx={b.entryPoint.x}
          cy={b.entryPoint.y}
          r="2"
          fill="#8B4513"
          stroke="#FFF"
          strokeWidth="0.5"
          className="building-entrance"
        />
      ))}
      {/* Village Walls */}
      {layout.walls && layout.walls.map((wall) => (
        <g key={wall.id}>
          {/* Wall segments */}
          {wall.segments && (
            <>
              {/* Wall shadow/base */}
              <polygon
                points={wall.segments.map((p: Point) => `${p.x + 1},${p.y + 1}`).join(' ')}
                stroke="#2c3e50"
                strokeWidth="6"
                fill="none"
                pointerEvents="none"
                opacity="0.3"
              />
              {/* Main wall */}
              <polygon
                points={wall.segments.map((p: Point) => `${p.x},${p.y}`).join(' ')}
                stroke="#34495e"
                strokeWidth="4"
                fill="none"
                strokeDasharray="none"
                pointerEvents="none"
                style={{ pointerEvents: 'none' }}
              />
              {/* Wall highlight */}
              <polygon
                points={wall.segments.map((p: Point) => `${p.x - 0.5},${p.y - 0.5}`).join(' ')}
                stroke="#5d6d7e"
                strokeWidth="1"
                fill="none"
                pointerEvents="none"
                opacity="0.7"
              />
            </>
          )}
          
          {/* Gates */}
          {wall.gates && wall.gates.map((gate) => (
            <g key={gate.id} style={{ pointerEvents: 'none' }}>
              {/* Gate shadow */}
              <circle
                cx={gate.position.x + 1}
                cy={gate.position.y + 1}
                r={gate.width / 2 + 1}
                fill="#2c3e50"
                opacity="0.3"
                pointerEvents="none"
              />
              {/* Gate opening (break in wall) */}
              <circle
                cx={gate.position.x}
                cy={gate.position.y}
                r={gate.width / 2}
                fill="#f4f1de"
                stroke="#8B4513"
                strokeWidth="2"
                pointerEvents="none"
              />
              {/* Gate structure */}
              <rect
                x={gate.position.x - 2}
                y={gate.position.y - gate.width / 2}
                width="4"
                height={gate.width}
                fill="#8B4513"
                stroke="#654321"
                strokeWidth="1"
                pointerEvents="none"
              />
              <text
                x={gate.position.x}
                y={gate.position.y + 2}
                textAnchor="middle"
                fontSize="7"
                fill="#654321"
                fontWeight="bold"
                pointerEvents="none"
              >
                ⛩️
              </text>
            </g>
          ))}
        </g>
      ))}
      
          </g> {/* End of transform group */}
        </svg>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            background: 'rgba(0, 0, 0, 0.95)',
            color: 'white',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '500',
            pointerEvents: 'none',
            zIndex: 1000,
            whiteSpace: 'nowrap',
            transform: 'translateX(-50%)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {tooltip.text}
        </div>
      )}

    {/* CSS Styles */}
    <style>{`
      .village-building:hover {
        filter: brightness(1.3) !important;
        stroke: #fff !important;
        stroke-width: 3 !important;
        cursor: pointer;
        transform: scale(1.02);
        drop-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
      }
      .village-building {
        transition: all 0.2s ease;
        filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.3));
      }
      
      /* Special building type highlights */
      .village-building[data-type="inn"]:hover {
        stroke: #DAA520 !important;
      }
      .village-building[data-type="blacksmith"]:hover {
        stroke: #FF6B35 !important;
      }
      .village-building[data-type="alchemist"]:hover {
        stroke: #9370DB !important;
      }
      .village-building[data-type="magic_shop"]:hover {
        stroke: #8A2BE2 !important;
      }
      .village-building[data-type="temple"]:hover {
        stroke: #F0E68C !important;
      }
      
      .building-entrance {
        pointer-events: none;
        transition: all 0.2s ease;
      }
      
      .village-building:hover + .building-entrance {
        r: 3;
        fill: #DAA520;
        stroke: #FFF;
        stroke-width: 1;
      }
    `}</style>

    {/* Building Details Modal */}
    <BuildingDetailsModal 
      building={selectedBuilding}
      onClose={handleCloseModal}
    />

    </div>
  );
};
