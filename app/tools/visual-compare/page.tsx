"use client";

import React from "react";
import { Image as ImageIcon, ArrowsLeftRight, Question } from "@phosphor-icons/react";
import { PageShell } from "@/components/page-shell";

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
    <PageShell
      eyebrow="Visual Compare"
      title="Visual Regression Tool"
      description="Compare UI screenshots to detect layout breaks."
    >
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-6">
          {[1, 2].map((side) => (
            <div
              key={side}
              className="relative rounded-[32px] border-2 border-dashed border-slate-200 bg-white p-4 h-64 flex flex-col items-center justify-center overflow-hidden"
            >
              {(side === 1 ? img1 : img2) ? (
                <img
                  src={(side === 1 ? img1 : img2)!}
                  className="object-contain h-full w-full"
                  alt="upload"
                />
              ) : (
                <div className="text-center">
                  <ImageIcon size={40} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Upload {side === 1 ? "Expected" : "Actual"}
                  </p>
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

        {img1 && img2 ? (
          <section className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Comparison Slider</h2>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span>Expected (Left)</span>
                <ArrowsLeftRight size={16} />
                <span>Actual (Right)</span>
              </div>
            </div>
            <div className="relative h-[600px] w-full rounded-[40px] border-8 border-white shadow-2xl overflow-hidden bg-slate-100">
              <img src={img2} className="absolute inset-0 h-full w-full object-contain" alt="actual" />
              <div
                className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-sky-500 shadow-xl"
                style={{ width: `${sliderPos}%` }}
              >
                <img
                  src={img1}
                  className="h-full object-contain"
                  style={{ width: `calc(100% * 100 / ${sliderPos})` }}
                  alt="expected"
                />
              </div>
              {/* Custom slider handle */}
              <div
                className="absolute inset-y-0 z-10 w-0.5 bg-sky-500 pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-sky-500 shadow-xl ring-4 ring-white flex items-center justify-center text-white">
                  <ArrowsLeftRight size={20} weight="bold" />
                </div>
                {/* tick marks */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 h-3 w-0.5 bg-white/60 rounded-full" />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-3 w-0.5 bg-white/60 rounded-full" />
              </div>
              {/* Invisible range input on top */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                aria-label="Comparison slider position"
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
              />
              {/* Labels */}
              <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-sm pointer-events-none">
                Expected
              </div>
              <div className="absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-sm pointer-events-none">
                Actual
              </div>
            </div>
            {/* Slider track UI below */}
            <div className="flex items-center gap-3 px-2">
              <span className="text-[10px] font-bold text-slate-400 w-8">0%</span>
              <div className="relative flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-sky-500 transition-all"
                  style={{ width: `${sliderPos}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-sky-500 ring-2 ring-white shadow-md"
                  style={{ left: `${sliderPos}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-400 w-8 text-right">100%</span>
            </div>
          </section>
        ) : (
          <div className="bg-sky-50 border border-sky-100 p-8 rounded-[32px] text-center">
            <Question size={40} className="mx-auto text-sky-300 mb-4" />
            <p className="text-sm font-semibold text-sky-700">
              Upload both images to activate the comparison slider.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
