import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 8081;
const app = express();

const dist = path.resolve(__dirname, '..', 'dist', 'spa');

app.use(express.static(dist, { maxAge: '1d' }));
app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));

app.listen(port, () => {
  console.log(`Serving dist/spa at http://localhost:${port}`);
});
