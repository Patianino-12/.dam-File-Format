/**
 * Cryptographic utilities for .dam files.
 * Uses the Web Crypto API (built into all modern browsers).
 */

const ENC = new TextEncoder();
const DEC = new TextDecoder();

/**
 * Compute a SHA-256 hex digest of a string.
 */
export async function sha256(text: string): Promise<string> {
    const data = ENC.encode(text);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Derive an AES-GCM key from a password using PBKDF2.
 */
async function deriveKey(
    password: string,
    salt: ArrayBuffer,
): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        ENC.encode(password),
        'PBKDF2',
        false,
        ['deriveKey'],
    );
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
    );
}

/**
 * Encrypt a plaintext string with a password.
 * Returns a base64 string containing salt + iv + ciphertext.
 */
export async function encrypt(
    plaintext: string,
    password: string,
): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt.buffer as ArrayBuffer);
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
        key,
        ENC.encode(plaintext),
    );
    // Pack: salt(16) + iv(12) + ciphertext(...)
    const packed = new Uint8Array(16 + 12 + ciphertext.byteLength);
    packed.set(salt, 0);
    packed.set(iv, 16);
    packed.set(new Uint8Array(ciphertext), 28);
    return btoa(String.fromCharCode(...Array.from(packed)));
}

/**
 * Decrypt a base64 encrypted string with a password.
 * Returns null if the password is wrong or data is corrupt.
 */
export async function decrypt(
    encoded: string,
    password: string,
): Promise<string | null> {
    try {
        const raw = atob(encoded);
        const packed = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) packed[i] = raw.charCodeAt(i);

        const salt = packed.slice(0, 16).buffer as ArrayBuffer;
        const iv = packed.slice(16, 28).buffer as ArrayBuffer;
        const ciphertext = packed.slice(28).buffer as ArrayBuffer;

        const key = await deriveKey(password, salt);
        const plaintext = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext,
        );
        return DEC.decode(plaintext);
    } catch {
        return null;
    }
}
