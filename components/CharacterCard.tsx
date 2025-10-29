import React from 'react';
import { LoaderIcon, RefreshIcon, EditIcon } from './IconComponents';

interface Character {
    name: string;
    imageUrl?: string;
    isLoading: boolean;
}

interface CharacterCardProps {
    character: Character;
    onGenerateImage: () => Promise<void>;
    onRegenerateImage: () => Promise<void>;
    onImageClick: (imageUrl: string) => void;
    onOpenEditModal: (imageUrl: string) => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character, onGenerateImage, onRegenerateImage, onImageClick, onOpenEditModal }) => {
    return (
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-purple-500/50">
            <div className="relative aspect-square bg-gray-700 flex items-center justify-center group">
                {character.isLoading && (
                     <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-20">
                        <LoaderIcon className="w-8 h-8 text-purple-400" />
                        <p className="mt-2 text-sm text-gray-300">Generating...</p>
                    </div>
                )}
                {character.imageUrl ? (
                     <div 
                        className="w-full h-full"
                    >
                        <img 
                            src={character.imageUrl} 
                            alt={character.name} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                            onClick={() => onImageClick(character.imageUrl!)}
                        />
                        <div 
                            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center cursor-pointer"
                            onClick={() => onImageClick(character.imageUrl!)}
                        >
                            <p className="text-white text-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity">View Image</p>
                        </div>
                        {!character.isLoading && (
                            <div className="absolute top-2 right-2 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenEditModal(character.imageUrl!);
                                    }}
                                    className="bg-gray-800/60 hover:bg-pink-600 text-white p-2 rounded-full transition-all backdrop-blur-sm"
                                    title="Edit Image"
                                >
                                    <EditIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRegenerateImage();
                                    }}
                                    className="bg-gray-800/60 hover:bg-purple-600 text-white p-2 rounded-full transition-all backdrop-blur-sm"
                                    title="Regenerate Image"
                                >
                                    <RefreshIcon className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-gray-400">Character Portrait</div>
                )}
                 {!character.imageUrl && !character.isLoading && (
                    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
                        <button
                            onClick={onGenerateImage}
                            className="bg-purple-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors"
                        >
                            Generate Image
                        </button>
                    </div>
                 )}
            </div>
            <div className="p-4">
                <h3 className="font-bold text-lg text-purple-300 mb-2 text-center">{character.name}</h3>
            </div>
        </div>
    );
};

export default CharacterCard;