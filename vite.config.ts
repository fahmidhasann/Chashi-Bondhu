import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function apiDevMiddleware(env: Record<string, string>): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        // Populate process.env so serverless functions access environment variables
        Object.assign(process.env, env);

        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = url.pathname;

        try {
          if (pathname === '/api/config') {
            const mod = await server.ssrLoadModule('./api/config.ts');
            return mod.default(req, res);
          }

          if (pathname === '/api/analyze' || pathname === '/api/chat' || pathname === '/api/speech') {
            const filePath = `./api/${pathname.replace('/api/', '')}.ts`;
            const mod = await server.ssrLoadModule(filePath);

            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              (req as any).body = body;
              await mod.default(req, res);
            });
            return;
          }

          next();
        } catch (err: any) {
          console.error('Dev API handler error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const apiKey = env.GEMINI_API_KEY || env.API_KEY || env.VITE_GEMINI_API_KEY || '';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      tailwindcss(),
      apiDevMiddleware(env),
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
