import React, { useRef, useState } from 'react';
import { useStore } from '../store';

const SantaClausIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Beard (The cloud shape) */}
    <path d="M25 50C25 75 35 90 50 90C65 90 75 75 75 50" fill="white" />
    <circle cx="30" cy="65" r="10" fill="white" />
    <circle cx="40" cy="78" r="12" fill="white" />
    <circle cx="50" cy="82" r="12" fill="white" />
    <circle cx="60" cy="78" r="12" fill="white" />
    <circle cx="70" cy="65" r="10" fill="white" />
    
    {/* Face & Ears */}
    <circle cx="25" cy="55" r="7" fill="#FAD1C5" />
    <circle cx="75" cy="55" r="7" fill="#FAD1C5" />
    <rect x="25" y="45" width="50" height="20" rx="4" fill="#FAD1C5" />
    
    {/* Mustache */}
    <path d="M32 60C40 65 60 65 68 60C60 72 40 72 32 60Z" fill="white" />
    
    {/* Mouth */}
    <path d="M46 64C48 70 52 70 54 64Z" fill="#F9C3C3" />
    
    {/* Eyes */}
    <circle cx="40" cy="53" r="3.5" fill="#3D2B3D" />
    <circle cx="60" cy="53" r="3.5" fill="#3D2B3D" />

    {/* Hat Trim */}
    <rect x="22" y="38" width="56" height="10" rx="5" fill="white" />
    
    {/* Hat */}
    <path d="M28 38C35 15 65 15 72 38" fill="#B22222" />
    {/* Hat Pom-pom */}
    <circle cx="23" cy="28" r="8" fill="white" />
  </svg>
);

const ChristmasBellIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Top Ring */}
    <path d="M45 25C45 22 47 20 50 20C53 20 55 22 55 25V30H45V25Z" fill="#B8860B" />
    
    {/* Bell Body */}
    <path 
      d="M50 30C35 30 25 45 20 70C20 78 30 85 50 85C70 85 80 78 80 70C75 45 65 30 50 30Z" 
      fill="url(#bell_gold)" 
      stroke="#8B4513" 
      strokeWidth="0.5" 
    />
    
    {/* Clapper (Ball) */}
    <circle cx="50" cy="82" r="6" fill="url(#clapper_gold)" />
    
    {/* Inner detail/rim */}
    <path d="M22 72C30 78 70 78 78 72" stroke="#8B4513" strokeWidth="0.5" opacity="0.4" />

    {/* Big Red Bow on Top */}
    <g transform="translate(0, -2)">
      {/* Left Loop */}
      <path d="M50 35C50 35 30 20 22 30C15 40 30 50 50 40Z" fill="url(#bow_red)" stroke="#800000" strokeWidth="0.4" />
      {/* Right Loop */}
      <path d="M50 35C50 35 70 20 78 30C85 40 70 50 50 40Z" fill="url(#bow_red)" stroke="#800000" strokeWidth="0.4" />
      {/* Center Knot */}
      <rect x="44" y="32" width="12" height="10" rx="4" fill="#D42426" stroke="#800000" strokeWidth="0.4" />
      {/* Ribbon Tails */}
      <path d="M46 40L35 60" stroke="#D42426" strokeWidth="3" strokeLinecap="round" />
      <path d="M54 40L65 60" stroke="#D42426" strokeWidth="3" strokeLinecap="round" />
    </g>
    
    <defs>
      <linearGradient id="bell_gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFACD" />
        <stop offset="40%" stopColor="#FFD700" />
        <stop offset="80%" stopColor="#DAA520" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
      <linearGradient id="clapper_gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#8B4513" />
      </linearGradient>
      <linearGradient id="bow_red" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF4D4D" />
        <stop offset="50%" stopColor="#D42426" />
        <stop offset="100%" stopColor="#800000" />
      </linearGradient>
    </defs>
  </svg>
);

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
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => {
            console.log("No music loaded or autoplay blocked", e);
            if (!audioRef.current?.src || audioRef.current.src === window.location.href) {
                musicInputRef.current?.click();
            }
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const getCursorStyle = () => {
    if (handData.isPinching) return 'text-red-600 drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] scale-90';
    if (handData.isFist) return 'text-red-500 drop-shadow-[0_0_10px_rgba(255,100,100,0.6)]';
    if (handData.isOpen) return 'text-rose-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] scale-125';
    return 'text-red-300 opacity-50';
  };

  return (
    <>
      <audio ref={audioRef} loop />

      {/* Top Center: Title */}
      <div className="fixed top-6 sm:top-10 w-full z-10 pointer-events-none flex flex-col items-center justify-center select-none">
        <h1 className="font-british text-3xl sm:text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-amber-500 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)] tracking-widest opacity-95 text-center px-4">
          Merry Christmas
        </h1>
        <p className="font-british text-amber-200/40 text-[10px] sm:text-xs tracking-[0.4em] mt-1 sm:mt-2 uppercase">The Golden Dream</p>
      </div>

      {/* Hand Cursor Visualizer */}
      {handData.detected && (
        <div 
          className={`hand-cursor transition-all duration-200 ease-out z-[100] ${getCursorStyle()} w-10 h-10 sm:w-14 sm:h-14`}
          style={{
            left: `${handData.x * 100}%`,
            top: `${handData.y * 100}%`,
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full filter drop-shadow-sm">
             <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      )}

      {/* Responsive Control Center */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-10 md:translate-x-0 z-30 pointer-events-auto">
        <div className="flex flex-row md:flex-col items-center gap-4 bg-black/40 backdrop-blur-xl p-2 sm:p-3 rounded-full md:rounded-3xl border border-amber-500/20 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          
          {/* Add Photos Button with Santa Claus Icon */}
          <div className="relative group">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-black rounded-full md:rounded-2xl text-white shadow-lg active:scale-95 transition-all duration-300 hover:shadow-amber-500/20 border border-white/10 hover:bg-neutral-900"
              title="Add Memories"
            >
              <SantaClausIcon className="w-10 h-10 sm:w-14 sm:h-14" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              multiple
              onChange={handleFileChange} 
            />
            <span className="hidden md:block absolute left-20 top-1/2 -translate-y-1/2 bg-black/80 text-amber-100 text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-amber-500/30">
              Add Photos
            </span>
          </div>

          {/* Music Controller with Christmas Bell */}
          <div className="relative group">
            <button 
              onClick={toggleMusic}
              className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full md:rounded-2xl border transition-all duration-300 active:scale-95 ${isPlaying ? 'bg-amber-500/30 border-amber-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              title="Toggle Music"
            >
              <ChristmasBellIcon className={`w-10 h-10 sm:w-14 sm:h-14 ${isPlaying ? 'animate-jingle' : 'opacity-70 hover:opacity-100'}`} />
            </button>
            
            <button
               onClick={(e) => {
                 e.stopPropagation();
                 musicInputRef.current?.click();
               }}
               className="absolute -top-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-amber-500 hover:bg-amber-400 rounded-full flex items-center justify-center text-black border-2 border-black/50 shadow-lg transition-transform active:scale-75 z-10"
               title="Upload MP3"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth="4">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </button>

            <input 
              type="file" 
              ref={musicInputRef} 
              className="hidden" 
              accept="audio/*, .mp3, audio/mpeg" 
              onChange={handleMusicChange} 
            />
            <span className="hidden md:block absolute left-20 top-1/2 -translate-y-1/2 bg-black/80 text-amber-100 text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-amber-500/30">
              Music Control
            </span>
          </div>

          {photos.length > 0 && <div className="w-[1px] h-8 md:h-[1px] md:w-8 bg-white/10 mx-1"></div>}

          {/* Clear Button */}
          {photos.length > 0 && (
            <div className="relative group">
              <button 
                onClick={clearPhotos}
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/5 hover:bg-red-500/20 rounded-full md:rounded-xl text-white/40 hover:text-red-400 transition-all duration-300 border border-white/5 hover:border-red-500/30"
                title="Clear Memories"
              >
                <span className="text-lg">✖</span>
              </button>
              <span className="hidden md:block absolute left-20 top-1/2 -translate-y-1/2 bg-black/80 text-amber-100 text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-amber-500/30">
                Clear All
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};