import pkg from '../package.json' with { type: 'json' };
import { setupDiagnostics as setup } from '@tidyeval/game-platform/diagnostics';

const labels = {
  de: ['Diagnosebericht', 'Lokal erstellt. Text zum Kopieren auswählen; er wird nicht automatisch gesendet.'],
  en: ['Diagnostic report', 'Created locally. Select the text to copy it; it is not sent automatically.'],
  es: ['Informe de diagnóstico', 'Creado localmente. Selecciona el texto para copiarlo; no se envía automáticamente.']
};
export function setupDiagnostics(game, situation) {
  const build = new URL(import.meta.url).pathname.match(/-([A-Za-z0-9_-]{8})\.js$/)?.[1] || 'development';
  setup(game, pkg.version, () => ({ build, ...situation() }), labels);
}
