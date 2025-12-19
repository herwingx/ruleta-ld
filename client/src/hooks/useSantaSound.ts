import { useRef, useCallback, useEffect } from 'react';

// Sonidos de efectos (se reproducen una vez)
const SOUNDS = {
  hohoho: '/sounds/ohohoh.mp3',
  jingle: '/sounds/jingle.mp3',
  win: '/sounds/win.mp3',
  spin: '/sounds/spin.mp3',
};

// Música de fondo (se reproduce en loop)
const BACKGROUND_MUSIC = '/sounds/loop-merry.mp3';

export type SoundType = keyof typeof SOUNDS;

export function useSantaSound() {
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const playSound = useCallback((type: SoundType, volume = 0.5) => {
    try {
      if (!audioRefs.current[type]) {
        audioRefs.current[type] = new Audio(SOUNDS[type]);
      }

      const audio = audioRefs.current[type];
      audio.volume = volume;
      audio.currentTime = 0;
      audio.play().catch((e) => {
        console.log('Audio no pudo reproducirse:', e);
      });
    } catch (error) {
      console.log('Error reproduciendo sonido:', error);
    }
  }, []);

  const stopSound = useCallback((type: SoundType) => {
    if (audioRefs.current[type]) {
      audioRefs.current[type].pause();
      audioRefs.current[type].currentTime = 0;
    }
  }, []);

  const stopAll = useCallback(() => {
    Object.keys(audioRefs.current).forEach((key) => {
      audioRefs.current[key].pause();
      audioRefs.current[key].currentTime = 0;
    });
  }, []);

  // Obtener duración de un sonido
  const getSoundDuration = useCallback((type: SoundType): Promise<number> => {
    return new Promise((resolve) => {
      if (!audioRefs.current[type]) {
        audioRefs.current[type] = new Audio(SOUNDS[type]);
      }

      const audio = audioRefs.current[type];

      if (audio.duration && !isNaN(audio.duration)) {
        resolve(audio.duration);
      } else {
        audio.addEventListener('loadedmetadata', () => {
          resolve(audio.duration);
        }, { once: true });

        // Fallback si no carga en 2 segundos
        setTimeout(() => resolve(7), 2000);
      }
    });
  }, []);

  return { playSound, stopSound, stopAll, getSoundDuration };
}

// Hook para música de fondo navideña - LOOP NATIVO (más preciso)
export function useBackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const volumeRef = useRef(0.15);

  // Inicializar audio con loop nativo
  useEffect(() => {
    const audio = new Audio(BACKGROUND_MUSIC);
    audio.loop = true; // Loop nativo del navegador - el más preciso
    audio.volume = 0.15; // Volumen bajo para que los efectos se escuchen
    audio.preload = 'auto';
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playMusic = useCallback((volume = 0.15) => {
    if (audioRef.current && !isPlayingRef.current) {
      volumeRef.current = volume;
      audioRef.current.volume = volume;
      audioRef.current.play().then(() => {
        isPlayingRef.current = true;
      }).catch((e) => {
        console.log('Música de fondo no pudo reproducirse:', e);
      });
    }
  }, []);

  const pauseMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      isPlayingRef.current = false;
    }
  }, []);

  const stopMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      isPlayingRef.current = false;
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    volumeRef.current = Math.max(0, Math.min(1, volume));
    if (audioRef.current) {
      audioRef.current.volume = volumeRef.current;
    }
  }, []);

  const toggleMusic = useCallback(() => {
    if (isPlayingRef.current) {
      pauseMusic();
    } else {
      playMusic(volumeRef.current);
    }
  }, [playMusic, pauseMusic]);

  return {
    playMusic,
    pauseMusic,
    stopMusic,
    setVolume,
    toggleMusic
  };
}
