/**
 * Utils Module
 * Helper functions and utilities
 */

export class Utils {
  /**
   * Parse pattern string into array of steps
   * @param {string} pattern - Pattern string (e.g., "D-T- --T-")
   * @returns {Array<string>} Array of step patterns
   */
  static parsePattern(pattern) {
    if (!pattern || typeof pattern !== 'string') return [];
    return pattern.trim().split(/\s+/);
  }

  /**
   * Convert pattern array back to string
   * @param {Array<string>} steps - Array of step patterns
   * @returns {string} Pattern string
   */
  static stringifyPattern(steps) {
    if (!Array.isArray(steps)) return '';
    return steps.join(' ');
  }

  /**
   * Get notes from a step pattern
   * @param {string} step - Step pattern (e.g., "DT")
   * @returns {Array<string>} Array of notes
   */
  static getNotesFromStep(step) {
    if (!step) return [];
    return step.split('').filter(n => n !== '-' && n !== ' ');
  }

  /**
   * Check if note is valid
   * @param {string} note - Note character
   * @returns {boolean} True if valid
   */
  static isValidNote(note) {
    const validNotes = ['D', 'T', 'K', 'S', 't', 'k', 'B', 'R'];
    return validNotes.includes(note);
  }

  /**
   * Calculate step duration in seconds
   * @param {number} bpm - Beats per minute
   * @param {number} division - Beat division (0.25, 0.5, 1)
   * @returns {number} Duration in seconds
   */
  static calculateStepDuration(bpm, division = 0.5) {
    const secondsPerBeat = 60 / bpm;
    return secondsPerBeat * division;
  }

  /**
   * Format time as MM:SS
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time
   */
  static formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in ms
   * @returns {Function} Debounced function
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function calls
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in ms
   * @returns {Function} Throttled function
   */
  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Generate unique ID
   * @returns {string} Unique ID
   */
  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Clamp number between min and max
   * @param {number} num - Number to clamp
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Clamped number
   */
  static clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  }

  /**
   * Linear interpolation
   * @param {number} start - Start value
   * @param {number} end - End value
   * @param {number} t - Interpolation factor (0-1)
   * @returns {number} Interpolated value
   */
  static lerp(start, end, t) {
    return start + (end - start) * t;
  }

  /**
   * Map value from one range to another
   * @param {number} value - Value to map
   * @param {number} inMin - Input minimum
   * @param {number} inMax - Input maximum
   * @param {number} outMin - Output minimum
   * @param {number} outMax - Output maximum
   * @returns {number} Mapped value
   */
  static map(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }
}
