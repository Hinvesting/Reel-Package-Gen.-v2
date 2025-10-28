export type ContentFormat = 'reel' | 'long-form';

export interface ReelPackage {
  topic: string;
  format: ContentFormat;
  thumbnail: {
    title: string;
    imageUrl: string;
  };
  scenes: Array<{
    sceneNumber: number;
    description: string;
    dialogue: string;
    textOverlay?: string;
    imageUrl?: string;
    actionPrompt?: any;
    isLoading: boolean;
  }>;
}
