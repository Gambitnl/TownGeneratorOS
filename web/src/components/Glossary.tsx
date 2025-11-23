
import React, { useState } from 'react';
import { X, BookOpen, Home, TreeDeciduous, Map as MapIcon } from 'lucide-react';
import { BiomeType, BuildingType, DoodadType } from '../services/realmsmith/types';

interface GlossaryProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Glossary: React.FC<GlossaryProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'buildings' | 'biomes' | 'environment'>('buildings');

    if (!isOpen) return null;

    const buildings = [
        { type: BuildingType.HOUSE_SMALL, name: 'Small House', desc: 'A modest residence for common folk.', color: 'bg-orange-100' },
        { type: BuildingType.HOUSE_LARGE, name: 'Large House', desc: 'A two-story home for wealthier merchants or large families.', color: 'bg-red-900' },
        { type: BuildingType.TAVERN, name: 'Tavern', desc: 'The social hub of the town, distinguished by its chimney and large footprint.', color: 'bg-yellow-500' },
        { type: BuildingType.BLACKSMITH, name: 'Blacksmith', desc: 'An industrial workshop with a dark slate roof, essential for tools and weapons.', color: 'bg-slate-600' },
        { type: BuildingType.MARKET_STALL, name: 'Market Stall', desc: 'Temporary wooden structures set up for trade.', color: 'bg-amber-200' },
        { type: BuildingType.CHURCH, name: 'Church', desc: 'A stone place of worship featuring blue stained-glass windows.', color: 'bg-slate-300' },
        { type: BuildingType.TOWER, name: 'Tower', desc: 'A fortified stone structure with a conical roof, used for defense or by wizards.', color: 'bg-gray-500' },
        { type: BuildingType.MANOR, name: 'Manor', desc: 'A sprawling estate with a green roof, housing the local nobility.', color: 'bg-emerald-100' },
        { type: BuildingType.FARM_HOUSE, name: 'Farm House', desc: 'A rural dwelling found on the outskirts, often near crops.', color: 'bg-amber-50' },
    ];

    const biomes = Object.values(BiomeType).map(b => ({
        name: b.replace(/_/g, ' '),
        id: b
    }));

    const environment = [
        { name: 'Oak Tree', desc: 'Standard deciduous tree found in temperate climates.' },
        { name: 'Pine Tree', desc: 'Evergreen tree common in colder or mountainous regions.' },
        { name: 'Palm Tree', desc: 'Tropical tree found in deserts, oases, and jungles.' },
        { name: 'Dead Tree', desc: 'Withered remains of trees found in harsh environments.' },
        { name: 'Cactus', desc: 'Succulent plant native to arid deserts.' },
        { name: 'Mushroom', desc: 'Giant fungi found in magical forests.' },
        { name: 'Crystal', desc: 'Glowing formations found in wastes and magical areas.' },
        { name: 'Crops', desc: 'Wheat, Corn, and Pumpkins cultivated on farmland.' },
        { name: 'Bush', desc: 'Small shrubbery providing ground cover.' },
        { name: 'Rock', desc: 'Natural stone formations and boulders.' },
        { name: 'Well', desc: 'A central water source often found in town plazas.' },
        { name: 'Street Lamp', desc: 'Gas-lit iron lamps that automatically illuminate at night.' },
        { name: 'Stump', desc: 'Remains of a felled tree.' },
    ];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 w-full max-w-3xl rounded-xl shadow-2xl border border-gray-700 flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900/50 rounded-t-xl">
                    <div className="flex items-center gap-2 text-yellow-500">
                        <BookOpen size={24} />
                        <h2 className="text-xl font-serif font-bold text-white">Town Codex</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('buildings')}
                        className={`flex-1 py-3 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'buildings'
                                ? 'bg-gray-800 text-yellow-500 border-b-2 border-yellow-500'
                                : 'bg-gray-800/50 text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                            }`}
                    >
                        <Home size={18} />
                        Architecture
                    </button>
                    <button
                        onClick={() => setActiveTab('biomes')}
                        className={`flex-1 py-3 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'biomes'
                                ? 'bg-gray-800 text-green-500 border-b-2 border-green-500'
                                : 'bg-gray-800/50 text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                            }`}
                    >
                        <MapIcon size={18} />
                        Biomes
                    </button>
                    <button
                        onClick={() => setActiveTab('environment')}
                        className={`flex-1 py-3 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'environment'
                                ? 'bg-gray-800 text-emerald-400 border-b-2 border-emerald-400'
                                : 'bg-gray-800/50 text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                            }`}
                    >
                        <TreeDeciduous size={18} />
                        Environment
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-gray-800/80">
                    {activeTab === 'buildings' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {buildings.map((b) => (
                                <div key={b.type} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 flex gap-4 items-start">
                                    <div className={`w-12 h-12 rounded shadow-inner shrink-0 ${b.color} opacity-80 border border-white/10`}></div>
                                    <div>
                                        <h3 className="font-serif font-bold text-gray-200">{b.name}</h3>
                                        <p className="text-sm text-gray-400 mt-1">{b.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'biomes' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {biomes.map((b) => (
                                <div key={b.id} className="bg-gray-700/30 p-3 rounded border border-gray-600 text-center hover:bg-gray-700 transition-colors">
                                    <span className="text-sm font-medium text-gray-300 capitalize">{b.name}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'environment' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {environment.map((n) => (
                                <div key={n.name} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                                    <h3 className="font-serif font-bold text-emerald-400">{n.name}</h3>
                                    <p className="text-sm text-gray-400 mt-1">{n.desc}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
