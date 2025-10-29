import { GoogleGenAI, Modality } from "@google/genai";
import type { ContentFormat } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ScriptResponse {
    title: string;
    scenes: Array<{
        description: string;
        dialogue: string;
        textOverlay?: string;
    }>;
}

export interface ParsedScriptResponse extends ScriptResponse {
    characters?: string[];
}

export const generateScript = async (topic: string, format: ContentFormat, sceneCountValue: number | string, tone: string): Promise<ScriptResponse> => {
    const sceneCount = typeof sceneCountValue === 'number' ? `exactly ${sceneCountValue} scenes` : sceneCountValue;
    const videoType = format === 'reel' ? '60-second social media reel' : '5-10 minute YouTube video';
    const toneInstruction = tone.trim()
        ? `The script should have a ${tone.trim()} tone.`
        : 'The script should have a tone that is appropriate for the topic.';
    
    const prompt = `Generate a script for a ${videoType} on '${topic}'. Create ${sceneCount}. ${toneInstruction} For each scene, provide a visual description and spoken dialogue. When a scene's message can be enhanced by a text overlay, add a 'textOverlay' field with short, impactful text (max 10 words). If no text is needed, omit the 'textOverlay' field. Output MUST be valid JSON: { "title": "Catchy Title", "scenes": [{"description": "Visual description", "dialogue": "Spoken text", "textOverlay": "Optional text overlay"}, ...] }`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });
        
        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as ScriptResponse;
    } catch (error) {
        console.error("Error generating script:", error);
        throw new Error("Failed to generate script. The model might have returned an invalid JSON.");
    }
};

export const parseScript = async (
    userScript: string,
    scriptFormat: 'scene-by-scene' | 'youtube-short' | 'user-material',
    contentFormat: ContentFormat,
    characterDescriptions?: string
): Promise<ParsedScriptResponse> => {
    const videoType = contentFormat === 'reel' ? '60-second social media reel' : '5-10 minute YouTube video';

    let formatInstructions = '';
    switch (scriptFormat) {
        case 'scene-by-scene':
            formatInstructions = 'The script is in a scene-by-scene format. "🎙️ VO:" indicates dialogue/voice-over, and "🖼️ Visual:" indicates the visual description for each scene. Extract these into the JSON structure, creating one scene object for each scene in the script.';
            break;
        case 'youtube-short':
            formatInstructions = `The script is for a YouTube short. Extract the "Hook", "Main Point", and "Visual Prompt" to create a sequence of scenes. The dialogue should be derived from the main points. The "title" should be catchy and based on the hook. Generate a suitable number of scenes to represent the script for a ${videoType}.`;
            break;
        case 'user-material':
            formatInstructions = `This is a piece of prose/story. Break it down into a suitable number of scenes for a ${videoType}. The number of scenes should be determined by the content of the story, creating as many scenes as needed to represent the material effectively. For each scene, create a concise visual description and extract or summarize relevant text as dialogue. The "title" should be a catchy title based on the overall theme of the provided text.`;
            break;
    }

    const characterDescriptionInstructions = characterDescriptions?.trim()
    ? `
    The user has provided detailed character descriptions below. Use these descriptions to create rich and consistent visual descriptions for each scene. Ensure the appearance, attire, and mannerisms of the characters in the scenes align perfectly with their provided descriptions.

    CHARACTER DESCRIPTIONS:
    ---
    ${characterDescriptions}
    ---
    `
    : '';

    const prompt = `Analyze the following script and convert it into a structured JSON format for a ${videoType}.
${formatInstructions}
${characterDescriptionInstructions}
Also, scan the script for character declarations in the format 'Character: [Full Name]'. If found, extract the names and return them in a 'characters' array in the root of the JSON object. If no characters are declared this way, omit the 'characters' field.
For each scene you create, also consider if a text overlay would enhance the message. If so, add a 'textOverlay' field with short, impactful text (max 10 words). If no text is needed, omit this field.
The final output MUST be valid JSON with this exact structure: { "title": "Catchy Title", "scenes": [{"description": "Visual description", "dialogue": "Spoken text or voice-over", "textOverlay": "Optional text overlay"}, ...], "characters": ["Character Name 1", "Character Name 2"] }.

Here is the script:
---
${userScript}
---
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });
        
        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as ParsedScriptResponse;
    } catch (error) {
        console.error("Error parsing script:", error);
        throw new Error("Failed to parse script. The model might have returned an invalid JSON.");
    }
};


export const generateImage = async (prompt: string, aspectRatio: string, referenceImages: string[] = []): Promise<string> => {
    try {
        const enhancedPrompt = `Generate a cinematic image with a ${aspectRatio} aspect ratio. ${prompt}`;
        const textParts: { text: string }[] = [{ text: enhancedPrompt }];
        const imageParts: { inlineData: { mimeType: string; data: string } }[] = [];

        if (referenceImages.length > 0) {
            textParts.unshift({ text: "Generate a new image based on the text prompt, but maintain character and style consistency based on the following reference image(s)." });
            referenceImages.forEach(base64Image => {
                const mimeType = base64Image.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';
                imageParts.push({
                    inlineData: {
                        mimeType,
                        data: base64Image.split(',')[1],
                    },
                });
            });
        }
        
        const allParts = [...imageParts, ...textParts];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: allParts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }

        throw new Error("No image was generated by the model.");
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image.");
    }
};

export const editImage = async (base64ImageData: string, prompt: string): Promise<string> => {
    try {
        const mimeType = base64ImageData.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';
        const data = base64ImageData.split(',')[1];
        
        const imagePart = {
            inlineData: {
                mimeType,
                data,
            },
        };

        const textPart = {
            text: `Edit the provided image based on the following instruction: "${prompt}". Maintain the original style and composition as much as possible, only applying the requested change.`
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        throw new Error("No edited image was generated by the model.");

    } catch (error) {
        console.error("Error editing image:", error);
        throw new Error("Failed to edit image.");
    }
};

export const generateActionPrompt = async (
    topic: string, 
    format: ContentFormat, 
    sceneDescription: string, 
    sceneDialogue: string, 
    imageBase64: string
): Promise<object> => {
    const videoType = format === 'reel' ? '60-second reel' : '5-10 minute YouTube video';
    const prompt = `As a VEO 3 prompt engineer, create a detailed JSON action prompt for a single scene of a ${videoType} video. The video's topic is "${topic}". This scene's visual description is: "${sceneDescription}". The dialogue for this scene is: "${sceneDialogue}". Create a JSON object that captures these details with visual and audio cues, suitable for a video generation model. Output ONLY the valid JSON object for this single scene.`;
    
    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64.split(',')[1],
        },
    };

    const textPart = {
        text: prompt
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [imagePart, textPart] },
             config: {
                responseMimeType: "application/json",
            }
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Error generating action prompt:", error);
        throw new Error("Failed to generate action prompt. The model might have returned an invalid JSON.");
    }
};