import React, { useState, useCallback } from 'react';
import type { ContentFormat, ReelPackage } from './types';
import { generateScript, generateImage, generateActionPrompt, parseScript, editImage } from './services/geminiService';
import SceneCard from './components/SceneCard';
import CharacterCard from './components/CharacterCard';
import EditImageModal from './components/EditImageModal';
import { LoaderIcon, SparklesIcon, DownloadIcon, CloseIcon, SettingsIcon, TextIcon, TrashIcon, RefreshIcon, UserIcon, EditIcon } from './components/IconComponents';

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
  sceneCount: number;
  onSceneCountChange: (count: number) => void;
  defaultTone: string;
  onDefaultToneChange: (tone: string) => void;
  onRestart: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, aspectRatio, onAspectRatioChange, sceneCount, onSceneCountChange, defaultTone, onDefaultToneChange, onRestart }) => {
    if (!isOpen) return null;
    const commonTones = ['Cinematic', 'Humorous', 'Inspirational', 'Educational', 'Dramatic', 'Upbeat'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md border border-gray-700" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Settings</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="space-y-6">
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
                     <div>
                        <label htmlFor="sceneCount" className="block text-sm font-medium text-gray-300 mb-2">Default Scene Count</label>
                        <input
                            type="number"
                            id="sceneCount"
                            value={sceneCount}
                            onChange={(e) => onSceneCountChange(parseInt(e.target.value, 10) || 1)}
                            min="1"
                            max="30"
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <p className="text-xs text-gray-400 mt-2">Applies when generating a new script from a topic.</p>
                    </div>
                    <div>
                        <label htmlFor="defaultTone" className="block text-sm font-medium text-gray-300 mb-2">Default Tone</label>
                        <input
                            type="text"
                            id="defaultTone"
                            value={defaultTone}
                            onChange={(e) => onDefaultToneChange(e.target.value)}
                            placeholder="e.g., Dark and Gritty"
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <p className="text-xs text-gray-400 mt-2">Leave empty to let the AI determine the tone from the topic.</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                           {commonTones.map(tone => (
                               <button 
                                key={tone}
                                onClick={() => onDefaultToneChange(tone)}
                                className={`px-3 py-1 text-xs rounded-full transition-colors ${defaultTone === tone ? 'bg-cyan-500 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'}`}
                               >
                                {tone}
                               </button>
                           ))}
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex justify-between items-center">
                   <button
                        onClick={onRestart}
                        className="flex items-center gap-2 bg-red-800/80 text-red-200 font-bold py-2 px-4 rounded-lg hover:bg-red-700 hover:text-white transition-colors"
                        title="Clear all content and start over"
                   >
                        <TrashIcon className="w-5 h-5" />
                        <span>Restart & Clear</span>
                   </button>
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

interface Character {
  name: string;
  imageUrl?: string;
  isLoading: boolean;
}

const App: React.FC = () => {
    const [topic, setTopic] = useState<string>('');
    const [format, setFormat] = useState<ContentFormat>('reel');
    const [contentSource, setContentSource] = useState<'topic' | 'script'>('topic');
    const [userScript, setUserScript] = useState<string>('');
    const [characterDescriptions, setCharacterDescriptions] = useState<string>('');
    const [scriptFormat, setScriptFormat] = useState<'scene-by-scene' | 'youtube-short' | 'user-material'>('scene-by-scene');
    const [reelPackage, setReelPackage] = useState<ReelPackage | null>(null);
    const [characters, setCharacters] = useState<Character[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isThumbnailLoading, setIsThumbnailLoading] = useState<boolean>(false);
    const [isZipping, setIsZipping] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [modalImage, setModalImage] = useState<{url: string, name: string, textOverlay?: string} | null>(null);
    const [aspectRatio, setAspectRatio] = useState<string>('16:9');
    const [sceneCount, setSceneCount] = useState<number>(7);
    const [defaultTone, setDefaultTone] = useState<string>('');
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [editingImageInfo, setEditingImageInfo] = useState<{
        type: 'thumbnail' | 'scene' | 'character';
        index: number; // Use -1 for thumbnail
        imageUrl: string;
    } | null>(null);


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
        setCharacters(null);

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
                scriptData = await generateScript(topic, format, sceneCount, defaultTone);
            } else { // contentSource === 'script'
                if (!userScript.trim()) {
                    setError('Please paste your script.');
                    setIsLoading(false);
                    return;
                }
                scriptData = await parseScript(userScript, scriptFormat, format, characterDescriptions);
                videoTopic = scriptData.title;
                if (scriptData.characters && scriptData.characters.length > 0) {
                    setCharacters(scriptData.characters.map(name => ({ name, isLoading: false })));
                }
            }
            
            let thumbnailPrompt = `A visually stunning and click-worthy thumbnail for a video titled "${scriptData.title}" on the topic of "${videoTopic}". High resolution, cinematic quality.`;

            if (scriptData.scenes && scriptData.scenes.length > 0) {
                const firstSceneDescription = scriptData.scenes[0].description;
                thumbnailPrompt = `Create a visually stunning, click-worthy YouTube thumbnail for a video titled "${scriptData.title}". The thumbnail must feature the main character and setting from this scene description: "${firstSceneDescription}". It must be high resolution with a cinematic quality. The overall mood should reflect the video's topic: "${videoTopic}".`;
            }

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

    const getGenReferenceImages = useCallback((sceneIndex: number): string[] => {
        const refs: string[] = [];
        if (characters) {
            characters.forEach(c => c.imageUrl && refs.push(c.imageUrl));
        }
        if (reelPackage) {
            refs.push(reelPackage.thumbnail.imageUrl);
            for (let i = 0; i < sceneIndex; i++) {
                if (reelPackage.scenes[i].imageUrl) {
                    refs.push(reelPackage.scenes[i].imageUrl!);
                }
            }
        }
        return [...new Set(refs)];
    }, [characters, reelPackage]);

    const getRegenReferenceImages = useCallback((sceneIndexToExclude: number): string[] => {
        const refs: string[] = [];
        if (characters) {
            characters.forEach(c => c.imageUrl && refs.push(c.imageUrl));
        }
        if (reelPackage) {
            refs.push(reelPackage.thumbnail.imageUrl);
            reelPackage.scenes.forEach((scene, i) => {
                if (i !== sceneIndexToExclude && scene.imageUrl) {
                    refs.push(scene.imageUrl);
                }
            });
        }
        return [...new Set(refs)];
    }, [characters, reelPackage]);
    
    const handleRegenerateThumbnail = async () => {
        if (!reelPackage) return;

        setIsThumbnailLoading(true);
        setError(null);

        try {
            const { title } = reelPackage.thumbnail;
            const { topic, scenes } = reelPackage;

            let thumbnailPrompt = `A visually stunning and click-worthy thumbnail for a video titled "${title}" on the topic of "${topic}". High resolution, cinematic quality.`;
            if (scenes && scenes.length > 0) {
                const firstSceneDescription = scenes[0].description;
                thumbnailPrompt = `Create a visually stunning, click-worthy YouTube thumbnail for a video titled "${title}". The thumbnail must feature the main character and setting from this scene description: "${firstSceneDescription}". It must be high resolution with a cinematic quality. The overall mood should reflect the video's topic: "${topic}".`;
            }

            const referenceImages = getRegenReferenceImages(-1);
            const newImageUrl = await generateImage(thumbnailPrompt, aspectRatio, referenceImages);

            setReelPackage(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    thumbnail: {
                        ...prev.thumbnail,
                        imageUrl: newImageUrl,
                    },
                };
            });
        } catch (e) {
            const err = e as Error;
            console.error("Error regenerating thumbnail:", err);
            setError("Failed to regenerate thumbnail. Please try again.");
        } finally {
            setIsThumbnailLoading(false);
        }
    };

    const extractCharacterDescription = (characterName: string, descriptionsText: string): string | null => {
        if (!descriptionsText.trim()) {
            return null;
        }
        const characterBlocks = descriptionsText.split(/\n\s*\n/);
        for (const block of characterBlocks) {
            const nameMatch = block.match(/^(?:\*\s*)?Name:\s*(.+)$/im);
            if (nameMatch && nameMatch[1].trim().toLowerCase() === characterName.trim().toLowerCase()) {
                return block.trim();
            }
        }
        return null;
    };

    const handleGenerateCharacterImage = useCallback(async (characterIndex: number) => {
        if (!characters) return;
        
        setCharacters(prev => {
            if (!prev) return null;
            const newCharacters = [...prev];
            newCharacters[characterIndex] = { ...newCharacters[characterIndex], isLoading: true };
            return newCharacters;
        });

        try {
            const characterToGenerate = characters[characterIndex];
            const description = extractCharacterDescription(characterToGenerate.name, characterDescriptions);

            let prompt = `Cinematic portrait of ${characterToGenerate.name}. Consistent character design for a video series.`;
            if (description) {
                prompt = `Generate a cinematic portrait of a character based on the following detailed description. Ensure the portrait accurately reflects all the specified physical attributes, style, and mood.
                
                Description:
                ---
                ${description}
                ---
                
                The final image should be a high-quality, realistic or semi-realistic portrait suitable for a video series, with a 1:1 aspect ratio.`;
            }

            const charImage = await generateImage(prompt, '1:1');

            setCharacters(prev => {
                if (!prev) return null;
                const newCharacters = [...prev];
                newCharacters[characterIndex] = {
                    ...newCharacters[characterIndex],
                    imageUrl: charImage,
                    isLoading: false
                };
                return newCharacters;
            });

        } catch (e) {
            const err = e as Error;
            console.error(err);
            setError(`Failed to generate image for ${characters[characterIndex].name}. Please try again.`);
            setCharacters(prev => {
                if (!prev) return null;
                const newCharacters = [...prev];
                newCharacters[characterIndex] = { ...newCharacters[characterIndex], isLoading: false };
                return newCharacters;
            });
        }
    }, [characters, characterDescriptions]);
    
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
            const referenceImages = getGenReferenceImages(sceneIndex);
            
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
    }, [reelPackage, aspectRatio, getGenReferenceImages]);
    
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
            const referenceImages = getRegenReferenceImages(sceneIndex);
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
    }, [reelPackage, aspectRatio, getRegenReferenceImages]);

    const handleOpenEditModal = (type: 'thumbnail' | 'scene' | 'character', index: number, imageUrl: string) => {
        setEditingImageInfo({ type, index, imageUrl });
    };

    const handleCloseEditModal = () => {
        setEditingImageInfo(null);
        setIsEditing(false); // Reset loading state
        setEditError(null); // Reset error state
    };

    const handleApplyEdit = async (prompt: string) => {
        if (!editingImageInfo || !prompt.trim()) return;

        setIsEditing(true);
        setEditError(null);

        try {
            const newImageUrl = await editImage(editingImageInfo.imageUrl, prompt);
            const { type, index } = editingImageInfo;

            if (type === 'thumbnail') {
                setReelPackage(prev => prev ? { ...prev, thumbnail: { ...prev.thumbnail, imageUrl: newImageUrl } } : null);
            } else if (type === 'character') {
                setCharacters(prev => {
                    if (!prev) return null;
                    const newChars = [...prev];
                    newChars[index] = { ...newChars[index], imageUrl: newImageUrl };
                    return newChars;
                });
            } else if (type === 'scene' && reelPackage) {
                const sceneToUpdate = reelPackage.scenes[index];
                // Regenerate action prompt with the new image
                const newActionPrompt = await generateActionPrompt(
                    reelPackage.topic,
                    reelPackage.format,
                    sceneToUpdate.description,
                    sceneToUpdate.dialogue,
                    newImageUrl
                );
                
                setReelPackage(prev => {
                    if (!prev) return null;
                    const newScenes = [...prev.scenes];
                    newScenes[index] = { ...newScenes[index], imageUrl: newImageUrl, actionPrompt: newActionPrompt };
                    return { ...prev, scenes: newScenes };
                });
            }

            handleCloseEditModal();
        } catch (e) {
            const err = e as Error;
            console.error("Error editing image:", err);
            setEditError(err.message || "Failed to edit image. Please try again.");
        } finally {
            setIsEditing(false);
        }
    };

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
            
            if (characters && characters.length > 0) {
                const charactersFolder = zip.folder("characters");
                if (charactersFolder) {
                    for (const char of characters) {
                        if (char.imageUrl) {
                            const charBlob = dataURLtoBlob(char.imageUrl);
                            if (charBlob) {
                                const safeName = char.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                                charactersFolder.file(`${safeName}.png`, charBlob);
                            }
                        }
                    }
                }
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
                    if (scene.actionPrompt) {
                        const promptJson = JSON.stringify(scene.actionPrompt, null, 2);
                        scenesFolder.file(`scene_${scene.sceneNumber}_prompt.json`, promptJson);
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
        setCharacters(null);
        setTopic('');
        setUserScript('');
        setCharacterDescriptions('');
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRestart = () => {
        handleClearContent();
        setIsSettingsOpen(false);
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
                                    <div>
                                        <label htmlFor="characterDescriptions" className="block text-sm font-medium text-gray-300 mb-1">Character Descriptions (Optional)</label>
                                        <textarea
                                            id="characterDescriptions"
                                            value={characterDescriptions}
                                            onChange={(e) => setCharacterDescriptions(e.target.value)}
                                            placeholder="Paste character descriptions here to guide image generation..."
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
                                onClick={() => !isThumbnailLoading && openModal(reelPackage.thumbnail.imageUrl, `${reelPackage.topic}-thumbnail.png`.replace(/\s+/g, '_'))}
                             >
                                {isThumbnailLoading && (
                                     <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-20">
                                        <LoaderIcon className="w-10 h-10 text-cyan-400" />
                                        <p className="mt-2 text-gray-200">Regenerating Thumbnail...</p>
                                    </div>
                                )}
                                <img src={reelPackage.thumbnail.imageUrl} alt="Generated Thumbnail" className="w-full transition-transform duration-300 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                                    <p className="text-white text-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity">View Image</p>
                                </div>
                                {!isThumbnailLoading && (
                                    <div className="absolute top-2 right-2 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenEditModal('thumbnail', -1, reelPackage.thumbnail.imageUrl);
                                            }}
                                            className="bg-gray-800/60 hover:bg-pink-600 text-white p-2 rounded-full transition-all backdrop-blur-sm"
                                            title="Edit Image"
                                        >
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRegenerateThumbnail();
                                            }}
                                            disabled={isThumbnailLoading}
                                            className="bg-gray-800/60 hover:bg-cyan-600 text-white p-2 rounded-full transition-all backdrop-blur-sm disabled:opacity-50"
                                            title="Regenerate Thumbnail"
                                        >
                                            <RefreshIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                             </div>
                        </div>

                        {characters && characters.length > 0 && (
                            <div className="mt-12">
                                <h3 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2">
                                    <UserIcon className="w-7 h-7" />
                                    Characters
                                </h3>
                                <div className="flex flex-wrap justify-center -m-2 max-w-5xl mx-auto">
                                    {characters.map((character, index) => (
                                        <div key={index} className="w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 p-2">
                                            <CharacterCard 
                                                character={character}
                                                onGenerateImage={() => handleGenerateCharacterImage(index)}
                                                onRegenerateImage={() => handleGenerateCharacterImage(index)}
                                                onImageClick={(imageUrl) => openModal(imageUrl, `${character.name}.png`.replace(/\s+/g, '_'))}
                                                onOpenEditModal={(imageUrl) => handleOpenEditModal('character', index, imageUrl)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

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
                                        onOpenEditModal={(imageUrl) => handleOpenEditModal('scene', index, imageUrl)}
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
            {editingImageInfo && (
                <EditImageModal
                    isOpen={!!editingImageInfo}
                    onClose={handleCloseEditModal}
                    onSubmit={handleApplyEdit}
                    currentImageUrl={editingImageInfo.imageUrl}
                    isLoading={isEditing}
                    error={editError}
                />
            )}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                aspectRatio={aspectRatio}
                onAspectRatioChange={setAspectRatio}
                sceneCount={sceneCount}
                onSceneCountChange={setSceneCount}
                defaultTone={defaultTone}
                onDefaultToneChange={setDefaultTone}
                onRestart={handleRestart}
            />
        </div>
    );
};

export default App;