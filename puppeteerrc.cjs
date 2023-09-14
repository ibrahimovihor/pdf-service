const { join } = require('path')
const os = require('os')

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer.
  cacheDirectory: join(os.homedir(), '.cache', 'puppeteer')
}
