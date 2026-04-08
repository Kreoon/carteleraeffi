import { useEffect } from 'react';
import Report from './Report';

/**
 * EmbedReport — wrapper minimal del Report sin header/controles, optimizado para iframe.
 * Se activa con la ruta /embed/reporte. Envía postMessage con altura para auto-resize.
 */
export default function EmbedReport() {
  useEffect(() => {
    document.body.classList.add('embed-mode');
    const sendHeight = () => {
      const h = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight
      );
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'cartelera:resize', height: h }, '*');
      }
    };
    sendHeight();
    const ro = new ResizeObserver(sendHeight);
    ro.observe(document.body);
    const interval = setInterval(sendHeight, 1500);
    return () => {
      document.body.classList.remove('embed-mode');
      ro.disconnect();
      clearInterval(interval);
    };
  }, []);

  return <Report />;
}
