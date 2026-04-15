"use client";

import React from "react";
import { Image as ImageIcon, ArrowsLeftRight, Question } from "@phosphor-icons/react";

export default function VisualCompare() {
  const [img1, setImg1] = React.useState<string | null>(null);
  const [img2, setImg2] = React.useState<string | null>(null);
  const [sliderPos, setSliderPos] = React.useState(50);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 1 | 2) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (side === 1) setImg1(url);
      else setImg2(url);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Visual Regression Tool</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Compare UI screenshots to detect layout breaks.</p>
      </header>

      <div className="grid grid-cols-2 gap-6">
        {[1, 2].map(side => (
          <div key={side} className="relative rounded-[32px] border-2 border-dashed border-slate-200 bg-white p-4 h-64 flex flex-col items-center justify-center overflow-hidden">
            { (side === 1 ? img1 : img2) ? (
              <img src={(side === 1 ? img1 : img2)!} className="object-contain h-full w-full" alt="upload" />
            ) : (
              <div className="text-center">
                <ImageIcon size={40} className="mx-auto text-slate-300 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload {side === 1 ? 'Expected' : 'Actual'}</p>
              </div>
            )}
            <input 
              type="file" 
              onChange={(e) => handleUpload(e, side as 1 | 2)} 
              className="absolute inset-0 opacity-0 cursor-pointer" 
            />
          </div>
        ))}
      </div>

      {(img1 && img2) && (
        <section className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
           <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">Comparison Slider</h2>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                 <span>Expected (Left)</span>
                 <ArrowsLeftRight size={16} />
                 <span>Actual (Right)</span>
              </div>
           </div>

           <div className="relative h-[600px] w-full rounded-[40px] border-8 border-white shadow-2xl overflow-hidden bg-slate-100">
              {/* Actual Image (Base) */}
              <img src={img2} className="absolute inset-0 h-full w-full object-contain" alt="actual" />
              
              {/* Expected Image (Overlay) */}
              <div 
                className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-sky-500 shadow-xl"
                style={{ width: `${sliderPos}%` }}
              >
                <img src={img1} className="h-full w-[max(6xl,100%)] object-contain" alt="expected" style={{ width: `calc(100% * 100 / ${sliderPos})` }} />
              </div>

              {/* Slider Controller */}
              <input 
                type="range" 
                min="0" max="100" 
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
              />
              <div 
                className="absolute inset-y-0 z-10 w-1 bg-sky-500"
                style={{ left: `${sliderPos}%` }}
              >
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 bg-sky-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    <ArrowsLeftRight size={20} weight="bold" />
                 </div>
              </div>
           </div>
        </section>
      )}

      {(!img1 || !img2) && (
        <div className="bg-sky-50 border border-sky-100 p-8 rounded-[32px] text-center">
           <Question size={40} className="mx-auto text-sky-300 mb-4" />
           <p className="text-sm font-semibold text-sky-700">Upload both images to activate the comparison slider.</p>
        </div>
      )}
    </div>
  );
}
