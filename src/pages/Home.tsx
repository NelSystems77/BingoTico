import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TipoJuego } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const [tipoJuego, setTipoJuego] = useState<TipoJuego>(90);
  const [numBolasCustom, setNumBolasCustom] = useState<number>(90);

  const handleIniciar = () => {
    const numBolas = tipoJuego === 'custom' ? numBolasCustom : tipoJuego;
    navigate('/crear-evento', { state: { tipoJuego, numBolas } });
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Fondo celeste */}
      <div className="fixed inset-0 w-full h-full bg-sky-gradient" style={{ zIndex: 0 }} />
      
      {/* Imagen hero */}
      <div 
        className="fixed inset-0 w-full h-full"
        style={{
          backgroundImage: 'url(/assets/hero.jpg)',
          backgroundSize: 'contain',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          zIndex: 1,
        }}
      />

      {/* Gradiente de difuminado inferior — suaviza el corte de la imagen */}
      <div
        className="fixed inset-x-0 bottom-0"
        style={{
          height: '55%',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(135,206,235,0.55) 40%, rgba(100,185,220,0.82) 70%, rgba(80,170,210,0.96) 100%)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
      
      {/* Overlay radial muy sutil */}
      <div className="fixed inset-0 w-full h-full" style={{ 
        background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.08) 100%)',
        zIndex: 3,
        pointerEvents: 'none',
      }} />

      {/* Contenido - PEGADO ABAJO */}
      <div className="relative min-h-screen flex flex-col justify-end items-center pb-2" style={{ zIndex: 4 }}>

        {/* Card glassmorphism — fondo muy translúcido para ver la imagen */}
        <div 
          className="rounded-xl overflow-hidden"
          style={{ 
            width: '75%',
            maxWidth: '420px',
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(14px) saturate(160%)',
            WebkitBackdropFilter: 'blur(14px) saturate(160%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.22)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
          }}
        >
          
          {/* Header */}
          <div className="py-1 px-3 text-center" style={{
            background: 'rgba(196, 30, 58, 0.72)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255,255,255,0.18)',
          }}>
            <h2 className="text-sm sm:text-base text-white font-bold" style={{
              textShadow: '0 2px 5px rgba(0,0,0,0.6)',
              fontFamily: 'Bebas Neue, sans-serif',
              letterSpacing: '1.2px'
            }}>
              SELECCIONA EL JUEGO
            </h2>
          </div>

          {/* Body */}
          <div className="px-2.5 py-2">
            
            {/* Botones de selección */}
            <div className="space-y-1 mb-1.5">
              
              {/* Bingo 90 */}
              <button
                onClick={() => setTipoJuego(90)}
                className="w-full rounded-md font-bold text-[11px] sm:text-xs transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  padding: '6px 10px',
                  background: tipoJuego === 90 
                    ? 'rgba(196, 30, 58, 0.72)'
                    : 'rgba(255, 255, 255, 0.18)',
                  backdropFilter: 'blur(12px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(12px) saturate(160%)',
                  color: tipoJuego === 90 ? '#FFFFFF' : '#1a1a1a',
                  boxShadow: tipoJuego === 90
                    ? '0 4px 16px rgba(196,30,58,0.35), 0 0 0 1px rgba(255,255,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'
                    : '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.28), inset 0 1px 0 rgba(255,255,255,0.35)',
                  border: tipoJuego === 90
                    ? '1px solid rgba(255, 255, 255, 0.25)'
                    : '1px solid rgba(255, 255, 255, 0.22)',
                  textShadow: tipoJuego === 90 ? '0 1px 3px rgba(0,0,0,0.5)' : '0 1px 2px rgba(255,255,255,0.6)',
                }}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-sm">🎰</span>
                  <span>Bingo 90</span>
                  <span className="text-[9px] opacity-75">(Tradicional)</span>
                </div>
              </button>

              {/* Bingo 75 */}
              <button
                onClick={() => setTipoJuego(75)}
                className="w-full rounded-md font-bold text-[11px] sm:text-xs transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  padding: '6px 10px',
                  background: tipoJuego === 75
                    ? 'rgba(0, 102, 204, 0.72)'
                    : 'rgba(255, 255, 255, 0.18)',
                  backdropFilter: 'blur(12px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(12px) saturate(160%)',
                  color: tipoJuego === 75 ? '#FFFFFF' : '#1a1a1a',
                  boxShadow: tipoJuego === 75
                    ? '0 4px 16px rgba(0,102,204,0.35), 0 0 0 1px rgba(255,255,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'
                    : '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.28), inset 0 1px 0 rgba(255,255,255,0.35)',
                  border: tipoJuego === 75
                    ? '1px solid rgba(255, 255, 255, 0.25)'
                    : '1px solid rgba(255, 255, 255, 0.22)',
                  textShadow: tipoJuego === 75 ? '0 1px 3px rgba(0,0,0,0.5)' : '0 1px 2px rgba(255,255,255,0.6)',
                }}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-sm">🎲</span>
                  <span>Bingo 75</span>
                  <span className="text-[9px] opacity-75">(Americano)</span>
                </div>
              </button>

              {/* Personalizado */}
              <button
                onClick={() => setTipoJuego('custom')}
                className="w-full rounded-md font-bold text-[11px] sm:text-xs transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  padding: '6px 10px',
                  background: tipoJuego === 'custom'
                    ? 'rgba(255, 193, 7, 0.72)'
                    : 'rgba(255, 255, 255, 0.18)',
                  backdropFilter: 'blur(12px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(12px) saturate(160%)',
                  color: tipoJuego === 'custom' ? '#1a1a2e' : '#1a1a1a',
                  boxShadow: tipoJuego === 'custom'
                    ? '0 4px 16px rgba(255,193,7,0.35), 0 0 0 1px rgba(255,255,255,0.25), inset 0 1px 0 rgba(255,255,255,0.25)'
                    : '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.28), inset 0 1px 0 rgba(255,255,255,0.35)',
                  border: tipoJuego === 'custom'
                    ? '1px solid rgba(255, 255, 255, 0.25)'
                    : '1px solid rgba(255, 255, 255, 0.22)',
                  textShadow: tipoJuego === 'custom' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 2px rgba(255,255,255,0.6)',
                }}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-sm">⚙️</span>
                  <span>Personalizado</span>
                </div>
              </button>
            </div>

            {/* Input Custom */}
            {tipoJuego === 'custom' && (
              <div className="mb-1.5 p-1.5 rounded-md" style={{
                background: 'rgba(255, 248, 220, 0.3)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,193,7,0.35)',
                boxShadow: '0 2px 8px rgba(255,193,7,0.15)',
              }}>
                <label className="block text-[9px] font-bold text-gray-900 mb-1" style={{
                  textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                }}>
                  Número de Bolas (1-90):
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={numBolasCustom}
                  onChange={(e) => setNumBolasCustom(Number(e.target.value))}
                  className="w-full px-2 py-0.5 rounded text-xs font-bold text-center focus:outline-none"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.85)',
                    border: '1px solid rgba(255,193,7,0.5)',
                    boxShadow: '0 1px 4px rgba(255,193,7,0.2)',
                  }}
                />
              </div>
            )}

            {/* Botón Comenzar */}
            <button
              onClick={handleIniciar}
              className="w-full rounded-md font-bold text-xs sm:text-sm transition-all duration-300 hover:scale-[1.03] hover:shadow-xl active:scale-[0.97] mb-1.5"
              style={{
                padding: '8px 10px',
                background: 'rgba(0, 155, 58, 0.80)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: 'white',
                boxShadow: '0 5px 18px rgba(0,155,58,0.4), 0 0 0 1px rgba(255,255,255,0.22), inset 0 1px 0 rgba(255,255,255,0.25)',
                textShadow: '0 2px 5px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
              }}
            >
              <span className="flex items-center justify-center gap-1.5">
                <span className="text-base">🎉</span>
                <span>¡Comenzar!</span>
              </span>
            </button>

            {/* Botones Navegación */}
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => navigate('/configuracion')}
                className="rounded-md font-semibold text-[9px] transition-all duration-300 hover:scale-[1.03] hover:shadow-lg active:scale-[0.97]"
                style={{
                  padding: '5px 6px',
                  background: 'rgba(255, 220, 220, 0.30)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  color: 'rgba(180, 20, 45, 0.95)',
                  border: '1px solid rgba(196,30,58,0.25)',
                  boxShadow: '0 2px 5px rgba(196,30,58,0.1), inset 0 1px 0 rgba(255,255,255,0.3)',
                  textShadow: '0 1px 2px rgba(255,255,255,0.5)',
                }}
              >
                ⚙️ Configuración
              </button>
              <button
                onClick={() => navigate('/generar-cartones')}
                className="rounded-md font-semibold text-[9px] transition-all duration-300 hover:scale-[1.03] hover:shadow-lg active:scale-[0.97]"
                style={{
                  padding: '5px 6px',
                  background: 'rgba(210, 230, 255, 0.30)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  color: 'rgba(0, 80, 180, 0.95)',
                  border: '1px solid rgba(0,102,204,0.25)',
                  boxShadow: '0 2px 5px rgba(0,102,204,0.1), inset 0 1px 0 rgba(255,255,255,0.3)',
                  textShadow: '0 1px 2px rgba(255,255,255,0.5)',
                }}
              >
                🎫 Cartones
              </button>
            </div>
          </div>
        </div>

        {/* Logo pequeño - debajo del card */}
        <div className="mt-1.5">
          <img 
            src="/icon-128.png" 
            alt="NelSystems" 
            className="rounded-full transition-all duration-300 hover:scale-110 hover:rotate-6"
            style={{ 
              width: '44px',
              height: '44px',
              boxShadow: '0 3px 12px rgba(0,0,0,0.25), 0 0 0 2px rgba(255,255,255,0.5)',
              filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.4))'
            }}
          />
        </div>

      </div>
    </div>
  );
}
