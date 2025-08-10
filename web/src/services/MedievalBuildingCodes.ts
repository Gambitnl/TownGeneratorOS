import { BuildingType, SocialClass } from './StandaloneBuildingGenerator';
import { Room } from './ProceduralBuildingGenerator';
import { FloorFootprint } from './StructuralEngine';

export interface BuildingCode {
  id: string;
  name: string;
  description: string;
  requirement: string;
  type: 'size' | 'height' | 'ventilation' | 'safety' | 'structural' | 'sanitation';
  severity: 'mandatory' | 'recommended' | 'optional';
  socialClassApplies: SocialClass[];
  buildingTypesApplies: BuildingType[];
  minValue?: number;
  maxValue?: number;
  calculation: (room: Room, building?: any) => number;
  validator: (room: Room, building?: any) => boolean;
}

export interface CodeViolation {
  codeId: string;
  roomId?: string;
  severity: 'mandatory' | 'recommended' | 'optional';
  description: string;
  recommendation: string;
  currentValue: number;
  requiredValue: number;
}

export class MedievalBuildingCodes {
  private static codes: BuildingCode[] = [
    // ROOM SIZE MINIMUMS
    {
      id: 'MIN_BEDROOM_SIZE',
      name: 'Minimum Bedroom Size',
      description: 'Bedrooms must provide adequate space for sleeping and basic activities',
      requirement: 'Minimum 20 square tiles (100 sq ft) for primary bedrooms',
      type: 'size',
      severity: 'mandatory',
      socialClassApplies: ['poor', 'common', 'wealthy', 'noble'],
      buildingTypesApplies: ['house_small', 'house_large', 'tavern'],
      minValue: 20,
      calculation: (room: Room) => room.width * room.height,
      validator: (room: Room) => room.type === 'bedroom' ? (room.width * room.height >= 20) : true
    },

    {
      id: 'MIN_LIVING_AREA_SIZE',
      name: 'Minimum Living Area Size',
      description: 'Main living areas must accommodate family activities and social gatherings',
      requirement: 'Minimum 35 square tiles (175 sq ft) for main living rooms',
      type: 'size',
      severity: 'mandatory',
      socialClassApplies: ['common', 'wealthy', 'noble'],
      buildingTypesApplies: ['house_small', 'house_large'],
      minValue: 35,
      calculation: (room: Room) => room.width * room.height,
      validator: (room: Room) => 
        (room.type === 'living' || room.type === 'common') ? 
        (room.width * room.height >= 35) : true
    },

    {
      id: 'MIN_KITCHEN_SIZE',
      name: 'Minimum Kitchen Size',
      description: 'Kitchens must provide space for cooking, food preparation, and storage',
      requirement: 'Minimum 24 square tiles (120 sq ft) with proper ventilation',
      type: 'size',
      severity: 'mandatory',
      socialClassApplies: ['poor', 'common', 'wealthy', 'noble'],
      buildingTypesApplies: ['house_small', 'house_large', 'tavern'],
      minValue: 24,
      calculation: (room: Room) => room.width * room.height,
      validator: (room: Room) => room.type === 'kitchen' ? (room.width * room.height >= 24) : true
    },

    // CEILING HEIGHTS
    {
      id: 'MIN_CEILING_HEIGHT_LIVING',
      name: 'Minimum Ceiling Height - Living Areas',
      description: 'Living areas require adequate headroom for comfort and air circulation',
      requirement: 'Minimum 8 feet (1.6 tiles) ceiling height in living spaces',
      type: 'height',
      severity: 'mandatory',
      socialClassApplies: ['poor', 'common', 'wealthy', 'noble'],
      buildingTypesApplies: ['house_small', 'house_large', 'tavern', 'shop'],
      minValue: 1.6, // tiles (8 feet / 5 feet per tile)
      calculation: (room: Room, building: any) => {
        if (!building?.floors) return 3; // Default height
        const floor = building.floors.find((f: any) => f.level === room.floor);
        return floor ? floor.height : 3;
      },
      validator: (room: Room, building: any) => {
        if (room.type !== 'living' && room.type !== 'common' && room.type !== 'tavern_hall') return true;
        const height = building?.floors?.find((f: any) => f.level === room.floor)?.height || 3;
        return height >= 1.6;
      }
    },

    {
      id: 'MIN_CEILING_HEIGHT_BEDROOM',
      name: 'Minimum Ceiling Height - Bedrooms',
      description: 'Bedrooms require adequate headroom for sleeping comfort',
      requirement: 'Minimum 7 feet (1.4 tiles) ceiling height in bedrooms',
      type: 'height',
      severity: 'recommended',
      socialClassApplies: ['common', 'wealthy', 'noble'],
      buildingTypesApplies: ['house_small', 'house_large', 'tavern'],
      minValue: 1.4,
      calculation: (room: Room, building: any) => {
        const floor = building?.floors?.find((f: any) => f.level === room.floor);
        return floor ? floor.height : 3;
      },
      validator: (room: Room, building: any) => {
        if (room.type !== 'bedroom') return true;
        const height = building?.floors?.find((f: any) => f.level === room.floor)?.height || 3;
        return height >= 1.4;
      }
    },

    // VENTILATION REQUIREMENTS
    {
      id: 'KITCHEN_VENTILATION',
      name: 'Kitchen Ventilation',
      description: 'Kitchens must have proper ventilation to remove smoke and cooking odors',
      requirement: 'At least one window or chimney per kitchen',
      type: 'ventilation',
      severity: 'mandatory',
      socialClassApplies: ['poor', 'common', 'wealthy', 'noble'],
      buildingTypesApplies: ['house_small', 'house_large', 'tavern'],
      minValue: 1,
      calculation: (room: Room) => {
        if (room.type !== 'kitchen') return 1;
        const windows = room.windows?.length || 0;
        const chimneys = room.chimneys?.length || 0;
        const hearths = room.fixtures?.filter(f => f.type === 'hearth').length || 0;
        return windows + chimneys + hearths;
      },
      validator: (room: Room) => {
        if (room.type !== 'kitchen') return true;
        const ventilation = (room.windows?.length || 0) + 
                          (room.chimneys?.length || 0) + 
                          (room.fixtures?.filter(f => f.type === 'hearth').length || 0);
        return ventilation >= 1;
      }
    },

    {
      id: 'BEDROOM_VENTILATION',
      name: 'Bedroom Ventilation',
      description: 'Bedrooms should have natural light and fresh air access',
      requirement: 'At least one window per bedroom',
      type: 'ventilation',
      severity: 'recommended',
      socialClassApplies: ['common', 'wealthy', 'noble'],
      buildingTypesApplies: ['house_small', 'house_large', 'tavern'],
      minValue: 1,
      calculation: (room: Room) => room.windows?.length || 0,
      validator: (room: Room) => {
        if (room.type !== 'bedroom') return true;
        return (room.windows?.length || 0) >= 1;
      }
    },

    {
      id: 'WORKSHOP_VENTILATION',
      name: 'Workshop Ventilation',
      description: 'Workshops require excellent ventilation due to smoke, fumes, and heat',
      requirement: 'Multiple windows and/or chimney systems',
      type: 'ventilation',
      severity: 'mandatory',
      socialClassApplies: ['poor', 'common', 'wealthy'],
      buildingTypesApplies: ['blacksmith', 'shop'],
      minValue: 2,
      calculation: (room: Room) => {
        const windows = room.windows?.length || 0;
        const doors = room.doors?.length || 0;
        const chimneys = room.chimneys?.length || 0;
        return windows + doors + chimneys;
      },
      validator: (room: Room) => {
        if (room.type !== 'workshop') return true;
        const ventilation = (room.windows?.length || 0) + 
                          (room.doors?.length || 0) + 
                          (room.chimneys?.length || 0);
        return ventilation >= 2;
      }
    },

    // SAFETY REQUIREMENTS
    {
      id: 'FIRE_SAFETY_EXITS',
      name: 'Fire Safety - Multiple Exits',
      description: 'Large rooms should have multiple exit routes for fire safety',
      requirement: 'Rooms larger than 50 tiles should have 2+ exits',
      type: 'safety',
      severity: 'recommended',
      socialClassApplies: ['common', 'wealthy', 'noble'],
      buildingTypesApplies: ['house_large', 'tavern', 'shop'],
      minValue: 2,
      calculation: (room: Room) => room.doors?.length || 0,
      validator: (room: Room) => {
        const roomArea = room.width * room.height;
        if (roomArea < 50) return true; // Small rooms only need 1 exit
        return (room.doors?.length || 0) >= 2;
      }
    },

    {
      id: 'STAIR_SAFETY',
      name: 'Staircase Safety',
      description: 'Staircases must have adequate width and headroom',
      requirement: 'Minimum 2 tiles wide for main stairs, proper lighting',
      type: 'safety',
      severity: 'mandatory',
      socialClassApplies: ['common', 'wealthy', 'noble'],
      buildingTypesApplies: ['house_large', 'tavern'],
      minValue: 2,
      calculation: (room: Room) => {
        const stairs = room.stairs?.length || 0;
        return stairs > 0 ? Math.min(room.width, room.height) : 2; // Return width/height if has stairs
      },
      validator: (room: Room) => {
        if (!room.stairs || room.stairs.length === 0) return true;
        return Math.min(room.width, room.height) >= 2;
      }
    },

    // SANITATION REQUIREMENTS
    {
      id: 'SANITATION_ACCESS',
      name: 'Sanitation Access',
      description: 'Buildings should provide adequate sanitation facilities',
      requirement: 'At least one privy or garderobe per building',
      type: 'sanitation',
      severity: 'recommended',
      socialClassApplies: ['common', 'wealthy', 'noble'],
      buildingTypesApplies: ['house_small', 'house_large', 'tavern'],
      minValue: 1,
      calculation: (room: Room, building: any) => {
        if (!building?.rooms) return 0;
        return building.rooms.reduce((count: number, r: Room) => {
          const privyFixtures = r.fixtures?.filter(f => f.type === 'privy' || f.type === 'garderobe').length || 0;
          return count + privyFixtures;
        }, 0);
      },
      validator: (room: Room, building: any) => {
        if (!building?.rooms) return true;
        const totalPrivies = building.rooms.reduce((count: number, r: Room) => {
          const privyFixtures = r.fixtures?.filter(f => f.type === 'privy' || f.type === 'garderobe').length || 0;
          return count + privyFixtures;
        }, 0);
        return totalPrivies >= 1;
      }
    },

    // STRUCTURAL REQUIREMENTS
    {
      id: 'LOAD_BEARING_SUPPORT',
      name: 'Load Bearing Support',
      description: 'Multi-story buildings require adequate structural support',
      requirement: 'Load-bearing walls or supports for each floor above ground',
      type: 'structural',
      severity: 'mandatory',
      socialClassApplies: ['poor', 'common', 'wealthy', 'noble'],
      buildingTypesApplies: ['house_large', 'tavern'],
      minValue: 1,
      calculation: (room: Room, building: any) => {
        if (!building?.floors || building.floors.length <= 1) return 1;
        return building.floors.length; // Simplified - assume adequate if multi-story exists
      },
      validator: (room: Room, building: any) => {
        if (!building?.floors || building.floors.length <= 1) return true;
        // Simplified validation - multi-story buildings are assumed to have adequate support
        return true;
      }
    }
  ];

  static validateBuilding(
    rooms: Room[],
    building: any,
    buildingType: BuildingType,
    socialClass: SocialClass
  ): {
    violations: CodeViolation[];
    compliance: {
      mandatory: number; // percentage
      recommended: number; // percentage
      overall: number; // percentage
    };
    summary: {
      totalCodes: number;
      mandatoryPassed: number;
      recommendedPassed: number;
      optionalPassed: number;
    };
  } {
    
    const violations: CodeViolation[] = [];
    const applicableCodes = this.codes.filter(code =>
      code.socialClassApplies.includes(socialClass) &&
      code.buildingTypesApplies.includes(buildingType)
    );

    let mandatoryTotal = 0;
    let mandatoryPassed = 0;
    let recommendedTotal = 0;
    let recommendedPassed = 0;
    let optionalTotal = 0;
    let optionalPassed = 0;

    // Validate each room against applicable codes
    rooms.forEach(room => {
      applicableCodes.forEach(code => {
        const isCompliant = code.validator(room, building);
        const currentValue = code.calculation(room, building);
        
        if (code.severity === 'mandatory') {
          mandatoryTotal++;
          if (isCompliant) mandatoryPassed++;
        } else if (code.severity === 'recommended') {
          recommendedTotal++;
          if (isCompliant) recommendedPassed++;
        } else {
          optionalTotal++;
          if (isCompliant) optionalPassed++;
        }

        if (!isCompliant) {
          violations.push({
            codeId: code.id,
            roomId: room.id,
            severity: code.severity,
            description: `${room.name}: ${code.description}`,
            recommendation: this.generateRecommendation(code, room, currentValue),
            currentValue,
            requiredValue: code.minValue || 0
          });
        }
      });
    });

    // Building-wide validations (check once per building, not per room)
    const buildingWideCodes = applicableCodes.filter(code => 
      code.id === 'SANITATION_ACCESS' || code.id === 'LOAD_BEARING_SUPPORT'
    );

    buildingWideCodes.forEach(code => {
      // Use first room for building-wide checks
      const firstRoom = rooms[0];
      if (!firstRoom) return;

      const isCompliant = code.validator(firstRoom, building);
      const currentValue = code.calculation(firstRoom, building);
      
      // Don't double-count these in the totals since they're building-wide
      if (!isCompliant) {
        violations.push({
          codeId: code.id,
          severity: code.severity,
          description: `Building: ${code.description}`,
          recommendation: this.generateBuildingRecommendation(code, building, currentValue),
          currentValue,
          requiredValue: code.minValue || 0
        });
      }
    });

    const mandatoryCompliance = mandatoryTotal > 0 ? (mandatoryPassed / mandatoryTotal) * 100 : 100;
    const recommendedCompliance = recommendedTotal > 0 ? (recommendedPassed / recommendedTotal) * 100 : 100;
    const overallCompliance = 
      (mandatoryTotal + recommendedTotal + optionalTotal) > 0 ? 
      ((mandatoryPassed + recommendedPassed + optionalPassed) / (mandatoryTotal + recommendedTotal + optionalTotal)) * 100 : 100;

    return {
      violations,
      compliance: {
        mandatory: Math.round(mandatoryCompliance),
        recommended: Math.round(recommendedCompliance),
        overall: Math.round(overallCompliance)
      },
      summary: {
        totalCodes: applicableCodes.length,
        mandatoryPassed,
        recommendedPassed,
        optionalPassed
      }
    };
  }

  private static generateRecommendation(code: BuildingCode, room: Room, currentValue: number): string {
    switch (code.id) {
      case 'MIN_BEDROOM_SIZE':
        return `Expand bedroom to at least ${code.minValue} tiles. Current: ${currentValue} tiles. Consider ${Math.ceil((code.minValue! - currentValue) / 2)} tiles in each direction.`;
      
      case 'MIN_LIVING_AREA_SIZE':
        return `Expand living area to at least ${code.minValue} tiles. Current: ${currentValue} tiles. Consider combining adjacent rooms or extending building.`;
      
      case 'MIN_KITCHEN_SIZE':
        return `Expand kitchen to at least ${code.minValue} tiles. Current: ${currentValue} tiles. Ensure space for cooking area, food prep, and storage.`;
      
      case 'KITCHEN_VENTILATION':
        return `Add ${code.minValue! - currentValue} ventilation source(s). Install windows, chimney, or door for proper airflow.`;
      
      case 'BEDROOM_VENTILATION':
        return `Add at least one window for natural light and fresh air circulation.`;
      
      case 'WORKSHOP_VENTILATION':
        return `Add ${code.minValue! - currentValue} additional ventilation source(s). Critical for workshop safety and comfort.`;
      
      case 'FIRE_SAFETY_EXITS':
        return `Add ${code.minValue! - currentValue} additional exit(s) for fire safety in this large room.`;
      
      case 'STAIR_SAFETY':
        return `Widen staircase area to at least ${code.minValue} tiles. Current width: ${currentValue} tiles.`;
      
      default:
        return `Improve to meet code requirement: ${code.requirement}`;
    }
  }

  private static generateBuildingRecommendation(code: BuildingCode, building: any, currentValue: number): string {
    switch (code.id) {
      case 'SANITATION_ACCESS':
        return `Add ${code.minValue! - currentValue} sanitation facility (privy or garderobe) to the building.`;
      
      case 'LOAD_BEARING_SUPPORT':
        return `Ensure adequate load-bearing walls or supports for multi-story construction.`;
      
      default:
        return `Address building-wide issue: ${code.requirement}`;
    }
  }

  static getCodeById(codeId: string): BuildingCode | undefined {
    return this.codes.find(code => code.id === codeId);
  }

  static getCodesForBuildingType(
    buildingType: BuildingType,
    socialClass: SocialClass
  ): BuildingCode[] {
    return this.codes.filter(code =>
      code.buildingTypesApplies.includes(buildingType) &&
      code.socialClassApplies.includes(socialClass)
    );
  }

  static generateComplianceReport(
    violations: CodeViolation[],
    compliance: { mandatory: number; recommended: number; overall: number }
  ): string {
    let report = '=== MEDIEVAL BUILDING CODE COMPLIANCE REPORT ===\n\n';
    
    report += `Overall Compliance: ${compliance.overall}%\n`;
    report += `Mandatory Codes: ${compliance.mandatory}%\n`;
    report += `Recommended Codes: ${compliance.recommended}%\n\n`;
    
    if (violations.length === 0) {
      report += '✅ All applicable building codes are satisfied!\n';
      return report;
    }

    report += '⚠️  CODE VIOLATIONS FOUND:\n\n';
    
    const mandatoryViolations = violations.filter(v => v.severity === 'mandatory');
    const recommendedViolations = violations.filter(v => v.severity === 'recommended');
    const optionalViolations = violations.filter(v => v.severity === 'optional');
    
    if (mandatoryViolations.length > 0) {
      report += '🚨 MANDATORY VIOLATIONS (Must Fix):\n';
      mandatoryViolations.forEach((violation, index) => {
        report += `${index + 1}. ${violation.description}\n`;
        report += `   ${violation.recommendation}\n\n`;
      });
    }
    
    if (recommendedViolations.length > 0) {
      report += '⚡ RECOMMENDED IMPROVEMENTS:\n';
      recommendedViolations.forEach((violation, index) => {
        report += `${index + 1}. ${violation.description}\n`;
        report += `   ${violation.recommendation}\n\n`;
      });
    }
    
    if (optionalViolations.length > 0) {
      report += '💡 OPTIONAL ENHANCEMENTS:\n';
      optionalViolations.forEach((violation, index) => {
        report += `${index + 1}. ${violation.description}\n`;
        report += `   ${violation.recommendation}\n\n`;
      });
    }
    
    return report;
  }

  static automaticallyFixViolations(
    rooms: Room[],
    violations: CodeViolation[]
  ): { fixed: number; recommendations: string[] } {
    let fixed = 0;
    const recommendations: string[] = [];

    violations.forEach(violation => {
      if (violation.severity === 'mandatory') {
        const room = rooms.find(r => r.id === violation.roomId);
        if (!room) return;

        switch (violation.codeId) {
          case 'KITCHEN_VENTILATION':
            if (!room.windows) room.windows = [];
            if (room.windows.length === 0) {
              room.windows.push({
                x: room.x + 1,
                y: room.y,
                direction: 'north'
              });
              fixed++;
              recommendations.push(`Added window to ${room.name} for ventilation`);
            }
            break;

          case 'WORKSHOP_VENTILATION':
            if (!room.doors) room.doors = [];
            if (room.doors.length < 2) {
              room.doors.push({
                x: room.x + room.width - 1,
                y: room.y + Math.floor(room.height / 2),
                direction: 'east'
              });
              fixed++;
              recommendations.push(`Added additional door to ${room.name} for ventilation`);
            }
            break;

          default:
            recommendations.push(`Manual fix required for ${room.name}: ${violation.recommendation}`);
        }
      }
    });

    return { fixed, recommendations };
  }
}