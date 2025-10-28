import React, { useState, useCallback } from 'react';
import type { ContentFormat, ReelPackage } from './types';
import { generateScript, generateImage, generateActionPrompt, parseScript } from './services/geminiService';
import SceneCard from './components/SceneCard';
import { LoaderIcon, SparklesIcon, DownloadIcon, CloseIcon, SettingsIcon, TextIcon, TrashIcon } from './components/IconComponents';

// --- ImageModal Component ---
interface ImageModalProps {
  imageUrl: string;
  imageName: string;
  textOverlay?: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, imageName, textOverlay, onClose }) => {
  if (!imageUrl) return null;
  const [showOverlay, setShowOverlay] = useState(true);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageName || 'generated-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
        onClick={onClose}
    >
        <div 
            className="relative bg-gray-800 p-2 md:p-4 rounded-lg shadow-2xl max-w-4xl w-[95%] max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="relative w-full h-full flex-grow">
                 <img src={imageUrl} alt="Enlarged view" className="object-contain w-full h-full flex-grow rounded" />
                 {textOverlay && showOverlay && (
                    <div className="absolute inset-0 flex items-center justify-center p-8 bg-black bg-opacity-30 pointer-events-none">
                        <p className="text-white text-center text-3xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                            {textOverlay}
                        </p>
                    </div>
                )}
            </div>
            <div className="absolute top-2 right-2 md:top-4 md:right-4 flex flex-col md:flex-row-reverse items-center gap-2">
                 <button
                    onClick={onClose}
                    className="bg-gray-700/80 hover:bg-red-500 text-white font-bold p-2 rounded-full transition-colors backdrop-blur-sm"
                    title="Close"
                >
                    <CloseIcon className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <button
                    onClick={handleDownload}
                    className="bg-gray-700/80 hover:bg-cyan-500 text-white font-bold p-2 rounded-full transition-colors backdrop-blur-sm"
                    title="Download Image"
                >
                   <DownloadIcon className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                {textOverlay && (
                    <button
                        onClick={() => setShowOverlay(!showOverlay)}
                        className={`bg-gray-700/80 hover:bg-purple-500 text-white font-bold p-2 rounded-full transition-colors backdrop-blur-sm ${!showOverlay ? 'bg-purple-600' : ''}`}
                        title={showOverlay ? "Hide Text Overlay" : "Show Text Overlay"}
                    >
                        <TextIcon className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

// --- SettingsModal Component ---
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, aspectRatio, onAspectRatioChange }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md border border-gray-700" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Settings</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div>
                    <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-300 mb-2">Image Aspect Ratio</label>
                    <select
                        id="aspectRatio"
                        value={aspectRatio}
                        onChange={(e) => onAspectRatioChange(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                        <option value="16:9">16:9 (Landscape)</option>
                        <option value="9:16">9:16 (Portrait)</option>
                        <option value="1:1">1:1 (Square)</option>
                        <option value="4:3">4:3 (Classic)</option>
                        <option value="3:4">3:4 (Tall)</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-2">This will affect all generated images, including the thumbnail and scenes.</p>
                </div>
                <div className="mt-6 text-right">
                   <button
                      onClick={onClose}
                      className="bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-600 transition-colors"
                   >
                     Done
                   </button>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const [topic, setTopic] = useState<string>('');
    const [format, setFormat] = useState<ContentFormat>('reel');
    const [contentSource, setContentSource] = useState<'topic' | 'script'>('topic');
    const [userScript, setUserScript] = useState<string>('');
    const [scriptFormat, setScriptFormat] = useState<'scene-by-scene' | 'youtube-short' | 'user-material'>('scene-by-scene');
    const [reelPackage, setReelPackage] = useState<ReelPackage | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isZipping, setIsZipping] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [modalImage, setModalImage] = useState<{url: string, name: string, textOverlay?: string} | null>(null);
    const [aspectRatio, setAspectRatio] = useState<string>('16:9');
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

    const openModal = (url: string, name: string, textOverlay?: string) => {
        setModalImage({ url, name, textOverlay });
    };

    const closeModal = () => {
        setModalImage(null);
    };

    const handleGenerateScriptAndThumbnail = async () => {
        setIsLoading(true);
        setError(null);
        setReelPackage(null);

        try {
            let scriptData;
            let videoTopic;

            if (contentSource === 'topic') {
                if (!topic.trim()) {
                    setError('Please enter a content topic.');
                    setIsLoading(false);
                    return;
                }
                videoTopic = topic;
                scriptData = await generateScript(topic, format);
            } else { // contentSource === 'script'
                if (!userScript.trim()) {
                    setError('Please paste your script.');
                    setIsLoading(false);
                    return;
                }
                scriptData = await parseScript(userScript, scriptFormat, format);
                videoTopic = scriptData.title;
            }
            
            const thumbnailPrompt = `A visually stunning and click-worthy thumbnail for a video titled "${scriptData.title}" on the topic of "${videoTopic}". High resolution, cinematic quality.`;
            const imageUrl = await generateImage(thumbnailPrompt, aspectRatio);

            const newPackage: ReelPackage = {
                topic: videoTopic,
                format,
                thumbnail: {
                    title: scriptData.title,
                    imageUrl,
                },
                scenes: scriptData.scenes.map((scene, index) => ({
                    ...scene,
                    sceneNumber: index + 1,
                    isLoading: false,
                })),
            };
            setReelPackage(newPackage);
        } catch (e) {
            const err = e as Error;
            console.error(err);
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateScene = useCallback(async (sceneIndex: number) => {
        if (!reelPackage) return;
        
        setReelPackage(prev => {
            if (!prev) return null;
            const newScenes = [...prev.scenes];
            newScenes[sceneIndex] = { ...newScenes[sceneIndex], isLoading: true };
            return { ...prev, scenes: newScenes };
        });

        try {
            const sceneToGenerate = reelPackage.scenes[sceneIndex];
            const referenceImages: string[] = [reelPackage.thumbnail.imageUrl];
            for (let i = 0; i < sceneIndex; i++) {
                if (reelPackage.scenes[i].imageUrl) {
                    referenceImages.push(reelPackage.scenes[i].imageUrl!);
                }
            }
            
            const sceneImage = await generateImage(sceneToGenerate.description, aspectRatio, referenceImages);
            const actionPrompt = await generateActionPrompt(
                reelPackage.topic,
                reelPackage.format,
                sceneToGenerate.description,
                sceneToGenerate.dialogue,
                sceneImage
            );

            setReelPackage(prev => {
                if (!prev) return null;
                const newScenes = [...prev.scenes];
                newScenes[sceneIndex] = {
                    ...newScenes[sceneIndex],
                    imageUrl: sceneImage,
                    actionPrompt: actionPrompt,
                    isLoading: false
                };
                return { ...prev, scenes: newScenes };
            });

        } catch (e) {
            const err = e as Error;
            console.error(err);
            setError(`Failed to generate content for Scene ${sceneIndex + 1}. Please try again.`);
            setReelPackage(prev => {
                if (!prev) return null;
                const newScenes = [...prev.scenes];
                newScenes[sceneIndex] = { ...newScenes[sceneIndex], isLoading: false };
                return { ...prev, scenes: newScenes };
            });
        }
    }, [reelPackage, aspectRatio]);
    
    const handleRegenerateSceneImage = useCallback(async (sceneIndex: number) => {
        if (!reelPackage) return;
        
        setReelPackage(prev => {
            if (!prev) return null;
            const newScenes = [...prev.scenes];
            newScenes[sceneIndex] = { ...newScenes[sceneIndex], isLoading: true };
            return { ...prev, scenes: newScenes };
        });

        try {
            const sceneToRegenerate = reelPackage.scenes[sceneIndex];
            
            const referenceImages: string[] = [reelPackage.thumbnail.imageUrl];
            reelPackage.scenes.forEach((scene, i) => {
                if (i !== sceneIndex && scene.imageUrl) {
                    referenceImages.push(scene.imageUrl);
                }
            });

            const sceneImage = await generateImage(sceneToRegenerate.description, aspectRatio, referenceImages);
            const actionPrompt = await generateActionPrompt(
                reelPackage.topic,
                reelPackage.format,
                sceneToRegenerate.description,
                sceneToRegenerate.dialogue,
                sceneImage
            );

            setReelPackage(prev => {
                if (!prev) return null;
                const newScenes = [...prev.scenes];
                newScenes[sceneIndex] = {
                    ...newScenes[sceneIndex],
                    imageUrl: sceneImage,
                    actionPrompt: actionPrompt,
                    isLoading: false
                };
                return { ...prev, scenes: newScenes };
            });

        } catch (e) {
            const err = e as Error;
            console.error(err);
            setError(`Failed to regenerate image for Scene ${sceneIndex + 1}. Please try again.`);
            setReelPackage(prev => {
                if (!prev) return null;
                const newScenes = [...prev.scenes];
                newScenes[sceneIndex] = { ...newScenes[sceneIndex], isLoading: false };
                return { ...prev, scenes: newScenes };
            });
        }
    }, [reelPackage, aspectRatio]);

    const dataURLtoBlob = (dataurl: string): Blob | null => {
        const arr = dataurl.split(',');
        if (arr.length < 2) return null;
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch) return null;
        const mime = mimeMatch[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    };

    const handleDownloadAll = async () => {
        if (!reelPackage) return;
        setIsZipping(true);
        setError(null);
        try {
            // @ts-ignore
            const zip = new window.JSZip();

            const thumbnailBlob = dataURLtoBlob(reelPackage.thumbnail.imageUrl);
            if (thumbnailBlob) {
                zip.file("thumbnail.png", thumbnailBlob);
            }

            const scenesFolder = zip.folder("scenes");
            if (scenesFolder) {
                for (const scene of reelPackage.scenes) {
                    if (scene.imageUrl) {
                        const sceneBlob = dataURLtoBlob(scene.imageUrl);
                        if (sceneBlob) {
                            scenesFolder.file(`scene_${scene.sceneNumber}.png`, sceneBlob);
                        }
                    }
                }
            }

            let scriptText = `Title: ${reelPackage.thumbnail.title}\n\n---\n\n`;
            reelPackage.scenes.forEach(scene => {
                scriptText += `Scene ${scene.sceneNumber}\n`;
                scriptText += `Visual: ${scene.description}\n`;
                scriptText += `Dialogue: "${scene.dialogue}"\n`;
                if (scene.textOverlay) {
                    scriptText += `Text Overlay: "${scene.textOverlay}"\n`;
                }
                scriptText += `\n---\n\n`;
            });
            zip.file("script.txt", scriptText);

            const content = await zip.generateAsync({ type: "blob" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(content);
            const safeTopic = reelPackage.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            link.download = `reel-package-${safeTopic}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (e) {
            console.error("Error creating zip file", e);
            setError("Could not create the zip file. Please try again.");
        } finally {
            setIsZipping(false);
        }
    };

    const handleClearContent = () => {
        setReelPackage(null);
        setTopic('');
        setUserScript('');
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const formatDescription = format === 'reel' 
        ? 'A 60-second reel with 7 scenes (approx. 8.5s each).'
        : 'A 5-10 minute video with 15-20 scenes (approx. 20-30s each).';
    
    const allScenesGenerated = reelPackage && reelPackage.scenes.every(scene => scene.imageUrl);

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans">
            <header className="bg-gray-800/50 backdrop-blur-sm p-4 border-b border-gray-700 sticky top-0 z-40">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <SparklesIcon className="w-8 h-8 text-cyan-400"/>
                        <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                            Reel Package Generator
                        </h1>
                    </div>
                     <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700"
                        title="Settings"
                    >
                        <SettingsIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-8">
                <div className="bg-gray-800 rounded-xl shadow-2xl p-6 mb-8 border border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                         <div className="w-full">
                            <label htmlFor="contentSource" className="block text-sm font-medium text-gray-300 mb-1">Content Source</label>
                            <select
                                id="contentSource"
                                value={contentSource}
                                onChange={(e) => setContentSource(e.target.value as 'topic' | 'script')}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="topic">Generate from Topic</option>
                                <option value="script">Use My Own Script</option>
                            </select>
                        </div>
                        <div className="w-full">
                            <label htmlFor="format" className="block text-sm font-medium text-gray-300 mb-1">Content Format</label>
                            <select
                                id="format"
                                value={format}
                                onChange={(e) => setFormat(e.target.value as ContentFormat)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="reel">60-second Reel</option>
                                <option value="long-form">5-10 Minute Video</option>
                            </select>
                            <p className="text-xs text-gray-400 mt-1">{formatDescription}</p>
                        </div>
                        <div className="w-full md:col-span-2">
                             {contentSource === 'topic' ? (
                                <div>
                                    <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-1">Content Topic</label>
                                    <input
                                        type="text"
                                        id="topic"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g., The Future of Renewable Energy"
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="scriptFormat" className="block text-sm font-medium text-gray-300 mb-1">Script Format</label>
                                        <select
                                            id="scriptFormat"
                                            value={scriptFormat}
                                            onChange={(e) => setScriptFormat(e.target.value as 'scene-by-scene' | 'youtube-short' | 'user-material')}
                                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        >
                                            <option value="scene-by-scene">Scene-by-Scene Script</option>
                                            <option value="youtube-short">YouTube Short Script</option>
                                            <option value="user-material">User's Material (Story/Prose)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="userScript" className="block text-sm font-medium text-gray-300 mb-1">Paste Your Script Here</label>
                                        <textarea
                                            id="userScript"
                                            value={userScript}
                                            onChange={(e) => setUserScript(e.target.value)}
                                            placeholder="Paste your script or story..."
                                            rows={10}
                                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-6">
                         <button
                            onClick={handleGenerateScriptAndThumbnail}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:from-cyan-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <LoaderIcon className="w-5 h-5 mr-2" />
                                     {contentSource === 'topic' ? 'Generating Script & Thumbnail...' : 'Processing Script & Generating Thumbnail...'}
                                </>
                            ) : (
                                'Generate Content Package'
                            )}
                        </button>
                    </div>
                </div>

                {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md mb-8">{error}</div>}

                {reelPackage && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-3xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
                                {reelPackage.thumbnail.title}
                            </h2>
                             <div 
                                className="max-w-2xl mx-auto rounded-lg overflow-hidden shadow-lg border border-cyan-500/30 cursor-pointer group relative"
                                onClick={() => openModal(reelPackage.thumbnail.imageUrl, `${reelPackage.topic}-thumbnail.png`.replace(/\s+/g, '_'))}
                             >
                                <img src={reelPackage.thumbnail.imageUrl} alt="Generated Thumbnail" className="w-full transition-transform duration-300 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                                    <p className="text-white text-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity">View Image</p>
                                </div>
                             </div>
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold mb-6 text-center">Scenes</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {reelPackage.scenes.map((scene, index) => (
                                    <SceneCard 
                                        key={scene.sceneNumber}
                                        scene={scene}
                                        onGenerateScene={() => handleGenerateScene(index)}
                                        onImageClick={(imageUrl, textOverlay) => openModal(imageUrl, `${reelPackage.topic}-scene-${scene.sceneNumber}.png`.replace(/\s+/g, '_'), textOverlay)}
                                        onRegenerateImage={() => handleRegenerateSceneImage(index)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
            {allScenesGenerated && (
                <div className="sticky bottom-0 mt-8 py-4 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 z-30">
                    <div className="container mx-auto flex items-center justify-center gap-4">
                        <button
                            onClick={handleDownloadAll}
                            disabled={isZipping}
                            className="flex items-center justify-center bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-cyan-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isZipping ? (
                                <>
                                    <LoaderIcon className="w-5 h-5 mr-2" />
                                    <span>Creating Zip...</span>
                                </>
                            ) : (
                                <>
                                    <DownloadIcon className="w-5 h-5 mr-2" />
                                    <span>Download All</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleClearContent}
                            className="flex items-center justify-center bg-gray-700 text-gray-300 font-bold py-3 px-6 rounded-lg hover:bg-red-800 hover:text-white transition-colors duration-300"
                        >
                            <TrashIcon className="w-5 h-5 mr-2" />
                            <span>Start Over</span>
                        </button>
                    </div>
                </div>
            )}
            {modalImage && (
                <ImageModal 
                    imageUrl={modalImage.url}
                    imageName={modalImage.name}
                    textOverlay={modalImage.textOverlay}
                    onClose={closeModal}
                />
            )}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                aspectRatio={aspectRatio}
                onAspectRatioChange={setAspectRatio}
            />
        </div>
    );
};

export default App;