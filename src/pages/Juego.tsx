import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { useConfigStore } from '../stores/configStore';
import { SorteoEngine } from '../core/game-engine/core/sorteo.engine';
import {
  obtenerLlamadaBola,
  hablarNumeroConAudio,
  detenerKeepAliveIOS,
} from '../utils/bingo';
import { precargarGenero, desbloquearAudioContext, limpiarCacheGenero, vozTieneCoberturaTotalMP3, obtenerRangoVoz } from '../services/audioService';
import type { GeneroAudio } from '../services/audioService';
import { detenerTodoAudio } from '../utils/bingo';
import { firebaseService } from '../services/firebase';
import type { Partida } from '../types';

export default function Juego() {
  const navigate = useNavigate();
  const { evento } = useGameStore();
  const { config } = useConfigStore();

  const [sorteo, setSorteo] = useState<SorteoEngine | null>(null);
  const [bolaActual, setBolaActual] = useState<number | null>(null);
  const [bolasExtraidas, setBolasExtraidas] = useState<number[]>([]);
  const [jugando, setJugando] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [partida, setPartida] = useState<Partida | null>(null);
  /** Progreso de precarga de audio (0–100). 100 = listo. */
  const [progresoCarga, setProgresoCarga] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // Ref para acceder al partida actual dentro del intervalo sin stale closure
  const partidaRef = useRef<Partida | null>(null);
  useEffect(() => { partidaRef.current = partida; }, [partida]);

  // Ref para extraerBola — evita stale closure en el setInterval de auto-extracción.
  // Se actualiza en cada render para que el intervalo siempre llame a la versión
  // más reciente de extraerBola (con el config.voz actual).
  const extraerBolaRef = useRef<() => void>(() => {});

  // ── iOS Safari: desbloquear AudioContext en CADA gesto del usuario ──────
  // No usar guard de "solo una vez" — iOS puede suspender el AudioContext
  // al volver de background, y necesitamos re-desbloquearlo con cada tap.
  const desbloquearAudio = () => {
    desbloquearAudioContext();
  };

  // ── Precarga lazy de audio al montar el componente ───────────────
  // Se inicia en segundo plano según el género configurado.
  // Cuando cambia la voz (config.voz), se limpia el cache del género
  // anterior y se reinicia la precarga para el nuevo género.
  // El juego puede comenzar antes de que termine; si un número se
  // solicita antes de que su MP3 esté listo, audioService lo carga
  // al vuelo sin necesidad de TTS como fallback.
  const vozAnteriorRef = useRef<GeneroAudio | null>(null);

  useEffect(() => {
    if (!config.sonido) {
      setProgresoCarga(100); // sin sonido → marcar como listo
      return;
    }

    const genero: GeneroAudio = config.voz;

    // Si la voz cambió respecto a la anterior, limpiar cache del género
    // anterior para forzar recarga con las URLs correctas
    if (vozAnteriorRef.current && vozAnteriorRef.current !== genero) {
      const generoAnterior = vozAnteriorRef.current;
      limpiarCacheGenero(generoAnterior);
      setProgresoCarga(0); // reiniciar barra de progreso
      console.log(`[Juego] Voz cambiada de "${generoAnterior}" a "${genero}" — recargando audio`);
    }
    vozAnteriorRef.current = genero;

    precargarGenero(genero, (cargados, total) => {
      setProgresoCarga(Math.round((cargados / total) * 100));
    });
  }, [config.voz, config.sonido]);

  // ── Inicializar sorteo ───────────────────────────────────────────
  useEffect(() => {
    if (!evento) {
      navigate('/');
      return;
    }

    const engine = new SorteoEngine(evento.numBolas);
    setSorteo(engine);

    // Crear partida — solo en Firebase si el evento NO es local
    const nuevaPartida: Omit<Partida, 'id'> = {
      eventoId: evento.id,
      bolasExtraidas: [],
      configuracion: config,
      ganadores: {},
      estado: 'activa',
    };

    if (!evento.id.startsWith('local-')) {
      firebaseService.createPartida(nuevaPartida).then(id => {
        setPartida({ ...nuevaPartida, id });
      });
    } else {
      setPartida({ ...nuevaPartida, id: `local-partida-${Date.now()}` });
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      detenerTodoAudio();
      detenerKeepAliveIOS();
    };
  }, []);

  // ── Lógica de extracción ─────────────────────────────────────────
  const extraerBola = () => {
    if (!sorteo || !sorteo.hayBolasPendientes()) {
      setJugando(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const nuevaBola = sorteo.sortearBola();
    setBolaActual(nuevaBola);
    setBolasExtraidas([...sorteo.getBolasSorteadas()]);

    // Reproducir audio MP3 (lazy loading) con fallback a TTS
    if (config.sonido) {
      hablarNumeroConAudio(nuevaBola, config.voz);
    }

    // Actualizar partida en Firebase (solo si no es local)
    const p = partidaRef.current;
    if (p && !p.id.startsWith('local-')) {
      firebaseService.updatePartida(p.id, {
        bolasExtraidas: [...sorteo.getBolasSorteadas()],
      });
    }
  };

  // Mantener el ref siempre actualizado con la versión más reciente de extraerBola.
  // Esto garantiza que el setInterval del modo automático siempre use el config.voz
  // actual (sin stale closure), incluso si el usuario cambia la voz durante el juego.
  extraerBolaRef.current = extraerBola;

  // ── Auto-extracción ──────────────────────────────────────────────
  useEffect(() => {
    if (jugando && !pausado && config.extraccion === 'automatica' && sorteo) {
      intervalRef.current = setInterval(() => {
        // Llamar siempre a través del ref para evitar stale closure
        extraerBolaRef.current();
      }, config.tiempoExtraccion * 1000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [jugando, pausado, config.extraccion, config.tiempoExtraccion]);

  // ── Handlers de UI ───────────────────────────────────────────────
  const handleIniciar = () => {
    desbloquearAudio();
    setJugando(true);
    setPausado(false);
    // En modo manual el primer sorteo lo dispara el botón EXTRAER BOLA
  };

  const handlePausar = () => {
    desbloquearAudio();
    if (!pausado) detenerTodoAudio(); // detener MP3 al pausar
    setPausado(prev => !prev);
  };

  const handleExtraerManual = () => {
    desbloquearAudio();
    extraerBola();
  };

  const handleRepetirBola = () => {
    desbloquearAudio();
    if (bolaActual && config.sonido) {
      hablarNumeroConAudio(bolaActual, config.voz);
    }
  };

  const handleFinalizar = async () => {
    setJugando(false);
    setPausado(false);
    detenerTodoAudio();

    if (partida && !partida.id.startsWith('local-')) {
      await firebaseService.updatePartida(partida.id, { estado: 'finalizada' });
    }

    if (confirm('¿Deseas volver al inicio?')) {
      navigate('/');
    }
  };

  // ── Guard de carga ───────────────────────────────────────────────
  if (!evento || !sorteo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-bold">Cargando...</p>
      </div>
    );
  }

  const llamada = bolaActual ? obtenerLlamadaBola(bolaActual) : null;
  const progresoJuego = (bolasExtraidas.length / evento.numBolas) * 100;
  const audioPreparado = progresoCarga >= 100;
  const vozConCoberturaTotal = vozTieneCoberturaTotalMP3(config.voz as GeneroAudio);
  const rangoVoz = obtenerRangoVoz(config.voz as GeneroAudio);

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Fondo celeste */}
      <div className="fixed inset-0 w-full h-full bg-sky-gradient" style={{ zIndex: 0 }} />

      {/* Contenido */}
      <div className="relative min-h-screen flex flex-col p-4" style={{ zIndex: 3 }}>

        {/* Header */}
        <div className="w-full max-w-6xl mx-auto mb-4 flex justify-between items-center">
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
            ← Menú
          </button>

          <div className="text-center">
            <h1 className="text-xl font-bold text-white" style={{
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
              fontFamily: 'Bebas Neue, sans-serif',
              letterSpacing: '1.5px',
            }}>
              {evento.nombre}
            </h1>
            <p className="text-xs text-white opacity-90">
              {bolasExtraidas.length} / {evento.numBolas} bolas extraídas
            </p>
            {/* Indicador de precarga de audio */}
            {config.sonido && !audioPreparado && (
              <p className="text-xs text-yellow-200 opacity-80 mt-0.5">
                🎵 Cargando audio {config.voz}… {progresoCarga}%
              </p>
            )}
            {config.sonido && audioPreparado && vozConCoberturaTotal && (
              <p className="text-xs text-green-200 opacity-80 mt-0.5">
                🎵 Audio {config.voz} listo
              </p>
            )}
            {config.sonido && audioPreparado && !vozConCoberturaTotal && (
              <p className="text-xs text-orange-200 opacity-90 mt-0.5">
                🎵 Audio {config.voz}: {rangoVoz.min}–{rangoVoz.max} MP3 · {rangoVoz.max + 1}–75 voz TTS
              </p>
            )}
          </div>

          <button
            onClick={handleFinalizar}
            className="rounded-md font-bold text-xs transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              padding: '6px 12px',
              background: 'rgba(196,30,58,0.9)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 2px 8px rgba(196,30,58,0.3)',
            }}
          >
            🏁 Finalizar
          </button>
        </div>

        {/* Contenedor principal */}
        <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-4 flex-1">

          {/* Panel Izquierdo: Cantado */}
          <div
            className="rounded-xl overflow-hidden flex flex-col"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(18px) saturate(180%)',
              boxShadow: '0 10px 35px rgba(0,0,0,0.25)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            {/* Header Cantado */}
            <div className="py-3 px-4 text-center" style={{
              background: 'rgba(196, 30, 58, 0.88)',
              backdropFilter: 'blur(8px)',
              borderBottom: '1px solid rgba(255,255,255,0.18)',
            }}>
              <h2 className="text-lg text-white font-bold" style={{
                textShadow: '0 2px 5px rgba(0,0,0,0.6)',
                fontFamily: 'Bebas Neue, sans-serif',
                letterSpacing: '1.2px',
              }}>
                🎙️ CANTADO
              </h2>
            </div>

            {/* Bola Actual */}
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              {bolaActual ? (
                <>
                  <div
                    className="rounded-full flex items-center justify-center mb-6 animate-bounce"
                    style={{
                      width: '180px',
                      height: '180px',
                      background: 'linear-gradient(135deg, rgba(255,193,7,0.95) 0%, rgba(255,152,0,0.95) 100%)',
                      boxShadow: '0 10px 40px rgba(255,193,7,0.6), inset 0 4px 12px rgba(255,255,255,0.3)',
                      border: '4px solid rgba(255, 255, 255, 0.8)',
                    }}
                  >
                    <span className="text-7xl font-black text-white" style={{
                      textShadow: '0 4px 12px rgba(0,0,0,0.4)',
                      fontFamily: 'Bebas Neue, sans-serif',
                    }}>
                      {bolaActual}
                    </span>
                  </div>

                  <div className="text-center">
                    <p className="text-3xl font-bold text-white mb-2" style={{
                      textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                      fontFamily: 'Bebas Neue, sans-serif',
                      letterSpacing: '1px',
                    }}>
                      {llamada?.call || `Número ${bolaActual}`}
                    </p>

                    {config.repetirBola && (
                      <button
                        onClick={handleRepetirBola}
                        className="mt-4 px-6 py-2 rounded-md font-bold text-sm transition-all hover:scale-105 active:scale-95"
                        style={{
                          background: 'rgba(255,255,255,0.3)',
                          backdropFilter: 'blur(10px)',
                          color: 'white',
                          border: '1px solid rgba(255, 255, 255, 0.4)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                      >
                        🔁 Repetir
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div
                    className="rounded-full flex items-center justify-center mb-6 mx-auto"
                    style={{
                      width: '180px',
                      height: '180px',
                      background: 'rgba(200, 200, 200, 0.3)',
                      border: '4px dashed rgba(255, 255, 255, 0.5)',
                    }}
                  >
                    <span className="text-6xl">🎰</span>
                  </div>
                  <p className="text-xl font-bold text-white" style={{
                    textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  }}>
                    Presiona INICIAR para comenzar
                  </p>
                </div>
              )}
            </div>

            {/* Controles */}
            <div className="p-4 space-y-2">
              {!jugando ? (
                <button
                  onClick={handleIniciar}
                  className="w-full py-3 rounded-md font-bold text-lg transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: 'rgba(0,155,58,0.92)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 6px 20px rgba(0,155,58,0.5)',
                    textShadow: '0 2px 5px rgba(0,0,0,0.4)',
                  }}
                >
                  🚀 INICIAR
                </button>
              ) : (
                <>
                  {config.extraccion === 'manual' ? (
                    <button
                      onClick={handleExtraerManual}
                      disabled={!sorteo.hayBolasPendientes()}
                      className="w-full py-3 rounded-md font-bold text-lg transition-all hover:scale-105 active:scale-95"
                      style={{
                        background: !sorteo.hayBolasPendientes()
                          ? 'rgba(200,200,200,0.7)'
                          : 'rgba(0,102,204,0.92)',
                        backdropFilter: 'blur(10px)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: !sorteo.hayBolasPendientes()
                          ? '0 2px 8px rgba(0,0,0,0.1)'
                          : '0 6px 20px rgba(0,102,204,0.5)',
                        textShadow: '0 2px 5px rgba(0,0,0,0.4)',
                        cursor: !sorteo.hayBolasPendientes() ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {!sorteo.hayBolasPendientes() ? '✅ COMPLETADO' : '🎲 EXTRAER BOLA'}
                    </button>
                  ) : (
                    <button
                      onClick={handlePausar}
                      className="w-full py-3 rounded-md font-bold text-lg transition-all hover:scale-105 active:scale-95"
                      style={{
                        background: pausado
                          ? 'rgba(0,155,58,0.92)'
                          : 'rgba(255,193,7,0.92)',
                        backdropFilter: 'blur(10px)',
                        color: pausado ? 'white' : '#1a1a2e',
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: pausado
                          ? '0 6px 20px rgba(0,155,58,0.5)'
                          : '0 6px 20px rgba(255,193,7,0.5)',
                        textShadow: '0 2px 5px rgba(0,0,0,0.3)',
                      }}
                    >
                      {pausado ? '▶️ CONTINUAR' : '⏸️ PAUSAR'}
                    </button>
                  )}
                </>
              )}

              {/* Barra de progreso del juego */}
              <div className="w-full h-3 rounded-full overflow-hidden" style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
              }}>
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${progresoJuego}%`,
                    background: 'linear-gradient(90deg, rgba(0,155,58,0.9) 0%, rgba(0,200,80,0.9) 100%)',
                  }}
                />
              </div>

              {/* Mini barra de precarga de audio (visible mientras carga) */}
              {config.sonido && !audioPreparado && (
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{
                  background: 'rgba(255,255,255,0.15)',
                }}>
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${progresoCarga}%`,
                      background: 'linear-gradient(90deg, rgba(255,193,7,0.8) 0%, rgba(255,152,0,0.8) 100%)',
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Panel Derecho: Tablero */}
          <div
            className="rounded-xl overflow-hidden flex flex-col"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(18px) saturate(180%)',
              boxShadow: '0 10px 35px rgba(0,0,0,0.25)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            {/* Header Tablero */}
            <div className="py-3 px-4 text-center" style={{
              background: 'rgba(0, 102, 204, 0.88)',
              backdropFilter: 'blur(8px)',
              borderBottom: '1px solid rgba(255,255,255,0.18)',
            }}>
              <h2 className="text-lg text-white font-bold" style={{
                textShadow: '0 2px 5px rgba(0,0,0,0.6)',
                fontFamily: 'Bebas Neue, sans-serif',
                letterSpacing: '1.2px',
              }}>
                📊 TABLERO
              </h2>
            </div>

            {/* Números */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="grid grid-cols-10 gap-1.5">
                {Array.from({ length: evento.numBolas }, (_, i) => i + 1).map(num => {
                  const extraido = bolasExtraidas.includes(num);
                  const actual = num === bolaActual;

                  return (
                    <div
                      key={num}
                      className="aspect-square rounded-md flex items-center justify-center font-bold text-sm transition-all duration-300"
                      style={{
                        background: actual
                          ? 'linear-gradient(135deg, rgba(255,193,7,0.95) 0%, rgba(255,152,0,0.95) 100%)'
                          : extraido
                          ? 'rgba(0,155,58,0.85)'
                          : 'rgba(255,255,255,0.25)',
                        color: actual || extraido ? 'white' : '#2D2D2D',
                        border: actual
                          ? '2px solid rgba(255,255,255,0.9)'
                          : extraido
                          ? '1px solid rgba(255,255,255,0.4)'
                          : '1px solid rgba(255,255,255,0.3)',
                        boxShadow: actual
                          ? '0 4px 15px rgba(255,193,7,0.6), inset 0 2px 6px rgba(255,255,255,0.3)'
                          : extraido
                          ? '0 2px 8px rgba(0,155,58,0.3)'
                          : '0 1px 3px rgba(0,0,0,0.1)',
                        transform: actual ? 'scale(1.15)' : 'scale(1)',
                        textShadow: actual || extraido
                          ? '0 2px 4px rgba(0,0,0,0.4)'
                          : 'none',
                      }}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Últimas 5 bolas */}
            {bolasExtraidas.length > 0 && (
              <div className="p-4" style={{
                background: 'rgba(255,255,255,0.1)',
                borderTop: '1px solid rgba(255,255,255,0.2)',
              }}>
                <p className="text-xs font-bold text-white mb-2 text-center">
                  Últimas extraídas:
                </p>
                <div className="flex gap-2 justify-center">
                  {bolasExtraidas.slice(-5).reverse().map((num, idx) => (
                    <div
                      key={idx}
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{
                        background: idx === 0
                          ? 'linear-gradient(135deg, rgba(255,193,7,0.95) 0%, rgba(255,152,0,0.95) 100%)'
                          : 'rgba(0,155,58,0.7)',
                        color: 'white',
                        border: '2px solid rgba(255,255,255,0.6)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      }}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
