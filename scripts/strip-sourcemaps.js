import fs from 'fs';
import path from 'path';

function walk(dir, cb) {
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) walk(full, cb);
    else cb(full);
  });
}

function removeSourceMapComments(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    // Remove both single-line and block sourceMappingURL comments
    content = content.replace(/\/\/# sourceMappingURL=.*$/gm, '');
    content = content.replace(/\/\*# sourceMappingURL=.*?\*\//gms, '');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Stripped sourceMappingURL from', filePath);
  } catch (err) {
    console.warn('Failed to strip sourceMappingURL in', filePath, err.message);
  }
}

function deleteFile(filePath) {
  try {
    fs.unlinkSync(filePath);
    console.log('Deleted', filePath);
  } catch (err) {
    // ignore
  }
}

(function main() {
  const dist = path.join(process.cwd(), 'dist', 'spa');
  if (!fs.existsSync(dist)) {
    console.warn('dist/spa not found, skipping strip-sourcemaps');
    return;
  }

  walk(dist, (file) => {
    if (file.endsWith('.map')) {
      deleteFile(file);
      return;
    }
    if (file.endsWith('.js') || file.endsWith('.css')) {
      removeSourceMapComments(file);
    }
  });
  console.log('strip-sourcemaps finished');
})();
