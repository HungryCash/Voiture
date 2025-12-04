/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: async () => {
    // Force new build ID to bust cache
    return `build-${Date.now()}`
  }
}

module.exports = nextConfig
