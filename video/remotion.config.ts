import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Reels: 1080x1920 já definido por composição. Qualidade boa para redes:
Config.setConcurrency(null); // usa o padrão da máquina
