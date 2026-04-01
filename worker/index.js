export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/vote') {
      if (request.method === 'GET') {
        const count = parseInt(await env.VOTE_KV.get('vote_count') || '0', 10);
        return new Response(JSON.stringify({ count }), { headers: cors });
      }

      if (request.method === 'POST') {
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const voted = await env.VOTE_KV.get('voted:' + ip);
        if (voted) {
          const count = parseInt(await env.VOTE_KV.get('vote_count') || '0', 10);
          return new Response(JSON.stringify({ count, already: true }), { headers: cors });
        }

        const current = parseInt(await env.VOTE_KV.get('vote_count') || '0', 10);
        const newCount = current + 1;
        await env.VOTE_KV.put('vote_count', String(newCount));
        await env.VOTE_KV.put('voted:' + ip, '1');

        return new Response(JSON.stringify({ count: newCount, already: false }), { headers: cors });
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: cors });
  }
};
