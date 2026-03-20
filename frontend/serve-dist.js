const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT || 4200);
const apiTargetHost = process.env.API_TARGET_HOST || '127.0.0.1';
const apiTargetPort = Number(process.env.API_TARGET_PORT || 5113);
const distRoot = path.join(__dirname, 'dist', 'personal-life-assistant-web', 'browser');

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function sendFile(res, filePath) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(error.code === 'ENOENT' ? 'Not found' : 'Internal server error');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

function proxyApi(req, res) {
  const upstream = http.request(
    {
      host: apiTargetHost,
      port: apiTargetPort,
      method: req.method,
      path: req.url,
      headers: {
        ...req.headers,
        host: `${apiTargetHost}:${apiTargetPort}`
      }
    },
    upstreamRes => {
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    }
  );

  upstream.on('error', error => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'API proxy failed', details: error.message }));
  });

  req.pipe(upstream);
}

function resolveAppPath(requestUrl) {
  const pathname = new URL(requestUrl, `http://${host}:${port}`).pathname;
  const safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\\/])+/, '');
  const candidate = path.join(distRoot, safePath);

  if (safePath !== path.sep && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }

  if (safePath === path.sep) {
    return path.join(distRoot, 'index.html');
  }

  return path.join(distRoot, 'index.html');
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
    return;
  }

  if (req.url.startsWith('/api')) {
    proxyApi(req, res);
    return;
  }

  sendFile(res, resolveAppPath(req.url));
});

server.listen(port, host, () => {
  console.log(`Frontend available at http://${host}:${port}`);
});
