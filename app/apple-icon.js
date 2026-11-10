// Ícone da tela inicial do iPhone (não altera o favicon do desktop)
import { appIcon } from './icons/art';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return appIcon(180);
}
