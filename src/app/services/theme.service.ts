import { Injectable } from '@angular/core';

export interface ThemeConfig {
  id: string;
  label: string;
  sidebarBg: string;
  bg: string;
  cardBg: string;
  headerBg: string;
  primary: string;
  primaryHover: string;
  primarySoft: string;
  primarySoftHover: string;
  border: string;
  shadow: string;
  previewColor: string; // for the swatch in the picker
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private defaultThemeId = 'sunset';

  readonly themes: ThemeConfig[] = [
    {
      id: 'sunset',
      label: 'Sunset Purple',
      sidebarBg: '#1B1647',
      bg: '#F5F4FA',
      cardBg: '#FCFBFE',
      headerBg: '#E5E2F8',
      primary: '#30277C',
      primaryHover: '#241D60',
      primarySoft: '#EAE8FC',
      primarySoftHover: '#DFDCFA',
      border: '#C6C3F2',
      shadow: '0 8px 24px rgba(48, 39, 124, 0.06)',
      previewColor: '#30277C'
    },
    {
      id: 'emerald',
      label: 'Emerald Green',
      sidebarBg: '#072221',
      bg: '#F4F7F6',
      cardBg: '#FFFFFF',
      headerBg: '#DCEFEF',
      primary: '#0E7A71',
      primaryHover: '#0A5C56',
      primarySoft: '#F0F8F7',
      primarySoftHover: '#DCEFEF',
      border: '#AFD8D4',
      shadow: '0 8px 24px rgba(7, 34, 33, 0.06)',
      previewColor: '#0E7A71'
    },
    {
      id: 'oceanic',
      label: 'Oceanic Blue',
      sidebarBg: '#0D2C40',
      bg: '#F2F7FA',
      cardBg: '#FCFDFE',
      headerBg: '#E1F5FE',
      primary: '#1565C0',
      primaryHover: '#0D47A1',
      primarySoft: '#E3F2FD',
      primarySoftHover: '#D0E8FF',
      border: '#90CAF9',
      shadow: '0 8px 24px rgba(13, 44, 64, 0.06)',
      previewColor: '#1565C0'
    },
    {
      id: 'amber',
      label: 'Amber Gold',
      sidebarBg: '#1C1A17',
      bg: '#FAF6F0',
      cardBg: '#FFFFFF',
      headerBg: '#F8EED8',
      primary: '#C68A28',
      primaryHover: '#A5711E',
      primarySoft: '#FCF6EA',
      primarySoftHover: '#F5E9D3',
      border: '#E3CE9F',
      shadow: '0 8px 24px rgba(28, 26, 23, 0.06)',
      previewColor: '#C68A28'
    }
  ];

  getCurrentThemeId(): string {
    return localStorage.getItem('erp-theme') || this.defaultThemeId;
  }

  setTheme(themeId: string): void {
    const theme = this.themes.find(t => t.id === themeId) || this.themes[0];
    localStorage.setItem('erp-theme', theme.id);
    this.applyTheme(theme);
  }

  initTheme(): void {
    this.setTheme(this.getCurrentThemeId());
  }

  private applyTheme(theme: ThemeConfig): void {
    const root = document.documentElement;
    root.style.setProperty('--erp-sidebar-bg', theme.sidebarBg);
    root.style.setProperty('--erp-bg', theme.bg);
    root.style.setProperty('--erp-card-bg', theme.cardBg);
    root.style.setProperty('--erp-header-bg', theme.headerBg);
    root.style.setProperty('--erp-primary', theme.primary);
    root.style.setProperty('--erp-primary-hover', theme.primaryHover);
    root.style.setProperty('--erp-primary-soft', theme.primarySoft);
    root.style.setProperty('--erp-primary-soft-hover', theme.primarySoftHover);
    root.style.setProperty('--erp-border', theme.border);
    root.style.setProperty('--erp-shadow', theme.shadow);
    root.style.setProperty('--erp-shadow-sm', theme.shadow.replace('0.06', '0.04'));
    root.style.setProperty('--bs-primary', theme.primary);
    root.style.setProperty('--pc-sidebar-background', theme.sidebarBg);
  }
}
