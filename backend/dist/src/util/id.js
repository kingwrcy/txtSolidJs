import bs58 from 'bs58';
import crypto from 'crypto';
function generateShortUrl() {
    const randomBytes = crypto.randomBytes(6);
    const encoded = bs58.encode(randomBytes);
    return encoded.substring(0, 6);
}
export { generateShortUrl };
