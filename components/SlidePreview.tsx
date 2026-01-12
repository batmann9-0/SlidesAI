
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slide, ThemeConfig } from '../types';

interface SlidePreviewProps {
  slide: Slide;
  theme: ThemeConfig;
  index: number;
  onGenerateImage: (slideId: string) => Promise<void>;
  isGeneratingImage: boolean;
}

const SlidePreview: React.FC<SlidePreviewProps> = ({ slide, theme, index, onGenerateImage, isGeneratingImage }) => {
  return (
    <motion.div 
      key={slide.id}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ 
        duration: 0.5, 
        ease: [0.16, 1, 0.3, 1] 
      }}
      className={`aspect-video w-full max-w-4xl mx-auto shadow-2xl rounded-xl overflow-hidden flex flex-col bg-gradient-to-br ${theme.gradient} border border-white/10`}
    >
      <div className="p-12 flex-1 flex flex-col">
        <div className="flex items-center gap-4 mb-8">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: 32 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className={`h-1 ${theme.bg === 'bg-white' ? 'bg-zinc-900' : 'bg-white'} rounded-full opacity-20`} 
          />
          <span className={`text-sm font-medium uppercase tracking-widest ${theme.secondary}`}>Slide {index + 1}</span>
        </div>
        
        <motion.h2 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className={`text-5xl font-bold mb-10 leading-tight ${theme.text} ${theme.font}`}
        >
          {slide.title}
        </motion.h2>

        <div className="grid grid-cols-2 gap-8 flex-1">
          <ul className="space-y-6">
            {slide.content.map((item, idx) => (
              <motion.li 
                key={idx} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (idx * 0.1), duration: 0.5 }}
                className="flex items-start gap-4 group"
              >
                <span className={`mt-2 w-2 h-2 rounded-full ${theme.accent.replace('text-', 'bg-')} shrink-0`} />
                <p className={`text-xl leading-relaxed ${theme.text} opacity-80 group-hover:opacity-100 transition-opacity`}>
                  {item}
                </p>
              </motion.li>
            ))}
          </ul>
          
          <div className="relative group overflow-hidden rounded-lg shadow-inner bg-slate-200/20">
            <AnimatePresence mode="wait">
              {isGeneratingImage ? (
                <motion.div 
                  key="loading-img"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm text-white p-4 text-center"
                >
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-2" />
                  <p className="text-xs font-bold uppercase tracking-tighter">Generating Vision...</p>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <motion.img 
              key={slide.generatedImageUrl || 'placeholder'}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              src={slide.generatedImageUrl || `https://picsum.photos/seed/${slide.id}/600/400?grayscale`} 
              alt="Visual aid"
              className={`w-full h-full object-cover rounded-lg grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 ${isGeneratingImage ? 'blur-sm' : ''}`}
            />
            
            {!slide.generatedImageUrl && !isGeneratingImage && (
              <motion.div 
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity"
              >
                <button 
                  onClick={() => onGenerateImage(slide.id)}
                  className="px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-bold shadow-xl active:scale-95 transition-transform"
                >
                  Generate AI Visual
                </button>
              </motion.div>
            )}

            {slide.generatedImageUrl && !isGeneratingImage && (
              <motion.div 
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute top-2 right-2 flex gap-2"
              >
                <button 
                  onClick={() => onGenerateImage(slide.id)}
                  className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  title="Regenerate Image"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      
      {/* Speaker Notes Drawer (Visual Only) */}
      <div className="px-12 py-4 bg-black/5 border-t border-black/5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold uppercase tracking-tighter ${theme.secondary}`}>Context</span>
          <p className={`text-sm italic truncate max-w-md ${theme.secondary}`}>
            {slide.speakerNotes}
          </p>
        </div>
        <div className={`text-xs font-mono opacity-50 ${theme.text}`}>SC-PRNT-2024</div>
      </div>
    </motion.div>
  );
};

export default SlidePreview;
