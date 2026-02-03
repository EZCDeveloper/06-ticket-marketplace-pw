# 🚀 Playwright SaaS Turbo Template

> **Quality Speed**: Production-ready Playwright testing boilerplate for SaaS applications that need to move fast without breaking things.

Enterprise-grade test architecture in < 15 minutes.

---

## ⚡ Quick Start

### 1. Installation

```bash
# Clone or copy this template
cd playwright-saas-turbo

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps
```

### 2. Configuration

Copy the environment file:

```bash
cp .env.example .env
```

Edit `.env` to match your application:

```ini
BASE_URL=http://localhost:3000
API_URL=http://localhost:3000
```

### 3. Run Tests

```bash
# Run all tests (headless)
npm test

# Run with UI mode (interactive)
npm run ui

# Run only API tests
npm run test:api

# Run only E2E tests
npm run test:e2e
```

---

## 🏗️ Architecture Philosophy

This template embodies the **"Quality Speed"** testing philosophy:

### 70% API + 30% E2E Hybrid

- **70% API Tests**: Fast, reliable validation of business logic
- **30% E2E Tests**: Critical user journeys with API setup

### Core Principles

1. **API-First Setup**: Never use UI to create test data
2. **Auto-Cleanup**: Everything you create is automatically deleted
3. **Builder Pattern**: Fluent API for complex test data
4. **Type Safety**: Full TypeScript support
5. **Zero Flakiness**: Modern Playwright locators + auto-waiting

---

## 📂 Project Structure

```
playwright-saas-turbo/
├── src/
│   ├── fixtures/
│   │   └── base.fixtures.ts      # Custom fixtures (cleanup, auth)
│   ├── support/
│   │   ├── api/
│   │   │   └── AuthClient.ts     # API client for auth
│   │   ├── builders/
│   │   │   ├── BaseBuilder.ts    # Abstract builder class
│   │   │   └── UserBuilder.ts    # User data builder
│   │   └── cleanup/
│   │       └── ResourceTracker.ts # Auto-cleanup utility
├── tests/
│   ├── api/                       # API tests (fast)
│   ├── e2e/                       # E2E tests (critical paths)
│   └── smoke/                     # Health checks
├── config/
│   └── endpoints.ts               # API endpoint configuration
├── playwright.config.ts
└── package.json
```

---

## 👩‍💻 Writing Tests

### Example 1: API Test with Auto-Cleanup

```typescript
import { test, expect } from '@/fixtures/base.fixtures';
import { UserBuilder } from '@/support/builders/UserBuilder';

test('[API-1.1.1] Create User', async ({ request, cleanup }) => {
  // ✅ ARRANGE: Build test data
  const userData = new UserBuilder().build();

  // ✅ ACT: Call API
  const response = await request.post('/api/users', { data: userData });
  const user = await response.json();

  // ✅ ASSERT: Validate response
  expect(response.status()).toBe(201);
  expect(user.email).toBe(userData.email);

  // ✅ CLEANUP: Track for auto-deletion
  cleanup.track('user', user.id);
});
```

### Example 2: E2E Test with API Setup

```typescript
import { test, expect } from '@/fixtures/base.fixtures';
import { UserBuilder } from '@/support/builders/UserBuilder';
import { AuthClient } from '@/support/api/AuthClient';

test('[E2E-1.1.1] Login Flow', async ({ page, request, cleanup }) => {
  // ✅ SETUP via API (fast)
  const userData = new UserBuilder().build();
  const authClient = new AuthClient(request);
  const user = await authClient.register(userData);
  cleanup.track('user', user.id);

  // ✅ TEST UI journey
  await page.goto('/login');
  await page.getByLabel('Email').fill(userData.email);
  await page.getByLabel('Password').fill(userData.password);
  await page.getByRole('button', { name: 'Login' }).click();

  // ✅ ASSERT: User logged in
  await expect(page).toHaveURL(/dashboard/);
});
```

### Example 3: Using Builders

```typescript
// Simple user
const user = new UserBuilder().build();

// Admin user
const admin = new UserBuilder().withAdmin().build();

// User with specific email
const customUser = new UserBuilder()
  .withEmail('test@example.com')
  .build();
```

---

## 🛠️ Customization Guide

### Adding New Resources

1. **Update endpoints** in `config/endpoints.ts`:

```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints
  projects: {
    base: '/api/projects',
    byId: (id: string) => `/api/projects/${id}`,
  },
};
```

2. **Update ResourceTracker** in `src/support/cleanup/ResourceTracker.ts`:

```typescript
const endpoints: Record<string, string> = {
  'user': '/api/users',
  'item': '/api/items',
  'project': '/api/projects', // Add this
};
```

3. **Create a Builder** (optional):

```typescript
// src/support/builders/ProjectBuilder.ts
export class ProjectBuilder extends BaseBuilder<ProjectData> {
  protected defaults(): ProjectData {
    return {
      name: faker.company.name(),
      description: faker.lorem.sentence(),
    };
  }
}
```

### Adding Authentication Fixtures

Extend `base.fixtures.ts` to add authenticated user fixtures:

```typescript
export const test = base.extend<BaseFixtures>({
  cleanup: async ({ request }, use) => {
    // ... existing cleanup code
  },
  
  // Add new fixture
  authenticatedUser: async ({ request, cleanup }, use) => {
    const userData = new UserBuilder().build();
    const authClient = new AuthClient(request);
    const user = await authClient.register(userData);
    cleanup.track('user', user.id);
    
    const authContext = await authClient.login(userData);
    await use({ user, request: authContext });
  },
});
```

---

## 🚀 CI/CD Integration

This template includes a GitHub Actions workflow (`.github/workflows/e2e.yml`).

**Required Secrets**:
- `BASE_URL`: Your staging/production URL
- Any API keys or credentials

The workflow runs:
1. Smoke tests first (fail fast)
2. API tests (parallel)
3. E2E tests (critical paths)

---

## 📊 Best Practices

### DO ✅

- Use API for test setup (users, data)
- Use **ResourceTracker** for cleanup
- Use **Builders** for test data
- Focus API tests on business logic
- Focus E2E tests on user journeys
- Use `data-testid` locators in your app

### DON'T ❌

- Don't create test data via UI
- Don't use CSS selectors
- Don't skip cleanup (causes DB pollution)
- Don't test business logic in E2E
- Don't create more than 30% E2E tests

---

## 🤝 Contributing

Found a bug or have an idea? Open an issue or PR!

---

## 📄 License

MIT

---

**Built with ❤️ following the "Quality Speed" philosophy**
