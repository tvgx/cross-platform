// Pure TypeScript SHA-256 and Symmetric Encryption for Tactical Coordinates (Army+)

/**
 * Thuật toán băm SHA-256 tự chứa, không phụ thuộc vào thư viện ngoài.
 */
export function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;
  const words: number[] = [];
  const asciiLength = ascii[lengthProperty];
  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isPrime = (n: number) => {
    for (let factor = 2; factor * factor <= n; factor++) {
      if (n % factor === 0) return false;
    }
    return true;
  };

  let candidate = 2;
  while (primeCounter < 64) {
    if (isPrime(candidate)) {
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      hash[primeCounter] = (mathPow(candidate, 1 / 2) * maxWord) | 0;
      primeCounter++;
    }
    candidate++;
  }

  words[words[lengthProperty] - 1] = 0;
  for (i = 0; i < asciiLength; i++) {
    words[i >> 2] |= (ascii.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }
  words[asciiLength >> 2] |= 0x80 << (24 - (asciiLength % 4) * 8);
  words[(((asciiLength + 8) >> 6) << 4) + 15] = asciiLength * 8;

  let h0 = hash[0];
  let h1 = hash[1];
  let h2 = hash[2];
  let h3 = hash[3];
  let h4 = hash[4];
  let h5 = hash[5];
  let h6 = hash[6];
  let h7 = hash[7];

  for (i = 0; i < words[lengthProperty]; i += 16) {
    const w: number[] = [];
    for (j = 0; j < 16; j++) w[j] = words[i + j] || 0;
    for (j = 16; j < 64; j++) {
      const w15 = w[j - 15] || 0;
      const w2 = w[j - 2] || 0;
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[j] = ((w[j - 16] || 0) + s0 + (w[j - 7] || 0) + s1) | 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (j = 0; j < 64; j++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + (k[j] || 0) + (w[j] || 0)) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  const hex = (val: number) => {
    const s = (val >>> 0).toString(16);
    return '00000000'.substring(s.length) + s;
  };

  return hex(h0) + hex(h1) + hex(h2) + hex(h3) + hex(h4) + hex(h5) + hex(h6) + hex(h7);
}

/**
 * Mật mã hóa dòng (XOR cipher) đối xứng dùng khóa dẫn xuất SHA-256 từ ENV.
 */
function cryptText(text: string, key: string, encrypt: boolean): string {
  const keyHash = sha256(key);
  
  if (encrypt) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const keyByte = keyHash.charCodeAt(i % keyHash.length);
      const xorValue = charCode ^ keyByte;
      const hex = xorValue.toString(16).padStart(2, '0');
      result += hex;
    }
    return result;
  } else {
    let result = '';
    for (let i = 0; i < text.length; i += 2) {
      const hexByte = text.substring(i, i + 2);
      const byteValue = parseInt(hexByte, 16);
      const keyByte = keyHash.charCodeAt((i / 2) % keyHash.length);
      const charCode = byteValue ^ keyByte;
      result += String.fromCharCode(charCode);
    }
    return result;
  }
}

/**
 * Mã hóa tọa độ GPS thành chuỗi bảo mật an toàn.
 */
export function encryptCoordinates(latitude: number, longitude: number): string {
  const cryptoKey = process.env.EXPO_PUBLIC_CRYPTO_KEY || 'default_tactical_key_2026';
  const plainText = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  const cipherHex = cryptText(plainText, cryptoKey, true);
  return `enc:${cipherHex}`;
}

/**
 * Giải mã chuỗi tọa độ bảo mật về vĩ độ và kinh độ số thực chính xác.
 */
export function decryptCoordinates(encryptedStr: string): { latitude: number; longitude: number } | null {
  if (!encryptedStr || !encryptedStr.startsWith('enc:')) return null;
  const cryptoKey = process.env.EXPO_PUBLIC_CRYPTO_KEY || 'default_tactical_key_2026';
  const cipherHex = encryptedStr.substring(4);
  
  try {
    const plainText = cryptText(cipherHex, cryptoKey, false);
    const parts = plainText.split(',');
    if (parts.length === 2) {
      return {
        latitude: parseFloat(parts[0]),
        longitude: parseFloat(parts[1])
      };
    }
  } catch (e) {
    console.error('[CryptoUtils] Lỗi giải mã tọa độ:', e);
  }
  return null;
}
