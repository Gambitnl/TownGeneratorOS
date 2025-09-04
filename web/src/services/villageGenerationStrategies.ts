import { VillageLayout, VillageOptions } from './villageGenerationService';

export interface VillageGenerationStrategy {
    generate(seed: string, options: VillageOptions): Promise<VillageLayout>;
}