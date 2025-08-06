import { Random } from '@/utils/Random';

export interface BuildingResident {
  name: string;
  occupation: string;
  age: number;
  personality: string[];
  background: string;
  quirks?: string[];
  relations?: string[];
}

export interface BuildingDetails {
  name: string;
  type: 'residential' | 'commercial' | 'workshop' | 'service' | 'magical' | 'religious' | 'mixed';
  primaryPurpose: string;
  secondaryPurpose?: string;
  description: string;
  residents: BuildingResident[];
  specialFeatures?: string[];
  inventory?: string[];
  rumors?: string[];
  hooks?: string[]; // Adventure hooks
}

export interface BuildingTemplate {
  buildingType: string;
  weight: number; // Likelihood of appearing
  generate: () => BuildingDetails;
}

// Name generators
const FIRST_NAMES = {
  human_male: ['Aldric', 'Bram', 'Cedric', 'Dunstan', 'Edric', 'Finn', 'Gareth', 'Haldor', 'Ivan', 'Jasper', 'Klaus', 'Lars', 'Magnus', 'Nolan', 'Osric', 'Piers', 'Quinlan', 'Roderick', 'Silas', 'Thane', 'Ulrich', 'Victor', 'Willem', 'Xavier', 'Yorick', 'Zephyr'],
  human_female: ['Adara', 'Brenna', 'Cordelia', 'Dara', 'Elara', 'Freya', 'Gwendolyn', 'Hazel', 'Iris', 'Jenna', 'Kira', 'Lyra', 'Mira', 'Nora', 'Ophelia', 'Petra', 'Quinn', 'Raven', 'Sera', 'Tara', 'Una', 'Vera', 'Willa', 'Xara', 'Yara', 'Zara'],
  halfling: ['Bilbo', 'Frodo', 'Pippin', 'Merry', 'Samwell', 'Rosie', 'Daisy', 'Poppy', 'Lily', 'Primrose', 'Peregrin', 'Mungo', 'Bingo', 'Drogo', 'Polo'],
  dwarf_male: ['Thorin', 'Gimli', 'Balin', 'Dwalin', 'Gloin', 'Oin', 'Bifur', 'Bofur', 'Bombur', 'Dain', 'Nain', 'Fili', 'Kili', 'Ori', 'Nori', 'Dori'],
  dwarf_female: ['Disa', 'Nala', 'Hilda', 'Brunhilde', 'Astrid', 'Ingrid', 'Sigrid', 'Freydis', 'Valdis', 'Ragnhild'],
  elf: ['Legolas', 'Arwen', 'Galadriel', 'Elrond', 'Thranduil', 'Celebrimbor', 'Lindir', 'Haldir', 'Erestor', 'Glorfindel', 'Elaria', 'Silviana', 'Aerdrie', 'Caelynn', 'Enna', 'Silvyr', 'Thalion', 'Elarian']
};

const FAMILY_NAMES = ['Blackwood', 'Goldleaf', 'Ironforge', 'Stormwind', 'Brightblade', 'Shadowmere', 'Greycloak', 'Redmane', 'Silverton', 'Thornfield', 'Ashford', 'Moonwhisper', 'Starweaver', 'Flameheart', 'Frostborn', 'Earthsong', 'Windwalker', 'Riverstone', 'Deepmine', 'Highcastle', 'Swiftarrow', 'Stronghammer', 'Lightbringer', 'Darkbane', 'Trueheart'];

const PERSONALITY_TRAITS = ['cheerful', 'grumpy', 'curious', 'suspicious', 'generous', 'greedy', 'talkative', 'quiet', 'brave', 'cowardly', 'wise', 'foolish', 'patient', 'hasty', 'kind', 'cruel', 'honest', 'sneaky', 'loyal', 'treacherous', 'optimistic', 'pessimistic', 'scholarly', 'practical', 'artistic', 'methodical'];

const QUIRKS = [
  'always hums while working',
  'collects unusual stones',
  'speaks to animals',
  'never removes their hat',
  'counts everything in threes',
  'tells the same story repeatedly',
  'has an unusual fear of butterflies',
  'keeps detailed weather records',
  'names all their tools',
  'only eats food that starts with certain letters',
  'believes in very specific superstitions',
  'has a pet that follows them everywhere',
  'always wears mismatched socks',
  'speaks in rhymes when nervous',
  'has an impressive collection of buttons'
];

function generateName(race?: string): string {
  const raceKey = race || Random.choose(['human_male', 'human_female', 'halfling', 'dwarf_male', 'dwarf_female', 'elf']);
  const firstName = Random.choose(FIRST_NAMES[raceKey as keyof typeof FIRST_NAMES] || FIRST_NAMES.human_male);
  const lastName = Random.choose(FAMILY_NAMES);
  return `${firstName} ${lastName}`;
}

function generatePersonality(): string[] {
  const numTraits = Random.int(2, 4);
  const traits: string[] = [];
  for (let i = 0; i < numTraits; i++) {
    const trait = Random.choose(PERSONALITY_TRAITS);
    if (!traits.includes(trait)) {
      traits.push(trait);
    }
  }
  return traits;
}

// Building Templates
const BUILDING_TEMPLATES: BuildingTemplate[] = [
  // HOUSES - Basic residential
  {
    buildingType: 'house',
    weight: 40,
    generate: (): BuildingDetails => {
      const familySize = Random.int(1, 6);
      const residents: BuildingResident[] = [];
      
      // Generate family
      const headOfHousehold = {
        name: generateName(),
        occupation: Random.choose(['farmer', 'laborer', 'craftsperson', 'merchant', 'guard', 'clerk']),
        age: Random.int(25, 55),
        personality: generatePersonality(),
        background: Random.choose([
          'grew up in this village',
          'moved here from a nearby town',
          'inherited the family trade',
          'seeking a quieter life',
          'fled from troubles elsewhere'
        ])
      };
      residents.push(headOfHousehold);

      // Add family members
      for (let i = 1; i < familySize; i++) {
        residents.push({
          name: generateName(),
          occupation: Random.choose(['child', 'spouse', 'elderly parent', 'apprentice', 'helper']),
          age: Random.int(8, 70),
          personality: generatePersonality(),
          background: 'family member'
        });
      }

      return {
        name: `${residents[0].name.split(' ')[1]} Family Home`,
        type: 'residential',
        primaryPurpose: 'family dwelling',
        description: Random.choose([
          'A modest thatched cottage with a small garden',
          'A sturdy stone house with wooden shutters',
          'A two-story timber home with a workshop area',
          'A cozy dwelling with smoke rising from the chimney',
          'A well-maintained house with flower boxes'
        ]),
        residents,
        specialFeatures: Random.bool(0.3) ? [Random.choose([
          'beautiful garden with herbs',
          'small chicken coop',
          'workshop in the back',
          'old family heirloom on display',
          'unusual architectural feature'
        ])] : undefined,
        inventory: Random.bool(0.2) ? [Random.choose([
          'family recipe collection',
          'old farming tools',
          'handmade furniture',
          'small savings hidden away'
        ])] : undefined
      };
    }
  },

  // BLACKSMITH
  {
    buildingType: 'blacksmith',
    weight: 15,
    generate: (): BuildingDetails => ({
      name: 'The Forge',
      type: 'workshop',
      primaryPurpose: 'metalworking and repairs',
      secondaryPurpose: 'custom weapons and tools',
      description: 'A sturdy stone building with a blazing forge, the ring of hammer on anvil echoing from within',
      residents: [{
        name: generateName('dwarf_male'),
        occupation: 'master blacksmith',
        age: Random.int(30, 60),
        personality: ['strong', 'skilled', 'proud'],
        background: 'learned the trade from their father',
        quirks: [Random.choose(['always covered in soot', 'speaks in metalworking metaphors', 'has incredibly strong handshake'])]
      }],
      specialFeatures: [
        'massive bellows system',
        'collection of specialized hammers',
        'apprentice quarters upstairs',
        'special alloy experiments'
      ],
      inventory: ['iron ingots', 'coal supply', 'various weapons', 'farming tools', 'horseshoes', 'nails and fittings'],
      rumors: Random.bool(0.4) ? [Random.choose([
        'working on a mysterious commission',
        'found unusual ore recently',
        'has family connections to famous weaponsmiths',
        'secretly repairs magic items'
      ])] : undefined
    })
  },

  // INN
  {
    buildingType: 'inn',
    weight: 10,
    generate: (): BuildingDetails => ({
      name: Random.choose(['The Prancing Pony', 'The Golden Hearth', 'The Wayward Traveler', 'The Sleeping Dragon', 'The Merry Merchant']),
      type: 'commercial',
      primaryPurpose: 'lodging and meals',
      secondaryPurpose: 'gathering place and information hub',
      description: 'A two-story building with warm light spilling from windows and the sound of conversation within',
      residents: [
        {
          name: generateName(),
          occupation: 'innkeeper',
          age: Random.int(35, 55),
          personality: ['welcoming', 'observant', 'business-minded'],
          background: 'taken over the family business',
          quirks: ['remembers every guest', 'tells elaborate stories', 'has a secret recipe']
        },
        {
          name: generateName(),
          occupation: 'barmaid/barkeep',
          age: Random.int(20, 40),
          personality: generatePersonality(),
          background: 'works here to support family'
        }
      ],
      specialFeatures: [
        'common room with large fireplace',
        'upstairs guest rooms',
        'stable for horses',
        'well-stocked wine cellar'
      ],
      inventory: ['ale and wine', 'traveler supplies', 'local news and gossip', 'rooms for rent'],
      hooks: ['mysterious traveler staying upstairs', 'map left behind by previous guest', 'rumors of treasure in the area']
    })
  },

  // ALCHEMIST
  {
    buildingType: 'alchemist',
    weight: 8,
    generate: (): BuildingDetails => ({
      name: 'The Bubbling Cauldron',
      type: 'magical',
      primaryPurpose: 'potion brewing and magical research',
      secondaryPurpose: 'healing services',
      description: 'A narrow building with strange colored smoke rising from multiple chimneys and the smell of exotic herbs',
      residents: [{
        name: generateName('elf'),
        occupation: 'alchemist',
        age: Random.int(40, 200),
        personality: ['intelligent', 'eccentric', 'curious'],
        background: 'studied at a magical academy',
        quirks: ['speaks to their potions', 'has stained fingers', 'eyes change color with mood', 'keeps detailed experiment journals']
      }],
      specialFeatures: [
        'laboratory with bubbling experiments',
        'extensive herb garden',
        'library of alchemical texts',
        'distillation apparatus'
      ],
      inventory: [
        'healing potions', 'antidotes', 'strange reagents', 'magical components',
        'rare herbs', 'alchemical equipment', 'research notes'
      ],
      rumors: [
        'working on a formula for eternal youth',
        'has connections to powerful wizards',
        'experiments sometimes go wrong spectacularly',
        'possesses rare magical ingredients'
      ]
    })
  },

  // HERBALIST
  {
    buildingType: 'herbalist',
    weight: 12,
    generate: (): BuildingDetails => ({
      name: 'Green Thumb Apothecary',
      type: 'service',
      primaryPurpose: 'herbal remedies and natural healing',
      secondaryPurpose: 'growing and selling herbs',
      description: 'A cottage surrounded by carefully tended gardens full of medicinal plants and herbs',
      residents: [{
        name: generateName('human_female'),
        occupation: 'herbalist healer',
        age: Random.int(30, 65),
        personality: ['wise', 'gentle', 'knowledgeable'],
        background: 'learned from the previous village healer',
        quirks: ['always smells of herbs', 'speaks softly to plants', 'has a cat that helps gather ingredients']
      }],
      specialFeatures: [
        'extensive medicinal garden',
        'drying racks for herbs',
        'mortar and pestle collection',
        'greenhouse for rare plants'
      ],
      inventory: [
        'healing herbs', 'poultices and salves', 'natural remedies',
        'seed collection', 'gardening tools', 'plant identification guides'
      ],
      hooks: [
        'seeking rare herbs for a powerful remedy',
        'knows ancient plant lore',
        'has treated mysterious ailments'
      ]
    })
  },

  // MAGIC SHOP
  {
    buildingType: 'magic_shop',
    weight: 5,
    generate: (): BuildingDetails => ({
      name: 'Mystical Curiosities',
      type: 'magical',
      primaryPurpose: 'selling magical items and components',
      secondaryPurpose: 'magical consultations',
      description: 'A mysterious shop with crystals in the windows and the faint glow of magic emanating from within',
      residents: [{
        name: generateName('human_male'),
        occupation: 'wizard shopkeeper',
        age: Random.int(45, 80),
        personality: ['mysterious', 'knowledgeable', 'selective'],
        background: 'retired adventuring wizard',
        quirks: ['familiar perches on shoulder', 'robes covered in arcane symbols', 'speaks in riddles sometimes']
      }],
      specialFeatures: [
        'enchanted security system',
        'divination crystal ball',
        'rare spell component storage',
        'magical workshop in back'
      ],
      inventory: [
        'minor magical items', 'spell components', 'scrolls', 'potions',
        'crystal balls', 'wands', 'enchanted trinkets', 'spellbooks'
      ],
      rumors: [
        'has items from lost civilizations',
        'can identify any magical item',
        'knows the location of ancient dungeons',
        'once adventured with famous heroes'
      ]
    })
  },

  // TEMPLE/SHRINE
  {
    buildingType: 'temple',
    weight: 8,
    generate: (): BuildingDetails => ({
      name: Random.choose(['Shrine of Light', 'Temple of Nature', 'Sacred Grove Chapel', 'Sanctuary of Peace']),
      type: 'religious',
      primaryPurpose: 'worship and spiritual guidance',
      secondaryPurpose: 'healing and marriages',
      description: 'A peaceful stone building with stained glass windows and the sound of prayer within',
      residents: [{
        name: generateName(),
        occupation: 'village cleric',
        age: Random.int(35, 70),
        personality: ['devout', 'compassionate', 'wise'],
        background: 'called to serve the divine',
        quirks: ['always carries holy symbol', 'quotes scripture frequently', 'helps anyone in need']
      }],
      specialFeatures: [
        'altar with divine focus',
        'healing sanctuary',
        'meditation garden',
        'bell tower'
      ],
      inventory: [
        'holy water', 'healing supplies', 'religious texts',
        'ceremonial items', 'candles and incense'
      ],
      hooks: [
        'ancient relic needs protection',
        'prophetic dreams trouble the cleric',
        'pilgrims seek guidance'
      ]
    })
  },

  // MONSTER HUNTER
  {
    buildingType: 'monster_hunter',
    weight: 3,
    generate: (): BuildingDetails => ({
      name: 'Beast Ward Lodge',
      type: 'service',
      primaryPurpose: 'monster hunting and protection services',
      secondaryPurpose: 'training and equipment',
      description: 'A fortified building with trophy heads mounted outside and weapons visible through windows',
      residents: [{
        name: generateName(),
        occupation: 'monster hunter',
        age: Random.int(25, 50),
        personality: ['brave', 'gruff', 'experienced'],
        background: 'survived encounter with dangerous beast',
        quirks: ['bears scars from many battles', 'sleeps with weapons nearby', 'has uncanny instincts'],
        relations: ['trains local militia', 'knows other hunters in region']
      }],
      specialFeatures: [
        'trophy display room',
        'weapons and trap storage',
        'tracking equipment',
        'first aid station'
      ],
      inventory: [
        'silver weapons', 'monster traps', 'tracking gear',
        'protective potions', 'beast lore books', 'trophy collection'
      ],
      rumors: [
        'tracking something dangerous nearby',
        'has faced legendary creatures',
        'knows weaknesses of local monsters',
        'receives bounties from distant lords'
      ],
      hooks: [
        'strange tracks found near village',
        'livestock disappearing mysteriously',
        'ancient evil stirring in nearby ruins'
      ]
    })
  },

  // ENCHANTER
  {
    buildingType: 'enchanter',
    weight: 4,
    generate: (): BuildingDetails => ({
      name: 'Rune & Ritual',
      type: 'magical',
      primaryPurpose: 'enchanting items and magical services',
      secondaryPurpose: 'magical education',
      description: 'A workshop filled with glowing runes and the steady hum of magical energy',
      residents: [{
        name: generateName('elf'),
        occupation: 'enchanter',
        age: Random.int(60, 300),
        personality: ['precise', 'patient', 'perfectionist'],
        background: 'master of the enchanting arts',
        quirks: ['fingers glow faintly when working', 'speaks ancient languages', 'has perfect memory for formulas']
      }],
      specialFeatures: [
        'enchanting circles and runes',
        'magical focus crystals',
        'ancient spellcasting components',
        'workshop for item modification'
      ],
      inventory: [
        'enchanted weapons', 'magical armor', 'protective charms',
        'enhancement stones', 'runic inscriptions', 'magical ink'
      ],
      hooks: [
        'commissioned to create powerful artifact',
        'ancient enchantment needs renewal',
        'seeking rare materials for special project'
      ]
    })
  },

  // FORTUNE TELLER
  {
    buildingType: 'fortune_teller',
    weight: 6,
    generate: (): BuildingDetails => ({
      name: 'The Sight Beyond',
      type: 'service',
      primaryPurpose: 'divination and fortune telling',
      secondaryPurpose: 'spiritual guidance',
      description: 'A dimly lit building with crystal balls in windows and mystical symbols carved on the door',
      residents: [{
        name: generateName('human_female'),
        occupation: 'seer',
        age: Random.int(40, 75),
        personality: ['mysterious', 'intuitive', 'dramatic'],
        background: 'born with the gift of sight',
        quirks: ['eyes seem to see beyond reality', 'speaks cryptically', 'jewelry makes soft chiming sounds']
      }],
      specialFeatures: [
        'crystal ball chamber',
        'tarot reading table',
        'incense burning area',
        'scrying pool'
      ],
      inventory: [
        'crystal balls', 'divination cards', 'scrying mirrors',
        'mystical herbs', 'fortune telling tools', 'protective amulets'
      ],
      rumors: [
        'predictions always come true',
        'sees things others cannot',
        'has visions of future events',
        'commune with spirits of the past'
      ],
      hooks: [
        'disturbing vision of village\'s future',
        'seeking heroes for prophesied quest',
        'ancient curse needs to be broken'
      ]
    })
  }
];

export class BuildingLibrary {
  public static generateBuilding(requestedType?: string): BuildingDetails {
    let templates = BUILDING_TEMPLATES;
    
    if (requestedType) {
      const specificTemplate = templates.find(t => t.buildingType === requestedType);
      if (specificTemplate) {
        return specificTemplate.generate();
      }
    }
    
    // Weighted random selection
    const totalWeight = templates.reduce((sum, template) => sum + template.weight, 0);
    let randomValue = Random.float() * totalWeight;
    
    for (const template of templates) {
      randomValue -= template.weight;
      if (randomValue <= 0) {
        return template.generate();
      }
    }
    
    // Fallback
    return templates[0].generate();
  }
  
  public static getBuildingTypes(): string[] {
    return BUILDING_TEMPLATES.map(t => t.buildingType);
  }
  
  public static generateTooltip(buildingType: string): string {
    const building = this.generateBuilding(buildingType);
    const resident = building.residents[0];
    return `${building.name} - ${resident.name} (${resident.occupation})`;
  }
}