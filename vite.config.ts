import react from '@vitejs/plugin-react';
import fs from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';

function createJsonResponse(res: any) {
  let statusCode = 200;
  return {
    status(code: number) {
      statusCode = code;
      res.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      if (!res.headersSent) {
        res.statusCode = statusCode;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      res.end(JSON.stringify(payload));
    },
    setHeader(name: string, value: string) {
      res.setHeader(name, value);
    },
  };
}

function localApiPlugin(): Plugin {
  return {
    name: 'local-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const reqUrl = req.url || '';
        if (!reqUrl.startsWith('/api/')) {
          next();
          return;
        }

        const cleanPath = reqUrl.split('?')[0];
        const apiPath = path.resolve(__dirname, `.${cleanPath}.js`);
        if (!fs.existsSync(apiPath)) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: `Local API not found: ${cleanPath}` }));
          return;
        }

        try {
          const moduleUrl = `${pathToFileURL(apiPath).href}?t=${Date.now()}`;
          const mod = await import(moduleUrl);
          const handler = mod.default;

          if (typeof handler !== 'function') {
            throw new Error(`API handler is invalid for ${cleanPath}`);
          }

          (res as any).status = (code: number) => {
            res.statusCode = code;
            return createJsonResponse(res).status(code);
          };
          (res as any).json = (payload: unknown) => createJsonResponse(res).json(payload);

          await handler(req, res);
        } catch (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(
            JSON.stringify({
              ok: false,
              error: error instanceof Error ? error.message : String(error),
            }),
          );
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), localApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('@tanstack/react-query')) return 'vendor-query';
            if (id.includes('react-router')) return 'vendor-router';
            if (id.includes('react-dom') || id.includes('react')) return 'vendor-react';
            return 'vendor-misc';
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
