import React, { useRef, useState } from 'react';
import { useStore } from '../store';

export const UIOverlay: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const { addPhotos, clearPhotos, handData, photos } = useStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newUrls = Array.from(e.target.files).map((file: any) => URL.createObjectURL(file));
      addPhotos(newUrls);
      e.target.value = '';
    }
  };

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && audioRef.current) {
      const url = URL.createObjectURL(e.target.files[0]);
      audioRef.current.src = url;
      setIsPlaying(true);
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
            if (error.name !== 'AbortError') {
                console.error("Playback failed:", error);
                setIsPlaying(false);
            }
        });
      }
    }
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                if (error.name !== 'AbortError') {
                    console.error("Playback failed:", error);
                    setIsPlaying(false);
                }
            });
        }
        setIsPlaying(true);
      }
    }
  };

  // Cursor style
  const getCursorColor = () => {
    if (handData.isPinching) return 'bg-white border-2 border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.8)]';
    if (handData.isFist) return 'bg-red-600 border-2 border-amber-400 shadow-[0_0_15px_rgba(220,38,38,0.8)]';
    if (handData.isOpen) return 'bg-amber-400 border-2 border-white shadow-[0_0_15px_rgba(251,191,36,0.8)]';
    return 'bg-gray-400 border border-white/50';
  };

  const getCursorSize = () => {
    return handData.isPinching ? 'w-4 h-4' : 'w-8 h-8';
  };

  return (
    <>
      <audio ref={audioRef} loop />

      {/* Top Center: Title */}
      <div className="fixed top-8 w-full z-10 pointer-events-none flex flex-col items-center justify-center">
        <h1 className="font-british text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-amber-500 drop-shadow-[0_0_25px_rgba(251,191,36,0.6)] tracking-widest opacity-90">
          Merry Christmas
        </h1>
      </div>

      {/* Hand Cursor Visualizer */}
      {handData.detected && (
        <div 
          className={`hand-cursor rounded-full transition-all duration-100 ease-out z-[100] ${getCursorColor()} ${getCursorSize()}`}
          style={{
            left: `${handData.x * 100}%`,
            top: `${handData.y * 100}%`,
          }}
        />
      )}

      {/* Bottom Center: Control Bar */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <div className="flex items-center gap-6 px-8 py-3 bg-black/60 backdrop-blur-xl rounded-full border border-amber-500/30 shadow-[0_0_40px_rgba(0,0,0,0.6),0_0_15px_rgba(245,158,11,0.15)] transition-transform hover:scale-105 duration-300">
          
          {/* Add Photos Button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="relative group w-12 h-12 flex items-center justify-center bg-gradient-to-b from-red-800 to-red-950 rounded-full border border-red-500/40 shadow-lg hover:shadow-[0_0_20px_rgba(220,38,38,0.6)] hover:border-red-400 transition-all duration-300"
          >
            <span className="text-xl transform group-hover:scale-110 transition-transform">📷</span>
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-amber-100 text-[10px] px-2 py-1 rounded border border-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none backdrop-blur-sm">
              Add Photo
            </span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            multiple
            onChange={handleFileChange} 
          />

          {/* Divider */}
          <div className="w-px h-8 bg-white/10"></div>

          {/* Music Control Group */}
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleMusic}
              className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all duration-300 ${isPlaying ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}`}
            >
              {isPlaying ? (
                <div className="flex gap-0.5 h-3 items-end">
                   <div className="w-0.5 bg-amber-300 animate-[bounce_1s_infinite]"></div>
                   <div className="w-0.5 bg-amber-300 animate-[bounce_1.2s_infinite]"></div>
                   <div className="w-0.5 bg-amber-300 animate-[bounce_0.8s_infinite]"></div>
                </div>
              ) : (
                <span className="text-lg ml-0.5">▶</span>
              )}
            </button>
            
            <button
               onClick={() => musicInputRef.current?.click()}
               className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-amber-300 hover:border-amber-500/50 transition-all"
               title="Change Song"
            >
              <span className="text-xs">♫</span>
            </button>
            <input 
              type="file" 
              ref={musicInputRef} 
              className="hidden" 
              accept="audio/*" 
              onChange={handleMusicChange} 
            />
          </div>

          {/* Clear Button (Conditional) */}
          {photos.length > 0 && (
            <>
              <div className="w-px h-8 bg-white/10"></div>
              <button 
                onClick={clearPhotos}
                className="text-xs text-white/40 hover:text-red-400 transition-colors uppercase tracking-wider font-semibold hover:underline decoration-red-400/50 underline-offset-4"
              >
                Clear
              </button>
            </>
          )}

        </div>
      </div>
    </>
  );
};