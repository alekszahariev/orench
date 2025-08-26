export function getCookieValue(name) {
    const cookies = document.cookie.split('; ');
    for (let cookie of cookies) {
      const [key, val] = cookie.split('=');
      if (key === name) return decodeURIComponent(val);
    }
    return null;
  }
  
  export function setCookie(name, value, days = 3) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${date.toUTCString()}`;
  }