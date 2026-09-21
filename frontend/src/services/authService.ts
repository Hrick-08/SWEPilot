export const TOKEN_KEY = 'swepilot_token';
export const USERNAME_KEY = 'swepilot_username';

import { apiUrl } from './api';

export const authService = {
  async login(username: string, password: string): Promise<{ token: string; username: string }> {
    const response = await fetch(apiUrl('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    const data = await response.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USERNAME_KEY, data.username);
    return data;
  },

  async register(username: string, password: string, githubToken: string): Promise<void> {
    const response = await fetch(apiUrl('/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, github_token: githubToken }),
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.status}`);
    }
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUsername(): string | null {
    return localStorage.getItem(USERNAME_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
