const os = require('os');
const path = require('path');
const fs = require('fs');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'signs-test-'));
const testDbPath = path.join(tmpDir, 'test.db');

process.env.TEST_DB_PATH = testDbPath;
process.env.DISABLE_AUTO_SEED = '1';

global.__TEST_DB_PATH__ = testDbPath;
global.__TEST_TMP_DIR__ = tmpDir;
