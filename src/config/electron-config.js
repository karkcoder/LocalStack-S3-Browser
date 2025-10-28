// Environment configuration to permanently disable GPU acceleration
// This file is loaded before the main application starts

process.env.ELECTRON_DISABLE_GPU = "1";
process.env.ELECTRON_DISABLE_GPU_COMPOSITING = "1";
process.env.ELECTRON_DISABLE_HARDWARE_ACCELERATION = "1";
process.env.CHROMIUM_FLAGS =
  "--disable-gpu --disable-gpu-compositing --use-gl=disabled";

// Additional environment variables for stability
process.env.ELECTRON_NO_ATTACH_CONSOLE = "1";
process.env.ELECTRON_ENABLE_LOGGING = "0";

module.exports = {
  // Configuration object for reference
  gpuDisabled: true,
  hardwareAcceleration: false,
  softwareRendering: true,
};
