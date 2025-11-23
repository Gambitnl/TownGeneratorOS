import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { X, Upload, Image as ImageIcon, Sparkles, Eye, Wand2, Loader2, Download, ScanEye } from 'lucide-react';

interface AiToolsProps {
  isOpen: boolean;
  onClose: () => void;
}

type AspectRatio = '1:1' | '3:4' | '4:3' | '16:9' | '9:16';

export const AiTools: React.FC<AiToolsProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'analyze' | 'generate'>('analyze');
  
  // Analysis State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisPrompt, setAnalysisPrompt] = useState("Describe this image in detail, focusing on architectural features and terrain.");
  const [analysisResult, setAnalysisResult] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generation State
  const [genPrompt, setGenPrompt] = useState("A detailed top-down map of a fantasy town with cobblestone roads, rustic wooden houses, and a central plaza, D&D style.");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setAnalysisResult("");
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const imagePart = await fileToGenerativePart(selectedFile);
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
          imagePart,
          { text: analysisPrompt }
        ]
      });
      
      setAnalysisResult(response.text || "No analysis returned.");
    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysisResult("Error analyzing image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!genPrompt) return;
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: genPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: aspectRatio,
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        setGeneratedImage(`data:image/png;base64,${base64ImageBytes}`);
      }
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 w-full max-w-4xl rounded-xl shadow-2xl border border-gray-700 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900/50 rounded-t-xl">
          <div className="flex items-center gap-2 text-blue-400">
            <Sparkles size={24} />
            <h2 className="text-xl font-serif font-bold text-white">Realmsmith AI Studio</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('analyze')}
            className={`flex-1 py-3 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'analyze' 
                ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400' 
                : 'bg-gray-800/50 text-gray-500 hover:text-gray-300 hover:bg-gray-800'
            }`}
          >
            <ScanEye size={18} />
            Vision Oracle
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex-1 py-3 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'generate' 
                ? 'bg-gray-800 text-purple-400 border-b-2 border-purple-400' 
                : 'bg-gray-800/50 text-gray-500 hover:text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Wand2 size={18} />
            Scene Artist
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* --- ANALYZE TAB --- */}
          {activeTab === 'analyze' && (
            <div className="flex flex-col md:flex-row gap-6 h-full">
              {/* Left: Image Input */}
              <div className="flex-1 flex flex-col gap-4">
                <div 
                  className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center min-h-[300px] transition-colors cursor-pointer relative overflow-hidden ${
                    previewUrl ? 'border-blue-500/50 bg-gray-900' : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="max-w-full max-h-[300px] object-contain z-10" />
                  ) : (
                    <div className="flex flex-col items-center text-gray-500 gap-2">
                      <Upload size={32} />
                      <span className="font-semibold">Click to upload reference image</span>
                      <span className="text-xs">Supports JPG, PNG</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    accept="image/*"
                  />
                </div>
                <textarea
                  value={analysisPrompt}
                  onChange={(e) => setAnalysisPrompt(e.target.value)}
                  className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 h-24 resize-none"
                  placeholder="Ask something about the image..."
                />
                <button 
                  onClick={handleAnalyze}
                  disabled={!selectedFile || isAnalyzing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin" /> : <Eye size={20} />}
                  {isAnalyzing ? "Analyzing..." : "Analyze Image"}
                </button>
              </div>

              {/* Right: Result */}
              <div className="flex-1 bg-gray-900/50 rounded-xl border border-gray-700 p-4 flex flex-col">
                <h3 className="text-gray-400 text-xs font-mono uppercase mb-2">Gemini Analysis</h3>
                <div className="flex-1 overflow-y-auto text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                   {analysisResult || (
                     <span className="text-gray-600 italic">Analysis results will appear here...</span>
                   )}
                </div>
              </div>
            </div>
          )}

          {/* --- GENERATE TAB --- */}
          {activeTab === 'generate' && (
            <div className="flex flex-col md:flex-row gap-6 h-full">
              {/* Left: Controls */}
              <div className="flex-1 flex flex-col gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-mono uppercase mb-1 block">Prompt</label>
                  <textarea
                    value={genPrompt}
                    onChange={(e) => setGenPrompt(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500 h-32 resize-none"
                    placeholder="Describe the scene you want to generate..."
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 font-mono uppercase mb-1 block">Aspect Ratio</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['1:1', '3:4', '4:3', '16:9', '9:16'] as AspectRatio[]).map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`py-2 px-3 rounded text-sm font-mono border ${
                          aspectRatio === ratio
                            ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                            : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleGenerate}
                  disabled={!genPrompt || isGenerating}
                  className="mt-auto bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  {isGenerating ? <Loader2 className="animate-spin" /> : <ImageIcon size={20} />}
                  {isGenerating ? "Dreaming..." : "Generate Scene"}
                </button>
              </div>

              {/* Right: Output */}
              <div className="flex-1 bg-gray-900 rounded-xl border border-gray-700 flex items-center justify-center relative overflow-hidden group min-h-[300px]">
                {generatedImage ? (
                  <>
                    <img src={generatedImage} alt="Generated Scene" className="max-w-full max-h-full object-contain" />
                    <a 
                      href={generatedImage} 
                      download="generated-scene.png"
                      className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                    >
                      <Download size={20} />
                    </a>
                  </>
                ) : (
                  <div className="text-gray-600 flex flex-col items-center gap-2">
                    <Sparkles size={48} className="opacity-20" />
                    <span>Generated artwork will appear here</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
