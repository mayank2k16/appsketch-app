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
 * Every toast speaks the matching haptic (success / error / warning; info is
 * a soft touch), so callers never need to add their own.
 */

import { haptic } from '@/lib/haptics';
import { triggerToast } from '@/lib/toast-container';

function success(message: string, description?: string) {
  haptic.success();
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
  haptic.soft();
  triggerToast({ type: 'info', message, description, duration: 2600 });
}

export const toast = { success, error, warning, info };
