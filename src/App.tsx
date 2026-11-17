/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AmbientLibraryView } from './components/AmbientLibraryView';
import { AudioNarrationView } from './components/AudioNarrationView';
import { BoringReadingView } from './components/BoringReadingView';
import { ClearMindView } from './components/ClearMindView';
import { EyeRelaxationView } from './components/EyeRelaxationView';
import { HomeView } from './components/HomeView';
import { NightSkyCanvas } from './components/NightSkyCanvas';
import { RandomThoughtView } from './components/RandomThoughtView';
import { SettingsView } from './components/SettingsView';
import { SleepJournalView } from './components/SleepJournalView';
import { StartSleepingView } from './components/StartSleepingView';
import { TopNav } from './components/TopNav';
import { useSleepwellState } from './hooks/useSleepwellState';
import { AppView } from './types';

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const {
    prefs,
    updatePrefs,
    activeSounds,
    toggleSound,
    setSoundVolume,
    applySoundPreset,
    stopAllAmbient,
    startPreferredAmbient,
    currentTime,
    sessionSeconds,
    sleepTimerRemainingSec,
    startSleepTimer,
    cancelSleepTimer,
    journal,
    addJournalEntry,
    deleteJournalEntry,
    sleepStreak,
  } = useSleepwellState();

  const navigateTo = (nextView: AppView) => {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Gentle brightness dimming overlay derived from user brightness setting
  const brightnessDimOpacity = Math.max(
    0,
    Math.min(0.68, (100 - prefs.screenBrightness) / 100)
  );

  // Resume AudioContext softly if browser tab returns from background sleep
  useEffect(() => {
    const onVisChange = () => {
      if (document.visibilityState === 'visible' && activeSounds.length > 0) {
        // Trigger gentle sync
        updatePrefs({});
      }
    };
    document.addEventListener('visibilitychange', onVisChange);
    return () => document.removeEventListener('visibilitychange', onVisChange);
  }, [activeSounds.length, updatePrefs]);

  return (
    <div className="relative min-h-screen text-[#e6e2da] overflow-x-hidden">
      {/* Night sky atmosphere canvas */}
      <NightSkyCanvas
        theme={prefs.backgroundTheme}
        dimLevel={view === 'start-sleeping' ? 0.65 : brightnessDimOpacity}
      />

      {/* Screen brightness & Night Mode warm filter */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-40 transition-all duration-500"
        style={{
          backgroundColor: prefs.nightModeWarmth
            ? `rgba(18, 9, 4, ${Math.max(0.18, brightnessDimOpacity)})`
            : `rgba(2, 4, 10, ${brightnessDimOpacity})`,
          mixBlendMode: prefs.nightModeWarmth ? 'multiply' : 'normal',
        }}
      />

      {view !== 'start-sleeping' && (
        <TopNav currentView={view} onNavigate={navigateTo} />
      )}

      <main className="relative z-10">
        {view === 'home' && (
          <HomeView
            currentTime={currentTime}
            sessionSeconds={sessionSeconds}
            prefs={prefs}
            activeSounds={activeSounds}
            sleepStreak={sleepStreak}
            sleepTimerRemainingSec={sleepTimerRemainingSec}
            onNavigate={navigateTo}
            onToggleSound={toggleSound}
            onStopAllAmbient={stopAllAmbient}
            onStartPreferredAmbient={startPreferredAmbient}
            onUpdatePrefs={updatePrefs}
          />
        )}

        {view === 'reading' && (
          <BoringReadingView
            prefs={prefs}
            onUpdatePrefs={updatePrefs}
            onBack={() => navigateTo('home')}
          />
        )}

        {view === 'narration' && (
          <AudioNarrationView
            prefs={prefs}
            activeSounds={activeSounds}
            sleepTimerRemainingSec={sleepTimerRemainingSec}
            onUpdatePrefs={updatePrefs}
            onToggleSound={toggleSound}
            onStartSleepTimer={startSleepTimer}
            onCancelSleepTimer={cancelSleepTimer}
            onBack={() => navigateTo('home')}
          />
        )}

        {view === 'eyes' && (
          <EyeRelaxationView prefs={prefs} onBack={() => navigateTo('home')} />
        )}

        {view === 'clear-mind' && (
          <ClearMindView
            activeSounds={activeSounds}
            onStartPreferredAmbient={startPreferredAmbient}
            onNavigate={navigateTo}
            onBack={() => navigateTo('home')}
          />
        )}

        {view === 'random-thought' && (
          <RandomThoughtView
            prefs={prefs}
            onUpdatePrefs={updatePrefs}
            onBack={() => navigateTo('home')}
          />
        )}

        {view === 'ambient' && (
          <AmbientLibraryView
            prefs={prefs}
            activeSounds={activeSounds}
            sleepTimerRemainingSec={sleepTimerRemainingSec}
            onToggleSound={toggleSound}
            onSetSoundVolume={setSoundVolume}
            onApplyPreset={applySoundPreset}
            onStopAll={stopAllAmbient}
            onUpdatePrefs={updatePrefs}
            onStartSleepTimer={startSleepTimer}
            onCancelSleepTimer={cancelSleepTimer}
            onBack={() => navigateTo('home')}
          />
        )}

        {view === 'start-sleeping' && (
          <StartSleepingView
            prefs={prefs}
            activeSounds={activeSounds}
            sleepTimerRemainingSec={sleepTimerRemainingSec}
            onStartPreferredAmbient={startPreferredAmbient}
            onStartSleepTimer={startSleepTimer}
            onCancelSleepTimer={cancelSleepTimer}
            onExit={() => navigateTo('home')}
          />
        )}

        {view === 'journal' && (
          <SleepJournalView
            entries={journal}
            sleepStreak={sleepStreak}
            onAddEntry={addJournalEntry}
            onDeleteEntry={deleteJournalEntry}
            onBack={() => navigateTo('home')}
          />
        )}

        {view === 'settings' && (
          <SettingsView
            prefs={prefs}
            onUpdatePrefs={updatePrefs}
            onBack={() => navigateTo('home')}
          />
        )}
      </main>
    </div>
  );
}
