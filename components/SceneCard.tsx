import React, { useState } from 'react';
import type { ReelPackage } from '../types';
import { CopyIcon, CheckIcon, LoaderIcon, RefreshIcon, TextIcon } from './IconComponents';

type Scene = ReelPackage['scenes'][0];

interface SceneCardProps {
    scene: Scene;
    onGenerateScene: () => Promise<void>;
    onImageClick: (imageUrl: string, textOverlay?: string) => void;
    onRegenerateImage: () => Promise<void>;
}

const SceneCard: React.FC<SceneCardProps> = ({ scene, onGenerateScene, onImageClick, onRegenerateImage }) => {
    const [copied, setCopied] = useState(false);
    const [showOverlay, setShowOverlay] = useState(true);

    const handleCopy = () => {
        if (scene.actionPrompt) {
            navigator.clipboard.writeText(JSON.stringify(scene.actionPrompt, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-cyan-500/50">
            <div className="relative aspect-video bg-gray-700 flex items-center justify-center group">
                {scene.isLoading && (
                     <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-20">
                        <LoaderIcon className="w-8 h-8 text-cyan-400" />
                        <p className="mt-2 text-sm text-gray-300">Generating Scene...</p>
                    </div>
                )}
                {scene.imageUrl ? (
                     <div 
                        className="w-full h-full"
                    >
                        <img 
                            src={scene.imageUrl} 
                            alt={`Scene ${scene.sceneNumber}`} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                            onClick={() => onImageClick(scene.imageUrl!, scene.textOverlay)}
                        />
                         {scene.textOverlay && showOverlay && (
                            <div className="absolute inset-0 flex items-center justify-center p-4 bg-black bg-opacity-40 pointer-events-none transition-opacity duration-300">
                                <p className="text-white text-center text-xl font-bold drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                                    {scene.textOverlay}
                                </p>
                            </div>
                        )}
                        <div 
                            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center cursor-pointer"
                            onClick={() => onImageClick(scene.imageUrl!, scene.textOverlay)}
                        >
                            <p className="text-white text-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity">View Image</p>
                        </div>
                        {!scene.isLoading && (
                            <div className="absolute top-2 right-2 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRegenerateImage();
                                    }}
                                    className="bg-gray-800/60 hover:bg-cyan-600 text-white p-2 rounded-full transition-all backdrop-blur-sm"
                                    title="Regenerate Image"
                                >
                                    <RefreshIcon className="w-5 h-5" />
                                </button>
                                {scene.textOverlay && (
                                     <button
                                        onClick={(e) => { e.stopPropagation(); setShowOverlay(!showOverlay); }}
                                        className={`bg-gray-800/60 hover:bg-purple-600 text-white p-2 rounded-full transition-all backdrop-blur-sm ${!showOverlay ? 'bg-purple-700' : ''}`}
                                        title={showOverlay ? "Hide Text Overlay" : "Show Text Overlay"}
                                    >
                                        <TextIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-gray-400">Image Placeholder</div>
                )}
                 {!scene.imageUrl && !scene.isLoading && (
                    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
                        <button
                            onClick={onGenerateScene}
                            className="bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-600 transition-colors"
                        >
                            Generate Scene
                        </button>
                    </div>
                 )}
            </div>
            <div className="p-4">
                <h3 className="font-bold text-lg text-cyan-300 mb-2">Scene {scene.sceneNumber}</h3>
                <div className="space-y-3">
                    <div>
                        <p className="font-semibold text-gray-300 text-sm uppercase tracking-wider">Visual</p>
                        <p className="text-gray-400 text-sm">{scene.description}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-300 text-sm uppercase tracking-wider">Dialogue</p>
                        <p className="text-gray-400 text-sm italic">"{scene.dialogue}"</p>
                    </div>
                </div>
                {scene.actionPrompt && (
                    <div className="mt-4">
                         <div className="flex justify-between items-center mb-1">
                            <p className="font-semibold text-gray-300 text-sm uppercase tracking-wider">Action Prompt</p>
                            <button onClick={handleCopy} className="text-gray-400 hover:text-white transition-colors flex items-center text-xs">
                                {copied ? <CheckIcon className="w-4 h-4 mr-1 text-green-400" /> : <CopyIcon className="w-4 h-4 mr-1" />}
                                {copied ? 'Copied!' : 'Copy JSON'}
                            </button>
                         </div>
                        <pre className="bg-gray-900 rounded-md p-2 text-xs text-cyan-200 overflow-x-auto max-h-40">
                            <code>{JSON.stringify(scene.actionPrompt, null, 2)}</code>
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SceneCard;
