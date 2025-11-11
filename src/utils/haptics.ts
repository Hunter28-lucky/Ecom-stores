/**
 * Haptic Feedback Utility
 * Provides vibration feedback for mobile devices
 */

/**
 * Trigger haptic feedback on mobile devices
 * @param pattern - Vibration pattern: 'light', 'medium', 'heavy', or custom array
 */
export const triggerHaptic = (pattern: 'light' | 'medium' | 'heavy' | number[] = 'medium') => {
  // Check if device supports vibration
  if (!navigator.vibrate) {
    console.log('Haptic feedback not supported on this device');
    return;
  }

  let vibrationPattern: number | number[];

  switch (pattern) {
    case 'light':
      vibrationPattern = 10; // Short single vibration
      break;
    case 'medium':
      vibrationPattern = 50; // Medium single vibration
      break;
    case 'heavy':
      vibrationPattern = [100, 50, 100]; // Double vibration with pause
      break;
    default:
      vibrationPattern = pattern;
  }

  try {
    navigator.vibrate(vibrationPattern);
    console.log('🎯 Haptic feedback triggered:', pattern);
  } catch (error) {
    console.error('Failed to trigger haptic feedback:', error);
  }
};

/**
 * Success haptic pattern - celebratory double pulse
 */
export const successHaptic = () => {
  triggerHaptic([50, 30, 100]); // Short-pause-long
};

/**
 * Error haptic pattern - warning triple pulse
 */
export const errorHaptic = () => {
  triggerHaptic([30, 30, 30, 30, 30]); // Quick triple buzz
};

/**
 * Selection haptic - light feedback
 */
export const selectionHaptic = () => {
  triggerHaptic('light');
};
