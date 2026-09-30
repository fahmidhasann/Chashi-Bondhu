// api/config.ts - Check if GEMINI_API_KEY is configured on the server
export default async function handler(req: any, res?: any) {
  const isConfigured = Boolean(process.env.GEMINI_API_KEY || process.env.API_KEY);

  // If called via Web Standards Request/Response
  if (req instanceof Request || (req && typeof req.json === 'function' && !res)) {
    return new Response(JSON.stringify({ configured: isConfigured }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }

  // If called via Node.js req/res
  if (res && typeof res.status === 'function') {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ configured: isConfigured });
  }

  return new Response(JSON.stringify({ configured: isConfigured }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
