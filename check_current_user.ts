
import { storageService } from './services/storageService';
// We need to mock localStorage if running via tsx in node
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    getItem: (key) => null,
    setItem: (key, val) => {},
    removeItem: (key) => {},
    clear: () => {},
    length: 0,
    key: (i) => null
  } as any;
}

try {
  const user = storageService.getUser();
  console.log('Current user:', user);
} catch (e) {
  console.log('Error getting user:', e);
}
