import fetch from 'node-fetch';

export async function lookupIPLocation(ip: string) {
  try {
    if (!ip || ip === 'unknown' || ip.startsWith('::1') || ip.startsWith('127.')) return null;
    const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,regionName,city,timezone,query,message`;
    const res = await fetch(url, { method: 'GET', timeout: 3000 });
    const data = await res.json();
    if (data && data.status === 'success') {
      return {
        country: data.country,
        region: data.regionName,
        city: data.city,
        timezone: data.timezone,
        ip: data.query,
      };
    }
  } catch (e) {
    // ignore errors
  }
  return null;
}
