import { describe, it, expect } from 'vitest';
import { generateWfcGrid, transformGridToLayout, VillageOptions, WfcGrid } from './villageGenerationService';

describe('villageGenerationService', () => {
  it('should generate a WFC grid that matches the snapshot', async () => {
    const options: VillageOptions = {
      type: 'farming',
      size: 'small',
    };
    const grid = await generateWfcGrid('test-seed', options);
    expect(grid).toMatchSnapshot();
  });

  it('should transform a grid to a layout', () => {
    const grid: WfcGrid = [
      [{ id: 'road', weight: 1, rules: {} }, { id: 'road', weight: 1, rules: {} }],
      [{ id: 'building_roof', weight: 1, rules: {} }, { id: 'building_roof', weight: 1, rules: {} }],
    ];
    const options: VillageOptions = {
      type: 'farming',
      size: 'small',
    };
    const layout = transformGridToLayout(grid, options);
    expect(layout.buildings.length).toBe(1);
    expect(layout.roads.length).toBe(1);
  });
});
