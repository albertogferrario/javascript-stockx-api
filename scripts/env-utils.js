const fs = require('fs');
const path = require('path');

function createEnvFileManager(filePath) {
  const ensureDir = () => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  };

  return {
    updateTokens(accessToken, refreshToken = null) {
      try {
        ensureDir();
        
        let content = '';
        if (fs.existsSync(filePath)) {
          content = fs.readFileSync(filePath, 'utf8');
        }

        // Update access token
        if (content.includes('STOCKX_JWT_TOKEN=')) {
          content = content.replace(/STOCKX_JWT_TOKEN=.*/, `STOCKX_JWT_TOKEN=${accessToken}`);
        } else {
          content += `${content ? '\n' : ''}STOCKX_JWT_TOKEN=${accessToken}`;
        }

        // Update or add refresh token
        if (refreshToken) {
          if (content.includes('STOCKX_REFRESH_TOKEN=')) {
            content = content.replace(/STOCKX_REFRESH_TOKEN=.*/, `STOCKX_REFRESH_TOKEN=${refreshToken}`);
          } else {
            content += `\nSTOCKX_REFRESH_TOKEN=${refreshToken}`;
          }
        }

        fs.writeFileSync(filePath, content);
        return true;
      } catch (error) {
        throw new Error(`Failed to update environment file: ${error.message}`);
      }
    },

    getTokens() {
      try {
        if (!fs.existsSync(filePath)) {
          return {};
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const tokens = {};

        const jwtMatch = content.match(/STOCKX_JWT_TOKEN=(.+)/);
        const refreshMatch = content.match(/STOCKX_REFRESH_TOKEN=(.+)/);

        if (jwtMatch) {
          tokens.accessToken = jwtMatch[1].trim();
        }
        if (refreshMatch) {
          tokens.refreshToken = refreshMatch[1].trim();
        }

        return tokens;
      } catch (error) {
        throw new Error(`Failed to read environment file: ${error.message}`);
      }
    },
  };
}

module.exports = { createEnvFileManager };