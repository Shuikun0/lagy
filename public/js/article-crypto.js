/**
 * 浏览器端 AES-GCM + PBKDF2；密文随站点公开分发，安全性依赖密码强度。
 * 需在 HTTPS 或 localhost 下使用（crypto.subtle）。
 */
(function (global) {
  'use strict';

  var PBKDF2_ITERATIONS = 120000;
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

  function deriveKey(password, salt) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']).then(function (keyMaterial) {
      return crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: PBKDF2_ITERATIONS,
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
    return deriveKey(password, salt).then(function (key) {
      var enc = new TextEncoder();
      return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, enc.encode(plaintext)).then(function (ciphertext) {
        return {
          cipherSalt: bytesToBase64(salt),
          cipherIv: bytesToBase64(iv),
          cipherText: bytesToBase64(new Uint8Array(ciphertext)),
        };
      });
    });
  }

  function decrypt(cipherTextB64, cipherIvB64, cipherSaltB64, password) {
    if (!global.crypto || !global.crypto.subtle) {
      return Promise.reject(new Error('当前环境不支持 Web Crypto'));
    }
    var salt = base64ToBytes(cipherSaltB64);
    var iv = base64ToBytes(cipherIvB64);
    var ciphertext = base64ToBytes(cipherTextB64);
    return deriveKey(password, salt).then(function (key) {
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
