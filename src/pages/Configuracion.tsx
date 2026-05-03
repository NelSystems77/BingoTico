import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfigStore } from '../stores/configStore';

export default function Configuracion() {
  const navigate = useNavigate();
  const { config, updateConfig, resetConfig } = useConfigStore();
  const [localConfig, setLocalConfig] = useState(config);

  const handleGuardar = () => {
    updateConfig(localConfig);
    navigate('/');
  };

  const handleReset = () => {
    resetConfig();
    setLocalConfig(useConfigStore.getState().config);
  };

  const updateLocal = (key: string, value: any) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Fondo celeste */}
      <div className="fixed inset-0 w-full h-full bg-sky-gradient" style={{ zIndex: 0 }} />
      
      {/* Imagen hero */}
      <div 
        className="fixed inset-0 w-full h-full opacity-20"
        style={{
          backgroundImage: 'url(/assets/hero.jpg)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 1,
        }}
      />
      
      {/* Contenido */}
      <div className="relative min-h-screen flex flex-col items-center p-4 pt-8" style={{ zIndex: 3 }}>
        
        {/* Header */}
        <div className="w-full max-w-md mb-4">
          <button
            onClick={() => navigate('/')}
            className="rounded-md font-bold text-xs transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(10px)',
              color: '#2D2D2D',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            ← Volver
          </button>
        </div>

        {/* Card principal */}
        <div 
          className="rounded-xl overflow-hidden w-full max-w-md"
          style={{ 
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(18px) saturate(180%)',
            boxShadow: '0 10px 35px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          
          {/* Header */}
          <div className="py-3 px-4 text-center" style={{
            background: 'rgba(196, 30, 58, 0.88)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid rgba(255,255,255,0.18)',
          }}>
            <h2 className="text-lg text-white font-bold" style={{
              textShadow: '0 2px 5px rgba(0,0,0,0.6)',
              fontFamily: 'Bebas Neue, sans-serif',
              letterSpacing: '1.2px'
            }}>
              ⚙️ CONFIGURACIÓN
            </h2>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3">
            
            {/* Sonido */}
            <div className="p-3 rounded-lg" style={{
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">🔊 Sonido</span>
                <button
                  onClick={() => updateLocal('sonido', !localConfig.sonido)}
                  className="px-4 py-1 rounded-md text-xs font-bold transition-all"
                  style={{
                    background: localConfig.sonido ? 'rgba(0,155,58,0.9)' : 'rgba(200,200,200,0.7)',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                >
                  {localConfig.sonido ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Voz */}
            <div className="p-3 rounded-lg" style={{
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}>
              <label className="text-sm font-bold text-gray-900 block mb-2">🎤 Voz</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateLocal('voz', 'masculina')}
                  className="py-2 rounded-md text-xs font-bold transition-all"
                  style={{
                    background: localConfig.voz === 'masculina' ? 'rgba(0,102,204,0.9)' : 'rgba(255,255,255,0.5)',
                    color: localConfig.voz === 'masculina' ? 'white' : '#2D2D2D',
                    border: '1px solid rgba(255,255,255,0.4)',
                  }}
                >
                  Masculina
                </button>
                <button
                  onClick={() => updateLocal('voz', 'femenina')}
                  className="py-2 rounded-md text-xs font-bold transition-all"
                  style={{
                    background: localConfig.voz === 'femenina' ? 'rgba(196,30,58,0.9)' : 'rgba(255,255,255,0.5)',
                    color: localConfig.voz === 'femenina' ? 'white' : '#2D2D2D',
                    border: '1px solid rgba(255,255,255,0.4)',
                  }}
                >
                  Femenina
                </button>
              </div>
            </div>

            {/* Extracción */}
            <div className="p-3 rounded-lg" style={{
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}>
              <label className="text-sm font-bold text-gray-900 block mb-2">🎲 Extracción</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateLocal('extraccion', 'automatica')}
                  className="py-2 rounded-md text-xs font-bold transition-all"
                  style={{
                    background: localConfig.extraccion === 'automatica' ? 'rgba(0,155,58,0.9)' : 'rgba(255,255,255,0.5)',
                    color: localConfig.extraccion === 'automatica' ? 'white' : '#2D2D2D',
                    border: '1px solid rgba(255,255,255,0.4)',
                  }}
                >
                  Automática
                </button>
                <button
                  onClick={() => updateLocal('extraccion', 'manual')}
                  className="py-2 rounded-md text-xs font-bold transition-all"
                  style={{
                    background: localConfig.extraccion === 'manual' ? 'rgba(255,193,7,0.9)' : 'rgba(255,255,255,0.5)',
                    color: localConfig.extraccion === 'manual' ? '#1a1a2e' : '#2D2D2D',
                    border: '1px solid rgba(255,255,255,0.4)',
                  }}
                >
                  Manual
                </button>
              </div>
            </div>

            {/* Tiempo de extracción (solo si automática) */}
            {localConfig.extraccion === 'automatica' && (
              <div className="p-3 rounded-lg" style={{
                background: 'rgba(255, 248, 220, 0.4)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,193,7,0.4)',
              }}>
                <label className="text-sm font-bold text-gray-900 block mb-2">
                  ⏱️ Tiempo entre bolas: {localConfig.tiempoExtraccion}s
                </label>
                <input
                  type="range"
                  min="3"
                  max="15"
                  value={localConfig.tiempoExtraccion}
                  onChange={(e) => updateLocal('tiempoExtraccion', Number(e.target.value))}
                  className="w-full"
                  style={{
                    accentColor: 'var(--accent)',
                  }}
                />
                <div className="flex justify-between text-xs text-gray-700 mt-1">
                  <span>3s</span>
                  <span>15s</span>
                </div>
              </div>
            )}

            {/* Repetir bola */}
            <div className="p-3 rounded-lg" style={{
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">🔁 Repetir bola</span>
                <button
                  onClick={() => updateLocal('repetirBola', !localConfig.repetirBola)}
                  className="px-4 py-1 rounded-md text-xs font-bold transition-all"
                  style={{
                    background: localConfig.repetirBola ? 'rgba(0,155,58,0.9)' : 'rgba(200,200,200,0.7)',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                >
                  {localConfig.repetirBola ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Sistema de puntos */}
            <div className="p-3 rounded-lg" style={{
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-900">🏆 Sistema de Puntos</span>
                <button
                  onClick={() => updateLocal('puntos', { ...localConfig.puntos, activado: !localConfig.puntos.activado })}
                  className="px-4 py-1 rounded-md text-xs font-bold transition-all"
                  style={{
                    background: localConfig.puntos.activado ? 'rgba(0,155,58,0.9)' : 'rgba(200,200,200,0.7)',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                >
                  {localConfig.puntos.activado ? 'ON' : 'OFF'}
                </button>
              </div>
              
              {localConfig.puntos.activado && (
                <div className="space-y-2 mt-3">
                  <div>
                    <label className="text-xs font-bold text-gray-900 block mb-1">Puntos Línea:</label>
                    <input
                      type="number"
                      min="10"
                      max="500"
                      step="10"
                      value={localConfig.puntos.linea}
                      onChange={(e) => updateLocal('puntos', { ...localConfig.puntos, linea: Number(e.target.value) })}
                      className="w-full px-2 py-1 rounded text-sm font-bold text-center"
                      style={{
                        background: 'rgba(255,255,255,0.9)',
                        border: '1px solid rgba(0,155,58,0.4)',
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-900 block mb-1">Puntos Bingo:</label>
                    <input
                      type="number"
                      min="50"
                      max="1000"
                      step="10"
                      value={localConfig.puntos.bingo}
                      onChange={(e) => updateLocal('puntos', { ...localConfig.puntos, bingo: Number(e.target.value) })}
                      className="w-full px-2 py-1 rounded text-sm font-bold text-center"
                      style={{
                        background: 'rgba(255,255,255,0.9)',
                        border: '1px solid rgba(0,155,58,0.4)',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={handleReset}
                className="py-2 rounded-md font-bold text-sm transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(255,230,230,0.7)',
                  backdropFilter: 'blur(10px)',
                  color: 'var(--primary)',
                  border: '1px solid rgba(196,30,58,0.3)',
                  boxShadow: '0 2px 8px rgba(196,30,58,0.15)',
                }}
              >
                🔄 Restaurar
              </button>
              <button
                onClick={handleGuardar}
                className="py-2 rounded-md font-bold text-sm transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(0,155,58,0.92)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 6px 20px rgba(0,155,58,0.4)',
                  textShadow: '0 2px 5px rgba(0,0,0,0.4)',
                }}
              >
                ✅ Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
