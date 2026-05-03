import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { firebaseService } from '../services/firebase';
import type { Evento, TipoJuego } from '../types';

export default function CrearEvento() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setEvento } = useGameStore();
  
  const tipoJuego = (location.state?.tipoJuego as TipoJuego) || 90;
  const numBolas = location.state?.numBolas || 90;

  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleCrear = async () => {
    if (!nombre.trim()) {
      alert('Por favor ingresa un nombre para el evento');
      return;
    }

    setLoading(true);
    
    try {
      const evento: Omit<Evento, 'id'> = {
        nombre: nombre.trim(),
        fecha,
        tipoJuego,
        numBolas,
        createdAt: Date.now(),
        shareLink: '', // Se generará con el ID
      };

      const eventoId = await firebaseService.createEvento(evento);
      const shareLink = `${window.location.origin}/generar-cartones?evento=${eventoId}`;
      
      const eventoCompleto: Evento = {
        ...evento,
        id: eventoId,
        shareLink,
      };

      setEvento(eventoCompleto);
      navigate('/generar-cartones', { state: { evento: eventoCompleto } });
    } catch (error) {
      console.error('Error creando evento:', error);
      alert('Error al crear el evento. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
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
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4" style={{ zIndex: 3 }}>
        
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
            background: 'rgba(0, 102, 204, 0.88)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid rgba(255,255,255,0.18)',
          }}>
            <h2 className="text-lg text-white font-bold" style={{
              textShadow: '0 2px 5px rgba(0,0,0,0.6)',
              fontFamily: 'Bebas Neue, sans-serif',
              letterSpacing: '1.2px'
            }}>
              🎊 CREAR EVENTO
            </h2>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            
            {/* Info del tipo de juego */}
            <div className="p-3 rounded-lg text-center" style={{
              background: 'rgba(230, 240, 255, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0,102,204,0.3)',
            }}>
              <div className="text-sm font-bold text-gray-900">
                {tipoJuego === 90 && '🎰 Bingo 90 (Tradicional)'}
                {tipoJuego === 75 && '🎲 Bingo 75 (Americano)'}
                {tipoJuego === 'custom' && `⚙️ Personalizado (${numBolas} bolas)`}
              </div>
              <div className="text-xs text-gray-700 mt-1">
                {numBolas} números
              </div>
            </div>

            {/* Nombre del evento */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                📝 Nombre del Evento:
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Bingo Familiar Navidad"
                maxLength={50}
                className="w-full px-3 py-2 rounded-lg text-sm font-semibold focus:outline-none"
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '2px solid rgba(0,102,204,0.4)',
                  boxShadow: '0 2px 8px rgba(0,102,204,0.15)',
                }}
              />
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                📅 Fecha:
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm font-semibold focus:outline-none"
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '2px solid rgba(0,102,204,0.4)',
                  boxShadow: '0 2px 8px rgba(0,102,204,0.15)',
                }}
              />
            </div>

            {/* Info adicional */}
            <div className="p-3 rounded-lg" style={{
              background: 'rgba(255, 248, 220, 0.5)',
              border: '1px solid rgba(255,193,7,0.3)',
            }}>
              <p className="text-xs text-gray-800 leading-relaxed">
                💡 <strong>Tip:</strong> Una vez creado el evento, podrás compartir un enlace para que los jugadores generen sus cartones.
              </p>
            </div>

            {/* Botones */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => navigate('/')}
                disabled={loading}
                className="py-2.5 rounded-md font-bold text-sm transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(255,230,230,0.7)',
                  backdropFilter: 'blur(10px)',
                  color: 'var(--primary)',
                  border: '1px solid rgba(196,30,58,0.3)',
                  boxShadow: '0 2px 8px rgba(196,30,58,0.15)',
                  opacity: loading ? 0.5 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                ← Cancelar
              </button>
              <button
                onClick={handleCrear}
                disabled={loading || !nombre.trim()}
                className="py-2.5 rounded-md font-bold text-sm transition-all hover:scale-105 active:scale-95"
                style={{
                  background: loading || !nombre.trim() 
                    ? 'rgba(200,200,200,0.7)' 
                    : 'rgba(0,155,58,0.92)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: loading || !nombre.trim()
                    ? '0 2px 8px rgba(0,0,0,0.1)'
                    : '0 6px 20px rgba(0,155,58,0.4)',
                  textShadow: '0 2px 5px rgba(0,0,0,0.4)',
                  cursor: loading || !nombre.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? '⏳ Creando...' : '✨ Crear Evento'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
