/**
 * 浏览器端 AES-GCM + PBKDF2；密文随站点公开分发，安全性依赖密码强度。
 * 需在 HTTPS 或 localhost 下使用（crypto.subtle）。
 *
 * PBKDF2 迭代：与 OWASP「PBKDF2-HMAC-SHA256 ≥600k」对齐；常见设备上单次解密/导出多在 1s 级以内。
 * decrypt 未传入迭代次数时使用当前 PBKDF2_ITERATIONS（须与 frontmatter cipherIterations 一致）。
 */
(function (global) {
  'use strict';

  var PBKDF2_ITERATIONS = 600000;
  var SALT_LEN = 16;
  var IV_LEN = 12;

  function bytesToBase64(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function base64ToBytes(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function deriveKey(password, salt, iterations) {
    var iter =
      typeof iterations === 'number' && iterations > 0 ? iterations : PBKDF2_ITERATIONS;
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']).then(function (keyMaterial) {
      return crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: iter,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
      );
    });
  }

  function encrypt(plaintext, password) {
    if (!global.crypto || !global.crypto.subtle) {
      return Promise.reject(new Error('当前环境不支持 Web Crypto'));
    }
    var salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
    var iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
    return deriveKey(password, salt, PBKDF2_ITERATIONS).then(function (key) {
      var enc = new TextEncoder();
      return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, enc.encode(plaintext)).then(function (ciphertext) {
        return {
          cipherSalt: bytesToBase64(salt),
          cipherIv: bytesToBase64(iv),
          cipherText: bytesToBase64(new Uint8Array(ciphertext)),
          cipherIterations: PBKDF2_ITERATIONS,
        };
      });
    });
  }

  function decrypt(cipherTextB64, cipherIvB64, cipherSaltB64, password, iterations) {
    if (!global.crypto || !global.crypto.subtle) {
      return Promise.reject(new Error('当前环境不支持 Web Crypto'));
    }
    var iter =
      typeof iterations === 'number' && iterations > 0 ? iterations : PBKDF2_ITERATIONS;
    var salt = base64ToBytes(cipherSaltB64);
    var iv = base64ToBytes(cipherIvB64);
    var ciphertext = base64ToBytes(cipherTextB64);
    return deriveKey(password, salt, iter).then(function (key) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ciphertext).then(function (buf) {
        return new TextDecoder().decode(buf);
      });
    });
  }

  global.articleCrypto = {
    encrypt: encrypt,
    decrypt: decrypt,
    PBKDF2_ITERATIONS: PBKDF2_ITERATIONS,
  };
})(typeof window !== 'undefined' ? window : globalThis);
