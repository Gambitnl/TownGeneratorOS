import React from 'react';
import { useSubmapProceduralData } from '../hooks/useSubmapProceduralData';
import { VillagePane } from './VillagePane';
import { VillageOptions } from '../services/villageGenerationService';

interface Props {
  currentWorldBiomeId: string;
}

export const SubmapPane: React.FC<Props> = ({ currentWorldBiomeId }) => {
  const options: VillageOptions = { type: 'farming', size: 'small' };
  const { villageLayout } = useSubmapProceduralData(currentWorldBiomeId, options);

  if (villageLayout) {
    const handleEnterBuilding = (id: string, type: string) => {
      console.log('ENTER_BUILDING', id, type);
    };
    return <VillagePane layout={villageLayout} onEnterBuilding={handleEnterBuilding} />;
  }

  return <div>Grid-based map not implemented.</div>;
};
