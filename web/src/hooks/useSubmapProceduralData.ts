import { useEffect, useState } from 'react';
import {
  generateWfcGrid,
  transformGridToLayout,
  VillageLayout,
  VillageOptions
} from '../services/villageGenerationService';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString();
}

export function useSubmapProceduralData(
  currentWorldBiomeId: string,
  options: VillageOptions
) {
  const [villageLayout, setVillageLayout] = useState<VillageLayout>();

  useEffect(() => {
    if (currentWorldBiomeId === 'village') {
      const seed = simpleHash(JSON.stringify(options));
      generateWfcGrid(seed, options).then((grid) => {
        setVillageLayout(transformGridToLayout(grid, options));
      });
    } else {
      setVillageLayout(undefined);
    }
  }, [currentWorldBiomeId, options]);

  return { villageLayout };
}
