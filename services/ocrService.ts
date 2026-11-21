
import { createWorker } from 'tesseract.js';

export const ocrService = {
  /**
   * Extract numbers from an image file or URL
   * Specifically optimized for utility meters
   */
  extractMeterReading: async (image: string | File): Promise<number | null> => {
    try {
      // Initialize worker
      const worker = await createWorker('eng');
      
      // We want to restrict the characters to digits only if possible, 
      // but tesseract.js worker configuration for char_whitelist needs to be set properly.
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789',
      });

      const { data: { text } } = await worker.recognize(image);
      
      await worker.terminate();

      // Clean the text to extract the first significant number found
      // Utility meters usually have a sequence of digits.
      // We filter out non-digits and try to find the longest sequence.
      const cleaned = text.replace(/[^0-9]/g, '');
      
      if (cleaned.length > 0) {
        return parseInt(cleaned, 10);
      }

      return null;
    } catch (error) {
      console.error('OCR Error:', error);
      return null;
    }
  }
};
