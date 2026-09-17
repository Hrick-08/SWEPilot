import type { ChangedFile } from '../types';

export const changedFiles: Record<number, ChangedFile[]> = {
  142: [
    {
      path: 'src/auth/middleware.ts',
      additions: 24,
      deletions: 8,
      diff: `@@ -15,8 +15,24 @@
 export class AuthMiddleware {
   private readonly config: AuthConfig;

   constructor(config: AuthConfig) {
     this.config = config;
-    this.timeout = 30000; // 30 seconds
+    this.timeout = config.timeout ?? 60000;
   }

-  async authenticate(req: Request): Promise<AuthResult> {
-    const timer = setTimeout(() => {
-      throw new AuthTimeoutError();
-    }, 30000);
+  async authenticate(req: Request): Promise<AuthResult> {
+    const timeoutMs = this.config.timeout ?? this.timeout;
+    const controller = new AbortController();
+    const timer = setTimeout(() => {
+      controller.abort();
+    }, timeoutMs);
+
+    try {
+      const result = await this.validateToken(req, {
+        signal: controller.signal,
+      });
+      return result;
+    } catch (error) {
+      if (error.name === 'AbortError') {
+        throw new AuthTimeoutError(timeoutMs);
+      }
+      throw error;
+    } finally {
+      clearTimeout(timer);
+    }`,
    },
    {
      path: 'src/config/auth.ts',
      additions: 5,
      deletions: 2,
      diff: `@@ -8,7 +8,10 @@
 export interface AuthConfig {
   secret: string;
   issuer: string;
-  timeout?: number;
+  /** Authentication timeout in milliseconds */
+  timeout: number;
+  /** Maximum retry attempts */
+  maxRetries: number;
+  /** Whether to log auth attempts */
+  enableAuditLog: boolean;
 }`,
    },
    {
      path: 'tests/auth.test.ts',
      additions: 31,
      deletions: 4,
      diff: `@@ -1,4 +1,31 @@
+import { describe, it, expect } from 'vitest';
+import { AuthMiddleware } from '../src/auth/middleware';
+
 describe('AuthMiddleware', () => {
-  it('should authenticate', () => {
-    // TODO: implement
+  it('should use configured timeout', () => {
+    const config = { timeout: 60000, secret: 'test' };
+    const middleware = new AuthMiddleware(config);
+    expect(middleware.timeout).toBe(60000);
+  });
+
+  it('should throw AuthTimeoutError on timeout', async () => {
+    const config = { timeout: 1, secret: 'test' };
+    const middleware = new AuthMiddleware(config);
+    await expect(middleware.authenticate(mockReq))
+      .rejects.toThrow('AuthTimeoutError');
+  });
+
+  it('should handle token refresh', async () => {
+    const config = { timeout: 60000, secret: 'test' };
+    const middleware = new AuthMiddleware(config);
+    const result = await middleware.authenticate(mockReq);
+    expect(result.refreshed).toBe(true);
   });
 });`,
    },
    {
      path: 'src/auth/errors.ts',
      additions: 8,
      deletions: 2,
    },
  ],
  139: [
    { path: 'src/api/routes/users.ts', additions: 18, deletions: 5 },
    { path: 'src/api/routes/projects.ts', additions: 15, deletions: 4 },
    { path: 'src/api/validation/schemas.ts', additions: 12, deletions: 3 },
  ],
  135: [
    { path: 'tests/utils/formatDate.test.ts', additions: 45, deletions: 0 },
    { path: 'tests/utils/parseConfig.test.ts', additions: 38, deletions: 0 },
    { path: 'tests/utils/stringUtils.test.ts', additions: 28, deletions: 0 },
  ],
};
