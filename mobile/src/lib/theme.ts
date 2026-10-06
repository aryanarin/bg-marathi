/**
 * App theme — mirrors the web app's palette.
 * Light canvas #fdfbf7, dark #16181d, warm saffron accent.
 */
import { useColorScheme } from "react-native";

export interface Theme {
  canvas: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  inkMuted: string;
  inkSubtle: string;
  rule: string;
  accent: string;
  accentSoft: string;
  success: string;
  danger: string;
  isDark: boolean;
}

const light: Theme = {
  canvas: "#fdfbf7",
  surface: "#ffffff",
  surfaceAlt: "#f5f1e8",
  ink: "#1f1b16",
  inkMuted: "#5c5349",
  inkSubtle: "#8a7f72",
  rule: "#e7e0d3",
  accent: "#b4531f",
  accentSoft: "#f3e4d8",
  success: "#2f7d4f",
  danger: "#b4281f",
  isDark: false,
};

const dark: Theme = {
  canvas: "#16181d",
  surface: "#1f232b",
  surfaceAlt: "#262b34",
  ink: "#f3efe8",
  inkMuted: "#b8b0a4",
  inkSubtle: "#8a8276",
  rule: "#333a44",
  accent: "#e08a4f",
  accentSoft: "#3a2a1e",
  success: "#5fb97f",
  danger: "#e07068",
  isDark: true,
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === "dark" ? dark : light;
}

export { light as lightTheme, dark as darkTheme };
