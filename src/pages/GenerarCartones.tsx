import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import type { ModoCartones } from '../stores/gameStore';
import { firebaseService } from '../services/firebase';
import { generarCodigoCarton, generarQRCode } from '../utils/bingo';
import { CartonGenerator } from '../core/game-engine/core/carton.generator';
import type { Evento, Carton as CartonApp } from '../types';
import jsPDF from 'jspdf';

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Genera un cartón digital completo:
 *  1. Usa CartonGenerator del engine para obtener la grilla de números.
 *  2. Mapea al tipo CartonApp (src/types) que usa el resto de la app.
 *  3. Guarda en Firebase con la serialización segura (sin arrays anidados).
 */
async function generarCartonDigital(
  evento: Evento,
  generator: CartonGenerator,
  index: number,
): Promise<CartonApp> {
  // El engine espera { tipo, numerosBolas }
  const resultado = await generator.generarCartonUnico(
    { tipo: evento.tipoJuego, numerosBolas: evento.numBolas },
    `jugador-${Date.now()}-${index}`,
  );

  const codigo = generarCodigoCarton();
  const qrData = JSON.stringify({
    eventoId: evento.id,
    codigo,
    hash: resultado.hash,
  });
  const qrCode = await generarQRCode(qrData);

  const carton: CartonApp = {
    id: resultado.carton.id,
    eventoId: evento.id,
    codigo,
    qrCode,
    // resultado.carton.numeros ya es number[][] — listo para usar en la UI
    numeros: resultado.carton.numeros,
    formato: 'lleno',
    createdAt: Date.now(),
  };

  return carton;
}

// ─── component ──────────────────────────────────────────────────────────────

export default function GenerarCartones() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { evento: eventoStore, setEvento, addCarton, modoCartones, setModoCartones } =
    useGameStore();

  const [evento, setEventoLocal] = useState<Evento | null>(eventoStore);
  const [cantidad, setCantidad] = useState(1);
  const [cartonesGenerados, setCartonesGenerados] = useState<CartonApp[]>([]);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar evento si viene por URL o por location.state
  useEffect(() => {
    const eventoId = searchParams.get('evento');

    if (eventoId && !evento) {
      // Solo buscar en Firebase si NO es un ID local
      if (!eventoId.startsWith('local-')) {
        firebaseService.getEvento(eventoId).then((e) => {
          if (e) {
            setEventoLocal(e);
            setEvento(e);
          }
        });
      }
    } else if (location.state?.evento) {
      setEventoLocal(location.state.evento);
      setEvento(location.state.evento);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleGenerar = async () => {
    if (!evento) return;
    setError(null);
    setGenerando(true);

    // Reutilizamos el mismo generator para que detecte duplicados entre cartones
    const generator = new CartonGenerator();
    const cartones: CartonApp[] = [];

    try {
      for (let i = 0; i < cantidad; i++) {
        const carton = await generarCartonDigital(evento, generator, i);
        cartones.push(carton);

        // Persistir en Firebase (serialización segura sin arrays anidados)
        await firebaseService.saveCarton(carton);
        addCarton(carton);
      }

      setCartonesGenerados(cartones);
    } catch (err) {
      console.error('Error generando cartones:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Error desconocido al generar cartones.',
      );
    } finally {
      setGenerando(false);
    }
  };

  const handleDescargarPDF = () => {
    if (cartonesGenerados.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const cardWidth = (pageWidth - margin * 3) / 2; // 2 cartones por fila
    const cardHeight = cardWidth * 1.3;

    cartonesGenerados.forEach((carton, index) => {
      if (index > 0 && index % 4 === 0) {
        doc.addPage();
      }

      const col = index % 2;
      const row = Math.floor((index % 4) / 2);
      const x = margin + col * (cardWidth + margin);
      const y = margin + row * (cardHeight + margin);

      // Marco
      doc.setDrawColor(196, 30, 58);
      doc.setLineWidth(0.5);
      doc.rect(x, y, cardWidth, cardHeight);

      // Header rojo
      doc.setFillColor(196, 30, 58);
      doc.rect(x, y, cardWidth, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('BINGOTICO', x + cardWidth / 2, y + 8, { align: 'center' });

      // Código
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.text(carton.codigo, x + cardWidth / 2, y + 18, { align: 'center' });

      // Grilla de números
      doc.setFontSize(10);
      const cols = carton.numeros[0]?.length ?? 9;
      const cellWidth = cardWidth / cols;
      const cellHeight = 8;
      const startY = y + 25;

      carton.numeros.forEach((fila, filaIdx) => {
        fila.forEach((num, colIdx) => {
          const cellX = x + colIdx * cellWidth;
          const cellY = startY + filaIdx * cellHeight;
          doc.setDrawColor(200, 200, 200);
          doc.rect(cellX, cellY, cellWidth, cellHeight);
          if (num !== 0) {
            doc.text(
              num.toString(),
              cellX + cellWidth / 2,
              cellY + cellHeight / 2 + 2,
              { align: 'center' },
            );
          }
        });
      });

      // QR
      if (carton.qrCode) {
        const qrSize = 20;
        const qrX = x + (cardWidth - qrSize) / 2;
        const qrY = y + cardHeight - qrSize - 5;
        doc.addImage(carton.qrCode, 'PNG', qrX, qrY, qrSize, qrSize);
      }
    });

    doc.save(`BingoTico-Cartones-${evento?.nombre ?? 'evento'}.pdf`);
  };

  const handleCompartirEnlace = async () => {
    if (!evento) return;
    const enlace = `${window.location.origin}/generar-cartones?evento=${evento.id}`;

    if (navigator.share) {
      await navigator.share({
        title: `Evento: ${evento.nombre}`,
        text: 'Genera tu cartón de bingo',
        url: enlace,
      });
    } else {
      await navigator.clipboard.writeText(enlace);
      alert('¡Enlace copiado al portapapeles!');
    }
  };

  // ── loading state ─────────────────────────────────────────────────────────

  if (!evento) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold mb-4">Cargando evento...</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-md bg-blue-500 text-white font-bold"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────

  const esFisico = modoCartones === 'fisico';

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Fondo */}
      <div className="fixed inset-0 w-full h-full bg-sky-gradient" style={{ zIndex: 0 }} />
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

        {/* Botón volver */}
        <div className="w-full max-w-2xl mb-4">
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
          className="rounded-xl overflow-hidden w-full max-w-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(18px) saturate(180%)',
            boxShadow: '0 10px 35px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          {/* Header */}
          <div
            className="py-3 px-4 text-center"
            style={{
              background: 'rgba(0, 155, 58, 0.88)',
              backdropFilter: 'blur(8px)',
              borderBottom: '1px solid rgba(255,255,255,0.18)',
            }}
          >
            <h2
              className="text-lg text-white font-bold"
              style={{
                textShadow: '0 2px 5px rgba(0,0,0,0.6)',
                fontFamily: 'Bebas Neue, sans-serif',
                letterSpacing: '1.2px',
              }}
            >
              🎫 GENERAR CARTONES
            </h2>
            <p className="text-sm text-white mt-1 opacity-90">{evento.nombre}</p>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">

            {/* Info del evento */}
            <div
              className="p-3 rounded-lg"
              style={{
                background: 'rgba(230, 255, 240, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0,155,58,0.3)',
              }}
            >
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-bold text-gray-900">📅 Fecha:</span>
                  <p className="text-gray-700">{new Date(evento.fecha).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-bold text-gray-900">🎰 Tipo:</span>
                  <p className="text-gray-700">
                    {evento.tipoJuego === 90 && 'Bingo 90'}
                    {evento.tipoJuego === 75 && 'Bingo 75'}
                    {evento.tipoJuego === 'custom' && `Custom (${evento.numBolas})`}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Selector de modo: Físico / Digital ── */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                🃏 Tipo de Cartones:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['digital', 'fisico'] as ModoCartones[]).map((modo) => {
                  const activo = modoCartones === modo;
                  return (
                    <button
                      key={modo}
                      onClick={() => {
                        setModoCartones(modo);
                        // Limpiar resultados previos al cambiar de modo
                        setCartonesGenerados([]);
                        setError(null);
                      }}
                      className="py-2.5 rounded-md font-bold text-sm transition-all hover:scale-105 active:scale-95"
                      style={{
                        background: activo
                          ? 'rgba(0,102,204,0.92)'
                          : 'rgba(255,255,255,0.5)',
                        backdropFilter: 'blur(10px)',
                        color: activo ? 'white' : '#2D2D2D',
                        border: activo
                          ? '2px solid rgba(0,102,204,0.8)'
                          : '2px solid rgba(0,0,0,0.15)',
                        boxShadow: activo
                          ? '0 4px 15px rgba(0,102,204,0.35)'
                          : '0 2px 6px rgba(0,0,0,0.1)',
                      }}
                    >
                      {modo === 'digital' ? '💻 Digitales' : '🖨️ Físicos'}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-700 mt-1.5 leading-relaxed">
                {esFisico
                  ? '🖨️ Los cartones son físicos (impresos). No se generarán cartones digitales; puedes ir directo al juego.'
                  : '💻 Se generan cartones digitales con QR, guardados en la nube.'}
              </p>
            </div>

            {/* ── Modo físico: ir directo al juego ── */}
            {esFisico && (
              <div className="space-y-3">
                <div
                  className="p-3 rounded-lg text-center"
                  style={{
                    background: 'rgba(255, 248, 220, 0.7)',
                    border: '1px solid rgba(255,193,7,0.4)',
                  }}
                >
                  <p className="text-sm font-bold text-gray-900">
                    🖨️ Modo Físico activado
                  </p>
                  <p className="text-xs text-gray-700 mt-1">
                    Los jugadores usarán cartones impresos. Puedes iniciar el juego directamente.
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/juego/${evento.id}`, { state: { evento } })}
                  className="w-full py-3 rounded-md font-bold text-sm transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: 'rgba(0,155,58,0.92)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 6px 20px rgba(0,155,58,0.4)',
                    textShadow: '0 2px 5px rgba(0,0,0,0.4)',
                  }}
                >
                  🎮 Iniciar Juego
                </button>
                <button
                  onClick={handleCompartirEnlace}
                  className="w-full py-2.5 rounded-md font-bold text-sm transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: 'rgba(0,102,204,0.9)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 4px 15px rgba(0,102,204,0.3)',
                  }}
                >
                  🔗 Compartir Enlace del Evento
                </button>
              </div>
            )}

            {/* ── Modo digital: generación ── */}
            {!esFisico && (
              <>
                {/* Cantidad */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    📊 Cantidad de Cartones:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.max(1, Math.min(100, Number(e.target.value))))}
                    className="w-full px-3 py-2 rounded-lg text-sm font-bold text-center focus:outline-none"
                    style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '2px solid rgba(0,155,58,0.4)',
                      boxShadow: '0 2px 8px rgba(0,155,58,0.15)',
                    }}
                  />
                </div>

                {/* Error */}
                {error && (
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      background: 'rgba(255,230,230,0.8)',
                      border: '1px solid rgba(196,30,58,0.4)',
                    }}
                  >
                    <p className="text-sm font-bold text-red-800">⚠️ {error}</p>
                  </div>
                )}

                {/* Botón generar */}
                <button
                  onClick={handleGenerar}
                  disabled={generando || cantidad < 1}
                  className="w-full py-3 rounded-md font-bold text-sm transition-all hover:scale-105 active:scale-95"
                  style={{
                    background:
                      generando || cantidad < 1
                        ? 'rgba(200,200,200,0.7)'
                        : 'rgba(0,155,58,0.92)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow:
                      generando || cantidad < 1
                        ? '0 2px 8px rgba(0,0,0,0.1)'
                        : '0 6px 20px rgba(0,155,58,0.4)',
                    textShadow: '0 2px 5px rgba(0,0,0,0.4)',
                    cursor: generando || cantidad < 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {generando ? '⏳ Generando...' : '✨ Generar Cartones'}
                </button>

                {/* Resultados */}
                {cartonesGenerados.length > 0 && (
                  <div className="space-y-3">
                    <div
                      className="p-3 rounded-lg text-center"
                      style={{
                        background: 'rgba(255, 248, 220, 0.6)',
                        border: '1px solid rgba(255,193,7,0.3)',
                      }}
                    >
                      <p className="text-sm font-bold text-gray-900">
                        ✅{' '}
                        {cartonesGenerados.length === 1
                          ? '1 cartón generado'
                          : `${cartonesGenerados.length} cartones generados`}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleDescargarPDF}
                        className="py-2.5 rounded-md font-bold text-sm transition-all hover:scale-105 active:scale-95"
                        style={{
                          background: 'rgba(196,30,58,0.9)',
                          backdropFilter: 'blur(10px)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.2)',
                          boxShadow: '0 4px 15px rgba(196,30,58,0.3)',
                        }}
                      >
                        📄 Descargar PDF
                      </button>
                      <button
                        onClick={handleCompartirEnlace}
                        className="py-2.5 rounded-md font-bold text-sm transition-all hover:scale-105 active:scale-95"
                        style={{
                          background: 'rgba(0,102,204,0.9)',
                          backdropFilter: 'blur(10px)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.2)',
                          boxShadow: '0 4px 15px rgba(0,102,204,0.3)',
                        }}
                      >
                        🔗 Compartir Enlace
                      </button>
                    </div>

                    <button
                      onClick={() => navigate(`/juego/${evento.id}`, { state: { evento } })}
                      className="w-full py-2.5 rounded-md font-bold text-sm transition-all hover:scale-105 active:scale-95"
                      style={{
                        background: 'rgba(0,155,58,0.92)',
                        backdropFilter: 'blur(10px)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 6px 20px rgba(0,155,58,0.4)',
                        textShadow: '0 2px 5px rgba(0,0,0,0.4)',
                      }}
                    >
                      🎮 Iniciar Juego
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Tip */}
            <div
              className="p-3 rounded-lg"
              style={{
                background: 'rgba(255, 248, 220, 0.5)',
                border: '1px solid rgba(255,193,7,0.3)',
              }}
            >
              <p className="text-xs text-gray-800 leading-relaxed">
                💡 <strong>Tip:</strong>{' '}
                {esFisico
                  ? 'Con cartones físicos, los jugadores marcan los números manualmente. Usa el enlace del evento para que el presentador controle el sorteo.'
                  : 'Descarga los cartones en PDF para imprimir (4 por hoja). También puedes compartir el enlace para que cada jugador genere el suyo.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
