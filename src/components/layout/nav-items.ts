import {
  Compass,
  Heart,
  History,
  Home,
  Library,
  ListMusic,
  Search,
  Settings,
  Upload,
} from "lucide-react";

export interface NavItem {
  href: string;
  labelKey:
    | "nav.home"
    | "nav.search"
    | "nav.explore"
    | "nav.library"
    | "nav.favorites"
    | "nav.playlists"
    | "nav.recent"
    | "nav.upload"
    | "nav.settings";
  icon: typeof Home;
  primary?: boolean;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/", labelKey: "nav.home", icon: Home, primary: true },
  { href: "/search", labelKey: "nav.search", icon: Search, primary: true },
  { href: "/explore", labelKey: "nav.explore", icon: Compass, primary: true },
  { href: "/library", labelKey: "nav.library", icon: Library, primary: true },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/favorites", labelKey: "nav.favorites", icon: Heart },
  { href: "/playlists", labelKey: "nav.playlists", icon: ListMusic },
  { href: "/recent", labelKey: "nav.recent", icon: History },
  { href: "/upload", labelKey: "nav.upload", icon: Upload },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

export const MOBILE_NAV: NavItem[] = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/search", labelKey: "nav.search", icon: Search },
  { href: "/library", labelKey: "nav.library", icon: Library },
  { href: "/favorites", labelKey: "nav.favorites", icon: Heart },
];
