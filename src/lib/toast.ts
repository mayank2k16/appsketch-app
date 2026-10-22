/**
 * Centralized toast utility — black + green brand theme.
 * Toasts slide in from the RIGHT edge of the screen into the top-right area.
 *
 * Usage:
 *   toast.success('Item added to cart')
 *   toast.error('Something went wrong')
 *   toast.warning('Please fill all fields')
 *   toast.info('Payment cancelled')
 *
 * Only error and warning toasts vibrate (docs/haptics.md); success and info
 * toasts are silent. Callers never add their own haptic.
 */

import { haptic } from '@/lib/haptics';
import { triggerToast } from '@/lib/toast-container';

function success(message: string, description?: string) {
  triggerToast({ type: 'success', message, description, duration: 2400 });
}

function error(message: string, description?: string) {
  haptic.error();
  triggerToast({ type: 'error', message, description, duration: 3200 });
}

function warning(message: string, description?: string) {
  haptic.warning();
  triggerToast({ type: 'warning', message, description, duration: 2800 });
}

function info(message: string, description?: string) {
  triggerToast({ type: 'info', message, description, duration: 2600 });
}

export const toast = { success, error, warning, info };
