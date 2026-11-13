// 브라우저에서만 실행되는 암호화 모듈. WebCrypto API만 쓴다.
//
// 1. 무작위 256비트 키(링크 키)로 평문을 AES-256-GCM 암호화한다.
// 2. 비밀번호를 걸면 PBKDF2-SHA-256으로 유도한 키로 한 겹 더 암호화한다.
// 3. 서버에는 암호문, iv, salt만 보낸다. 링크 키는 공유 링크의 # 뒤에만 둔다.

export const PBKDF2_ITERATIONS = 600_000;

export type EncryptedPayload = {
  ciphertext: string;
  iv: string;
  pwSalt: string | null;
  pwIv: string | null;
};

type Bytes = Uint8Array<ArrayBuffer>;

export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(text: string): Bytes {
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

const random = (length: number): Bytes => crypto.getRandomValues(new Uint8Array(length));

const importAesKey = (raw: Bytes) =>
  crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);

async function deriveKeyFromPassword(password: string, salt: Bytes) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptSecret(plaintext: string, password: string) {
  const linkKey = random(32);
  const iv = random(12); // GCM 권장 길이 96비트. 암호화마다 새로 만든다.
  let data = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      await importAesKey(linkKey),
      new TextEncoder().encode(plaintext),
    ),
  );

  let pwSalt: Bytes | null = null;
  let pwIv: Bytes | null = null;
  if (password) {
    pwSalt = random(16);
    pwIv = random(12);
    const pwKey = await deriveKeyFromPassword(password, pwSalt);
    data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: pwIv }, pwKey, data));
  }

  const payload: EncryptedPayload = {
    ciphertext: toBase64Url(data),
    iv: toBase64Url(iv),
    pwSalt: pwSalt && toBase64Url(pwSalt),
    pwIv: pwIv && toBase64Url(pwIv),
  };
  return { payload, linkKey: toBase64Url(linkKey) };
}

/** 키나 비밀번호가 틀리면 GCM 인증 태그 검증이 실패해 예외가 난다. */
export async function decryptSecret(payload: EncryptedPayload, linkKey: string, password: string) {
  let data = fromBase64Url(payload.ciphertext);

  if (payload.pwSalt && payload.pwIv) {
    const pwKey = await deriveKeyFromPassword(password, fromBase64Url(payload.pwSalt));
    data = new Uint8Array(
      await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64Url(payload.pwIv) }, pwKey, data),
    );
  }

  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64Url(payload.iv) },
    await importAesKey(fromBase64Url(linkKey)),
    data,
  );
  return new TextDecoder().decode(plain);
}
