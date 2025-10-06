import express from 'express';
import fetch from 'node-fetch';

export function keepAlive() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.get('/', (req, res) => res.send('Bot activo'));
  app.listen(port, () => {
    console.log(`Servidor Express activo en puerto ${port}`);
  });

  // Auto-ping interno cada 4.6 minutos
  setInterval(() => {
    fetch(`https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`)
      .then(() => console.log('Auto-ping enviado'))
      .catch(() => console.log('Error en auto-ping'));
  }, 280_000);

  // Simulación de actividad interna cada minuto
  setInterval(() => {
    console.log(`[${new Date().toISOString()}] Manteniendo el bot despierto...`);
  }, 60_000);
}
