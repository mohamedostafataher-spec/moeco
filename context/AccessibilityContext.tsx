import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  reduceMotion: boolean;
  autoRead: boolean;
  vibration: boolean;
  ttsEnabled: boolean;
  sttEnabled: boolean;
  voiceSpeed: number;
  voiceType: 'male' | 'female';
  focusMode: boolean;
  flashAlerts: boolean;
  simplifiedMode: boolean;
  signLanguageEnabled: boolean;
}

interface AccessibilityContextType extends AccessibilitySettings {
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  vibrate: (pattern?: number | number[]) => void;
  startListening: (onResult: (text: string) => void) => void;
  stopListening: () => void;
  triggerFlash: () => void;
  readMainContent: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 'medium',
  highContrast: false,
  reduceMotion: false,
  autoRead: false,
  vibration: true,
  ttsEnabled: true,
  sttEnabled: true,
  voiceSpeed: 1,
  voiceType: 'female',
  focusMode: false,
  flashAlerts: false,
  simplifiedMode: false,
  signLanguageEnabled: false,
};

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('accessibility_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration for old fontSize number to string
        if (typeof parsed.fontSize === 'number') {
          parsed.fontSize = 'medium';
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {
        console.warn('Invalid saved accessibility settings, resetting to defaults');
        localStorage.removeItem('accessibility_settings');
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [synth] = useState(() => window.speechSynthesis);

  useEffect(() => {
    localStorage.setItem('accessibility_settings', JSON.stringify(settings));
    
    // Apply settings to document
    const root = document.documentElement;
    
    // Font Size
    root.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
    root.classList.add(`font-${settings.fontSize}`);
    
    // High Contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Reduce Motion
    if (settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Focus Mode
    if (settings.focusMode) {
      root.classList.add('focus-mode');
    } else {
      root.classList.remove('focus-mode');
    }

    // Simplified Mode
    if (settings.simplifiedMode) {
      root.classList.add('simplified-mode');
    } else {
      root.classList.remove('simplified-mode');
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const vibrate = useCallback((pattern: number | number[] = 50) => {
    if (settings.vibration && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, [settings.vibration]);

  const triggerFlash = useCallback(() => {
    if (!settings.flashAlerts) return;
    const flashOverlay = document.createElement('div');
    flashOverlay.style.position = 'fixed';
    flashOverlay.style.top = '0';
    flashOverlay.style.left = '0';
    flashOverlay.style.width = '100%';
    flashOverlay.style.height = '100%';
    flashOverlay.style.backgroundColor = 'white';
    flashOverlay.style.zIndex = '9999';
    flashOverlay.style.pointerEvents = 'none';
    document.body.appendChild(flashOverlay);
    
    let opacity = 1;
    const fade = setInterval(() => {
      opacity -= 0.1;
      flashOverlay.style.opacity = opacity.toString();
      if (opacity <= 0) {
        clearInterval(fade);
        document.body.removeChild(flashOverlay);
      }
    }, 50);
  }, [settings.flashAlerts]);

  const speak = useCallback((text: string) => {
    if (!settings.ttsEnabled || !synth) return;
    
    try {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA'; // Default to Arabic
      utterance.rate = settings.voiceSpeed;
      
      // Try to find a voice matching the type
      const voices = synth.getVoices();
      const preferredVoice = voices.find(v => 
        v.lang.includes('ar') && 
        (settings.voiceType === 'female' ? v.name.toLowerCase().includes('female') : v.name.toLowerCase().includes('male'))
      );
      if (preferredVoice) utterance.voice = preferredVoice;

      synth.speak(utterance);
    } catch (error) {
      console.error('TTS Error:', error);
    }
  }, [settings.ttsEnabled, settings.voiceSpeed, settings.voiceType, synth]);

  const stopSpeaking = useCallback(() => {
    if (synth) synth.cancel();
  }, [synth]);

  const startListening = useCallback((onResult: (text: string) => void) => {
    if (!settings.sttEnabled) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-SA';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        onResult(text);
      };

      recognition.onerror = (event: any) => {
        console.error('STT Error:', event.error);
      };

      recognition.start();
    } catch (error) {
      console.error('STT Start Error:', error);
    }
  }, [settings.sttEnabled]);

  const stopListening = useCallback(() => {
    // Recognition usually stops automatically after result or error in non-continuous mode
  }, []);

  const readMainContent = useCallback(() => {
    if (!synth) return;
    
    // Find meaningful content containers
    const mainContent = document.querySelector('main') || document.querySelector('.page-content') || document.body;
    
    // Get all headings and paragraphs
    const elements = mainContent.querySelectorAll('h1, h2, h3, p, span.speakable');
    let textToRead = "";
    
    elements.forEach(el => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.textContent && htmlEl.offsetParent !== null) { // Check if visible
        textToRead += htmlEl.textContent + ". ";
      }
    });

    if (textToRead) {
      speak(textToRead.substring(0, 3000)); // Limit to avoid long speech freezes
    } else {
      speak("لا يوجد محتوى نصي متاح للقراءة في هذه الصفحة.");
    }
  }, [synth, speak]);

  return (
    <AccessibilityContext.Provider value={{
      ...settings,
      updateSettings,
      speak,
      stopSpeaking,
      vibrate,
      startListening,
      stopListening,
      triggerFlash,
      readMainContent
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
