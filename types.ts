
export interface Slide {
  id: string;
  title: string;
  content: string[];
  speakerNotes: string;
  imageDescription?: string;
  generatedImageUrl?: string;
}

export interface PresentationData {
  title: string;
  slides: Slide[];
}

export type ThemeType = 'corporate' | 'modern' | 'minimal' | 'elegant';

export interface ThemeConfig {
  bg: string;
  text: string;
  accent: string;
  secondary: string;
  font: string;
  gradient?: string;
}
