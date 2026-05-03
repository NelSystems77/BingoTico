import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Configuracion from './pages/Configuracion';
import CrearEvento from './pages/CrearEvento';
import GenerarCartones from './pages/GenerarCartones';
import Juego from './pages/Juego';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route path="/crear-evento" element={<CrearEvento />} />
        <Route path="/generar-cartones" element={<GenerarCartones />} />
        <Route path="/evento/:eventoId" element={<GenerarCartones />} />
        <Route path="/juego/:eventoId" element={<Juego />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
