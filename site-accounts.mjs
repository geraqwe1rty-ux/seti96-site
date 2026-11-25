import {createHash, timingSafeEqual} from 'node:crypto';

const digest = value => createHash('sha256').update(value).digest();

export function readAccounts(value) {
  const match = /^v1\.([0-9a-f]{64})\.([0-9a-f]{64}|off)$/.exec(value || '');
  if (!match || match[1] === match[2]) return null;
  return {owner:match[1], director:match[2]};
}

export function matchesAccount(header, login, hash) {
  if (!hash || !header?.startsWith('Basic ')) return false;
  const pair = Buffer.from(header.slice(6),'base64').toString('utf8');
  const split = pair.indexOf(':');
  return split >= 0 && pair.slice(0,split) === login &&
    timingSafeEqual(digest(pair.slice(split+1)), Buffer.from(hash,'hex'));
}
