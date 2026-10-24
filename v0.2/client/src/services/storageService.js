export const storageService = {
  getNickname() {
    try {
      return localStorage.getItem('strike_void_nickname') || '';
    } catch (_e) {
      return '';
    }
  },
  setNickname(name) {
    try {
      if (name) localStorage.setItem('strike_void_nickname', name);
    } catch (_e) {
      // ignore storage errors
    }
  },
};

export default storageService;
