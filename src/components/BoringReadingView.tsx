import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Moon, SunDim } from 'lucide-react';
import { BORING_PASSAGES } from '../data/boringPassages';
import { UserPreferences } from '../types';

interface BoringReadingViewProps {
  prefs: UserPreferences;
  onUpdatePrefs: (updater: Partial<UserPreferences>) => void;
  onBack: () => void;
}

export const BoringReadingView: React.FC<BoringReadingViewProps> = ({
  prefs,
  onUpdatePrefs,
  onBack,
}) => {
  const [selectedId, setSelectedId] = useState<string>(BORING_PASSAGES[0].id);
  const [keepReadingMode, setKeepReadingMode] = useState<boolean>(false);
  const [controlsDimmed, setControlsDimmed] = useState<boolean>(false);
  const [screenOffMinutes, setScreenOffMinutes] = useState<number | null>(null);
  const [screenOffRemainingSec, setScreenOffRemainingSec] = useState<
    number | null
  >(null);
  const [screenBlackout, setScreenBlackout] = useState<boolean>(false);
  const [progressiveDim, setProgressiveDim] = useState<number>(0); // 0 to 0.45

  const inactivityTimerRef = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const activeIndex = useMemo(
    () => BORING_PASSAGES.findIndex((p) => p.id === selectedId),
    [selectedId]
  );

  const displayedPassages = useMemo(() => {
    if (!keepReadingMode) {
      return [BORING_PASSAGES[Math.max(0, activeIndex)]];
    }
    // Queue selected passage followed by all others seamlessly
    const idx = Math.max(0, activeIndex);
    return [
      ...BORING_PASSAGES.slice(idx),
      ...BORING_PASSAGES.slice(0, idx),
    ];
  }, [activeIndex, keepReadingMode]);

  // Auto-dim interface chrome after 4.5s of inactivity
  useEffect(() => {
    const resetActivity = () => {
      setControlsDimmed(false);
      if (inactivityTimerRef.current !== null) {
        window.clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = window.setTimeout(() => {
        setControlsDimmed(true);
      }, 4500);
    };

    resetActivity();
    window.addEventListener('mousemove', resetActivity, { passive: true });
    window.addEventListener('touchstart', resetActivity, { passive: true });
    window.addEventListener('keydown', resetActivity);

    return () => {
      if (inactivityTimerRef.current !== null) {
        window.clearTimeout(inactivityTimerRef.current);
      }
      window.removeEventListener('mousemove', resetActivity);
      window.removeEventListener('touchstart', resetActivity);
      window.removeEventListener('keydown', resetActivity);
    };
  }, []);

  // Gentle auto-scroll drift
  useEffect(() => {
    if (prefs.readingAutoScrollSpeed === 'off' || screenBlackout) return;

    const pxPerSecond =
      prefs.readingAutoScrollSpeed === 'very-slow'
        ? 10
        : prefs.readingAutoScrollSpeed === 'slow'
        ? 18
        : 28;

    let last = performance.now();
    let accum = 0;
    let frameId = 0;

    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      accum += dt * pxPerSecond;
      if (accum >= 1) {
        const move = Math.floor(accum);
        accum -= move;
        window.scrollBy({ top: move, behavior: 'auto' });
      }
      frameId = window.requestAnimationFrame(step);
    };

    frameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frameId);
  }, [prefs.readingAutoScrollSpeed, screenBlackout]);

  // Progressive gentle dim in "Keep Reading Until Sleepy" mode
  useEffect(() => {
    if (!keepReadingMode) {
      setProgressiveDim(0);
      return;
    }
    const id = window.setInterval(() => {
      setProgressiveDim((prev) => Math.min(0.45, prev + 0.015));
    }, 15000);
    return () => window.clearInterval(id);
  }, [keepReadingMode]);

  // Optional automatic screen-off timer
  useEffect(() => {
    if (screenOffMinutes === null) {
      setScreenOffRemainingSec(null);
      return;
    }
    setScreenOffRemainingSec(screenOffMinutes * 60);
  }, [screenOffMinutes]);

  useEffect(() => {
    if (screenOffRemainingSec === null) return;
    const id = window.setInterval(() => {
      setScreenOffRemainingSec((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          setScreenBlackout(true);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [screenOffRemainingSec !== null]);

  const fontSizeClass =
    prefs.readingFontSize === 'sm'
      ? 'text-base leading-[1.85]'
      : prefs.readingFontSize === 'md'
      ? 'text-lg leading-[1.95]'
      : prefs.readingFontSize === 'lg'
      ? 'text-xl leading-[2.0]'
      : 'text-2xl leading-[2.05]';

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-28 md:pb-20">
      {/* Screen-off curtain */}
      {screenBlackout && (
        <div
          onClick={() => {
            setScreenBlackout(false);
            setScreenOffMinutes(null);
          }}
          className="fixed inset-0 z-50 bg-[#020307] flex flex-col items-center justify-center p-6 cursor-pointer transition-opacity duration-1000"
        >
          <p className="text-sm text-[#4e4b5c] font-display text-center">
            Screen resting. Tap anywhere to wake.
          </p>
        </div>
      )}

      {/* Progressive dim curtain */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-10 bg-black transition-opacity duration-1000"
        style={{ opacity: progressiveDim }}
      />

      <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-8 pt-6 sm:pt-10 space-y-8">
        {/* Top bar (auto-dims quietly when reading) */}
        <div
          className={`transition-opacity duration-700 space-y-6 ${
            controlsDimmed ? 'opacity-25 hover:opacity-100' : 'opacity-100'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 min-h-[44px] px-3 py-2 -ml-3 rounded-xl text-sm text-[#a6a2b5] hover:text-[#ece8e0] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sanctuary</span>
            </button>

            <button
              type="button"
              onClick={() => setKeepReadingMode((v) => !v)}
              className={`inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border text-xs sm:text-sm transition-colors whitespace-nowrap ${
                keepReadingMode
                  ? 'bg-[#b8aedc]/20 border-[#b8aedc]/35 text-[#efeaf8]'
                  : 'bg-white/[0.03] border-white/[0.08] text-[#b4b0c2] hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4" aria-hidden="true" />
              <span>
                Keep Reading Until Sleepy: {keepReadingMode ? 'On' : 'Off'}
              </span>
            </button>
          </div>

          {/* Category Selector */}
          <div className="space-y-3">
            <p className="text-xs text-[#8d899c]">
              Select a neutral, unhurried subject
            </p>
            <div className="flex flex-wrap gap-2">
              {BORING_PASSAGES.map((passage) => {
                const active = passage.id === selectedId;
                return (
                  <button
                    key={passage.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(passage.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#b8aedc]/20 text-[#f1edf9] border border-[#b8aedc]/35'
                        : 'bg-white/[0.03] text-[#9b97aa] border border-white/[0.06] hover:text-[#e4e0ec]'
                    }`}
                  >
                    {passage.categoryCode}. {passage.categoryName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reading Comfort Controls */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.025] border border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Font size */}
            <div className="space-y-2">
              <span className="text-xs text-[#8d899c] block">Text Size</span>
              <div className="flex items-center gap-1.5">
                {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => onUpdatePrefs({ readingFontSize: size })}
                    className={`flex-1 min-h-[38px] rounded-lg text-xs uppercase transition-colors ${
                      prefs.readingFontSize === size
                        ? 'bg-[#b8aedc]/22 text-[#f0ecf8] border border-[#b8aedc]/30'
                        : 'bg-white/[0.03] text-[#8f8ba0] border border-white/[0.05] hover:text-[#dcd7e6]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-scroll reading speed */}
            <div className="space-y-2">
              <span className="text-xs text-[#8d899c] block">
                Auto-Scroll Drift
              </span>
              <div className="flex items-center gap-1.5">
                {(
                  [
                    { id: 'off', label: 'Off' },
                    { id: 'very-slow', label: 'Slowest' },
                    { id: 'slow', label: 'Slow' },
                    { id: 'steady', label: 'Steady' },
                  ] as const
                ).map((sp) => (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() =>
                      onUpdatePrefs({ readingAutoScrollSpeed: sp.id })
                    }
                    className={`flex-1 min-h-[38px] px-2 rounded-lg text-xs transition-colors whitespace-nowrap ${
                      prefs.readingAutoScrollSpeed === sp.id
                        ? 'bg-[#b8aedc]/22 text-[#f0ecf8] border border-[#b8aedc]/30'
                        : 'bg-white/[0.03] text-[#8f8ba0] border border-white/[0.05] hover:text-[#dcd7e6]'
                    }`}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Automatic Screen-Off Timer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#8d899c]">
                <span>Screen-Off Timer</span>
                {screenOffRemainingSec !== null && (
                  <span className="tabular-nums text-[#c4b8e6]">
                    {Math.floor(screenOffRemainingSec / 60)}:
                    {String(screenOffRemainingSec % 60).padStart(2, '0')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {[null, 10, 20, 30].map((mins) => (
                  <button
                    key={String(mins)}
                    type="button"
                    onClick={() => setScreenOffMinutes(mins)}
                    className={`flex-1 min-h-[38px] rounded-lg text-xs transition-colors whitespace-nowrap ${
                      screenOffMinutes === mins
                        ? 'bg-[#b8aedc]/22 text-[#f0ecf8] border border-[#b8aedc]/30'
                        : 'bg-white/[0.03] text-[#8f8ba0] border border-white/[0.05] hover:text-[#dcd7e6]'
                    }`}
                  >
                    {mins === null ? 'Off' : `${mins}m`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Passage Content */}
        <article
          ref={scrollContainerRef}
          className="max-w-[66ch] mx-auto pt-4 space-y-16"
        >
          {displayedPassages.map((passage, pIdx) => (
            <div
              key={`${passage.id}-${pIdx}`}
              className="space-y-7 pb-10 border-b border-white/[0.06] last:border-b-0"
            >
              <header className="space-y-2">
                <p className="text-xs text-[#8c879e]">
                  {passage.categoryCode}. {passage.categoryName}
                  <span aria-hidden="true"> · </span>
                  <span>
                    {passage.paragraphs
                      .join(' ')
                      .split(/\s+/)
                      .filter(Boolean).length}{' '}
                    words
                  </span>
                </p>
                <h1 className="font-display text-2xl sm:text-3xl font-normal text-[#e9e4da]">
                  {passage.title}
                </h1>
              </header>

              <div className={`space-y-6 text-[#cfc9be] ${fontSizeClass}`}>
                {passage.paragraphs.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
            </div>
          ))}

          {!keepReadingMode && (
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
              <button
                type="button"
                onClick={() => {
                  const nextIdx = (activeIndex + 1) % BORING_PASSAGES.length;
                  setSelectedId(BORING_PASSAGES[nextIdx].id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-5 py-3 min-h-[44px] rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#dcd7e6] transition-colors"
              >
                Continue to Next Passage
              </button>

              <button
                type="button"
                onClick={() => setKeepReadingMode(true)}
                className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-xl bg-[#b8aedc]/15 hover:bg-[#b8aedc]/25 border border-[#b8aedc]/25 text-[#ebe6f6] transition-colors"
              >
                <SunDim className="w-4 h-4" />
                <span>Enable Keep Reading Until Sleepy</span>
              </button>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};
