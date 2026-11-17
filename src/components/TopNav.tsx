import React from 'react';
import { Moon } from 'lucide-react';
import { AppView } from '../types';

interface TopNavProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ currentView, onNavigate }) => {
  const navItems: Array<{ id: AppView; label: string }> = [
    { id: 'home', label: 'Sanctuary' },
    { id: 'ambient', label: 'Sounds' },
    { id: 'journal', label: 'Journal' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#050811]/75 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="font-display text-xl tracking-wide text-[#ece8e0] hover:text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b8aedc]/50 rounded-md px-1 py-1"
          >
            Sleepwell
          </button>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm text-[#a6a2b5]"
          >
            {navItems.map((item) => {
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`whitespace-nowrap shrink-0 py-1 transition-colors border-b ${
                    active
                      ? 'text-[#ece8e0] border-[#b8aedc]/60'
                      : 'border-transparent hover:text-[#dfdbe8] hover:border-white/20'
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b8aedc]/50 rounded-sm`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('start-sleeping')}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-xl bg-[#b8aedc]/15 hover:bg-[#b8aedc]/25 text-[#eae6f4] border border-[#b8aedc]/25 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b8aedc]/60"
            >
              <Moon className="w-4 h-4 text-[#c4b8e6]" aria-hidden="true" />
              <span>Start Sleeping</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation bar — compact for <= 15% sticky height */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#060914]/90 backdrop-blur-md border-t border-white/[0.06]"
      >
        <div className="grid grid-cols-4 h-14">
          {navItems.map((item) => {
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex items-center justify-center text-xs font-medium transition-colors min-h-[44px] whitespace-nowrap ${
                  active ? 'text-[#e8e3f5]' : 'text-[#8c889b]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
