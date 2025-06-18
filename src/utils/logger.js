export const logger = {
  info: (message, ...args) => {
    console.log(message, ...args);
  },
  
  warn: (message, ...args) => {
    console.warn('⚠️', message, ...args);
  },
  
  error: (message, ...args) => {
    console.error('❌', message, ...args);
  }
}; 