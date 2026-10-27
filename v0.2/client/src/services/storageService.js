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
  getCharacterGender() {
    try {
      const g = localStorage.getItem('strike_void_character_gender');
      return g === 'male' ? 'male' : 'female';
    } catch (_e) {
      return 'female';
    }
  },
  setCharacterGender(gender) {
    try {
      const val = gender === 'male' ? 'male' : 'female';
      localStorage.setItem('strike_void_character_gender', val);
    } catch (_e) {
      // ignore storage errors
    }
  },
};

export default storageService;
