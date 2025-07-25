// Silencia o aviso do React DevTools
if (typeof window !== 'undefined') {
  const consoleWarn = console.warn;
  console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Download the React DevTools')) {
      return;
    }
    consoleWarn.apply(console, args);
  };
}
