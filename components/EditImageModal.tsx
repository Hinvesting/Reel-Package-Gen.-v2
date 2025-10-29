import React, { useState, useEffect } from 'react';
import { CloseIcon, LoaderIcon } from './IconComponents';

interface EditImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (prompt: string) => Promise<void>;
    currentImageUrl: string;
    isLoading: boolean;
    error: string | null;
}

const EditImageModal: React.FC<EditImageModalProps> = ({ isOpen, onClose, onSubmit, currentImageUrl, isLoading, error }) => {
    const [prompt, setPrompt] = useState('');

    useEffect(() => {
        if (isOpen) {
            setPrompt(''); // Reset prompt when modal opens
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim()) {
            onSubmit(prompt);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl border border-gray-700 flex flex-col md:flex-row gap-6" onClick={(e) => e.stopPropagation()}>
                <div className="w-full md:w-1/2 flex-shrink-0">
                    <p className="text-sm font-medium text-gray-300 mb-2">Current Image</p>
                    <img src={currentImageUrl} alt="Image to edit" className="rounded-md w-full aspect-square object-cover" />
                </div>
                <div className="w-full md:w-1/2 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Edit Image</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="flex flex-col h-full">
                        <div className="flex-grow">
                            <label htmlFor="editPrompt" className="block text-sm font-medium text-gray-300 mb-2">
                                Describe your desired change
                            </label>
                            <textarea
                                id="editPrompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., add a futuristic city in the background"
                                rows={5}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                disabled={isLoading}
                            />
                             {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                        </div>
                        <div className="mt-4">
                            <button
                                type="submit"
                                disabled={isLoading || !prompt.trim()}
                                className="w-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <LoaderIcon className="w-5 h-5 mr-2" />
                                        Applying Edit...
                                    </>
                                ) : (
                                    'Apply Edit'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditImageModal;