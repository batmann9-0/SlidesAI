
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import pptxgen from 'pptxgenjs';
import { PresentationData, ThemeType, Slide } from './types';
import { THEMES } from './constants';
import { generateSlidesFromText, generateImage } from './services/geminiService';
import SlidePreview from './components/SlidePreview';

const LoadingState: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4" role="status" aria-live="polite">
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"
    />
    <p className="text-slate-500 animate-pulse font-medium">Gemini is architecting your presentation...</p>
  </div>
);

const EmptyState: React.FC<{ onAction: () => void }> = ({ onAction }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-20 px-4"
  >
    <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6" aria-hidden="true">
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    </div>
    <h3 className="text-2xl font-bold text-slate-900 mb-2">No slides yet</h3>
    <p className="text-slate-500 mb-8 max-w-sm mx-auto">Paste your content above and let our AI create a professional slide deck for you.</p>
    <button 
      onClick={onAction} 
      className="text-blue-600 font-semibold hover:text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
      aria-label="Paste sample text to try the app"
    >
      Check sample text
    </button>
  </motion.div>
);

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [data, setData] = useState<PresentationData | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('corporate');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateSlidesFromText(inputText);
      setData(result);
      setActiveSlideIndex(0);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating slides.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async (slideId: string) => {
    if (!data) return;
    
    const slide = data.slides.find(s => s.id === slideId);
    if (!slide || !slide.imageDescription) return;

    setGeneratingImages(prev => ({ ...prev, [slideId]: true }));
    try {
      const imageUrl = await generateImage(slide.imageDescription);
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          slides: prev.slides.map(s => 
            s.id === slideId ? { ...s, generatedImageUrl: imageUrl } : s
          )
        };
      });
    } catch (err) {
      console.error("Image generation failed:", err);
      setError("Failed to generate AI image. Please try again.");
    } finally {
      setGeneratingImages(prev => ({ ...prev, [slideId]: false }));
    }
  };

  const handleSample = () => {
    setInputText(`Strategic Roadmap 2025: Tech Horizon
    
    Current Landscape:
    The industry is shifting towards decentralized computing and edge AI. Competition has intensified in the SaaS sector, necessitating a pivot towards integrated ecosystems.
    
    Core Objectives:
    - Achieve carbon neutrality by Q4 2025
    - Expand market share in APAC by 18%
    - Redefine internal workflows using LLM-driven automation
    
    Innovation Pillars:
    - Adaptive UI/UX using biometric feedback
    - Quantum-resistant encryption for cloud storage
    - Real-time supply chain transparency using distributed ledgers
    
    Conclusion:
    Our focus remains steadfast on sustainable growth and pioneering technological breakthroughs. The road ahead is challenging but ripe with opportunity.`);
  };

  const downloadPPTX = async () => {
    if (!data) return;

    const pres = new pptxgen();
    pres.layout = 'LAYOUT_16x9';
    pres.title = data.title;

    const colors: Record<ThemeType, { bg: string; text: string; accent: string }> = {
      corporate: { bg: '0f172a', text: 'ffffff', accent: '60a5fa' },
      modern: { bg: 'ffffff', text: '18181b', accent: '059669' },
      minimal: { bg: 'f8fafc', text: '000000', accent: 'f97316' },
      elegant: { bg: 'f5f5f4', text: '1c1917', accent: '78350f' },
    };

    const theme = colors[currentTheme];

    data.slides.forEach((slide) => {
      const pptSlide = pres.addSlide();
      pptSlide.background = { fill: theme.bg };

      pptSlide.addText(slide.title, {
        x: 0.5,
        y: 0.5,
        w: '90%',
        h: 1,
        fontSize: 36,
        bold: true,
        color: theme.text,
        fontFace: currentTheme === 'elegant' ? 'Georgia' : 'Arial',
      });

      const bulletPoints = slide.content.map(text => ({
        text,
        options: { bullet: true, color: theme.text, fontSize: 18, margin: 5 }
      }));

      pptSlide.addText(bulletPoints, {
        x: 0.5,
        y: 1.8,
        w: slide.generatedImageUrl ? '50%' : '90%',
        h: 3,
        valign: 'top',
        fontFace: 'Arial'
      });

      if (slide.generatedImageUrl) {
        pptSlide.addImage({
          data: slide.generatedImageUrl,
          x: '55%',
          y: 1.8,
          w: '40%',
          h: 3,
        });
      }

      pptSlide.addNotes(slide.speakerNotes);
    });

    try {
      await pres.writeFile({ fileName: `${data.title.replace(/\s+/g, '_')}.pptx` });
    } catch (err) {
      console.error('PPTX Export failed:', err);
      setError('Failed to export PowerPoint file.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3" aria-label="SlideCraft AI Logo">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200"
              aria-hidden="true"
            >
              SC
            </motion.div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-none">SlideCraft AI</h1>
              <p className="text-xs text-slate-500 font-medium mt-1">Professional Presentation Engine</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <AnimatePresence>
              {data && (
                <motion.button 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={downloadPPTX}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold transition-all shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  aria-label="Download presentation as PowerPoint file"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download .PPTX
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col" aria-labelledby="input-label">
            <label id="input-label" htmlFor="source-content" className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Source Content</label>
            <textarea 
              id="source-content"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your presentation notes, reports, or raw data here..."
              className="flex-1 min-h-[300px] p-4 text-slate-700 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none text-sm font-medium leading-relaxed"
              aria-required="true"
            />
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !inputText}
              className={`mt-4 w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                isGenerating || !inputText 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-900 hover:bg-black text-white shadow-xl shadow-slate-200 active:scale-[0.98]'
              }`}
              aria-label={isGenerating ? "Transforming text to slides" : "Transform text into professional slides"}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" aria-hidden="true" />
                  Generating...
                </>
              ) : 'Transform into Slides'}
            </button>
            {error && <p className="text-red-500 text-xs mt-3 font-medium" role="alert">{error}</p>}
          </section>

          <AnimatePresence>
            {data && (
              <motion.section 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                aria-labelledby="theme-label"
              >
                <h3 id="theme-label" className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider block">Visual Theme</h3>
                <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-labelledby="theme-label">
                  {(Object.keys(THEMES) as ThemeType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setCurrentTheme(t)}
                      role="radio"
                      aria-checked={currentTheme === t}
                      className={`p-3 rounded-xl border-2 transition-all text-left capitalize font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        currentTheme === t 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                        : 'border-slate-100 text-slate-600 hover:border-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-8 flex flex-col">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <LoadingState key="loading" />
            ) : data ? (
              <motion.div 
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 truncate max-w-md" aria-live="polite">
                    {data.title}
                  </h2>
                  <nav className="flex items-center gap-2" aria-label="Slide navigation">
                    <button 
                      onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
                      disabled={activeSlideIndex === 0}
                      className="p-2 rounded-full hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-20 transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      aria-label="Previous slide"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-sm font-bold text-slate-500 min-w-[3rem] text-center" aria-current="step">
                      {activeSlideIndex + 1} / {data.slides.length}
                    </span>
                    <button 
                      onClick={() => setActiveSlideIndex(Math.min(data.slides.length - 1, activeSlideIndex + 1))}
                      disabled={activeSlideIndex === data.slides.length - 1}
                      className="p-2 rounded-full hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-20 transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      aria-label="Next slide"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </nav>
                </div>

                <div className="relative overflow-visible min-h-[400px]">
                  <AnimatePresence mode="wait">
                    <SlidePreview 
                      key={data.slides[activeSlideIndex].id}
                      slide={data.slides[activeSlideIndex]} 
                      theme={THEMES[currentTheme]}
                      index={activeSlideIndex}
                      onGenerateImage={handleGenerateImage}
                      isGeneratingImage={generatingImages[data.slides[activeSlideIndex].id] || false}
                    />
                  </AnimatePresence>
                </div>

                <nav className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3" aria-label="Slide thumbnails">
                  {data.slides.map((slide, idx) => (
                    <button
                      key={slide.id}
                      onClick={() => setActiveSlideIndex(idx)}
                      aria-label={`Go to slide ${idx + 1}: ${slide.title}`}
                      aria-current={activeSlideIndex === idx ? "true" : "false"}
                      className={`relative aspect-video rounded-md overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        activeSlideIndex === idx ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200 opacity-50 hover:opacity-100'
                      }`}
                    >
                      <div className={`w-full h-full p-2 text-[6px] text-left leading-[1] ${THEMES[currentTheme].bg} ${THEMES[currentTheme].text}`}>
                        <div className="font-bold mb-1 truncate">{slide.title}</div>
                        <div className="opacity-50 line-clamp-3">
                          {slide.content[0]}
                        </div>
                        {slide.generatedImageUrl && (
                          <div className="absolute bottom-1 right-1 w-2 h-2 bg-emerald-500 rounded-full shadow-sm" aria-label="Image generated" />
                        )}
                      </div>
                    </button>
                  ))}
                </nav>

                <motion.section 
                  key={`notes-${activeSlideIndex}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-8"
                  aria-labelledby="notes-label"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                    <h4 id="notes-label" className="text-xs font-bold text-slate-500 uppercase tracking-widest">Presenter Notes</h4>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-medium italic">
                    &quot;{data.slides[activeSlideIndex].speakerNotes}&quot;
                  </p>
                </motion.section>
              </motion.div>
            ) : (
              <EmptyState key="empty" onAction={handleSample} />
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
          <p>© 2024 SlideCraft AI. Powered by BATMAN .</p>
          <nav className="flex gap-6" aria-label="Footer links">
            <a href="#" className="hover:text-indigo-600 transition-colors focus:outline-none focus:underline">Documentation</a>
            <a href="#" className="hover:text-indigo-600 transition-colors focus:outline-none focus:underline">Privacy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors focus:outline-none focus:underline">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default App;
