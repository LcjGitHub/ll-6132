/**
 * 下载 better-sqlite3 预编译二进制（解决 Windows 下证书或编译环境问题）
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pkgRoot = path.join(__dirname, '../node_modules/better-sqlite3');
const nodeFile = path.join(pkgRoot, 'build/Release/better_sqlite3.node');

if (!fs.existsSync(pkgRoot)) {
  process.exit(0);
}

if (fs.existsSync(nodeFile)) {
  console.log('[postinstall] better-sqlite3 原生模块已就绪');
  process.exit(0);
}

let version;
try {
  version = require(path.join(pkgRoot, 'package.json')).version;
} catch {
  process.exit(0);
}

const abi = process.versions.modules;
const platform = `${process.platform}-${process.arch}`;
const archive = `better-sqlite3-v${version}-node-v${abi}-${platform}.tar.gz`;
const url = `https://github.com/WiseLibs/better-sqlite3/releases/download/v${version}/${archive}`;
const tmpDir = path.join(__dirname, '../.tmp-sqlite');
const tarPath = path.join(tmpDir, archive);

/**
 * @param {string} downloadUrl
 * @returns {Promise<void>}
 */
function download(downloadUrl) {
  return new Promise((resolve, reject) => {
    https
      .get(downloadUrl, { rejectUnauthorized: false }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          download(res.headers.location).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`下载失败，状态码 ${res.statusCode}`));
          return;
        }
        fs.mkdirSync(tmpDir, { recursive: true });
        const file = fs.createWriteStream(tarPath);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', reject);
  });
}

async function main() {
  try {
    console.log('[postinstall] 正在下载 better-sqlite3 预编译包...');
    fs.mkdirSync(path.dirname(nodeFile), { recursive: true });
    await download(url);
    execSync(`tar -xzf "${tarPath}" -C "${pkgRoot}"`, { stdio: 'pipe' });

    if (fs.existsSync(nodeFile)) {
      console.log('[postinstall] better-sqlite3 安装成功');
    } else {
      throw new Error('解压后未找到 better_sqlite3.node');
    }
  } catch (err) {
    console.warn('[postinstall] 预编译包安装失败:', err.message);
    console.warn('[postinstall] 请安装 Python 3 后执行: npm rebuild better-sqlite3');
  } finally {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }
}

main();
