# Architecture Slop Patterns Reference

## Quick Checklist

### 📁 Structure Smells

- [ ] Directories with 1 file → flatten
- [ ] Empty directories → remove
- [ ] 5+ levels deep → reorganize
- [ ] Barrel files (index.ts) → direct imports

### 🏢 Layer Smells

- [ ] controller/service/repository that just forwards calls
- [ ] DTO/entity/model for same data
- [ ] Mapper classes with 1:1 field copying
- [ ] Interface per implementation

### 🪞 Organization Smells

- [ ] Same entity name in 5+ directories
- [ ] Centralized types/ folder far from usage
- [ ] utils/ or helpers/ growing unbounded
- [ ] Shared/ with no clear ownership

---

## Anti-Patterns

### 1. Single-File Directory

**Slop:**

```
src/
  components/
    Button/
      Button.tsx      ← only file
```

**Better:**

```
src/
  components/
    Button.tsx
```

**Exception:** Valid if you plan to add tests, styles, stories in same folder.

---

### 2. Barrel File Overuse

**Slop:**

```typescript
// src/components/index.ts
export * from "./Button";
export * from "./Input";
export * from "./Modal";
// ... 50 more exports
```

**Problems:**

- Circular dependency risk
- Tree-shaking issues
- Slower IDE autocomplete

**Better:** Direct imports

```typescript
import { Button } from "@/components/Button";
```

**Exception:** Valid for public package APIs.

---

### 3. Enterprise Layer Explosion

**Slop:**

```
src/
  controllers/
    UserController.ts
  services/
    UserService.ts
  repositories/
    UserRepository.ts
  entities/
    User.ts
  dto/
    UserDto.ts
    CreateUserDto.ts
  mappers/
    UserMapper.ts
  interfaces/
    IUserService.ts
    IUserRepository.ts
```

**Ask for each layer:**

1. Does it add validation? → Keep
2. Does it add transformation? → Keep
3. Does it add caching/logging? → Keep
4. Does it just forward calls? → Remove

**Better (colocated):**

```
src/
  features/
    user/
      user.controller.ts
      user.service.ts
      user.repository.ts
      user.types.ts
```

---

### 4. Mirrored Structures

**Slop:**

```
src/
  controllers/
    UserController.ts
    ProductController.ts
    OrderController.ts
  services/
    UserService.ts
    ProductService.ts
    OrderService.ts
  repositories/
    UserRepository.ts
    ProductRepository.ts
    OrderRepository.ts
```

Every entity requires touching 3+ directories.

**Better (feature-based):**

```
src/
  features/
    user/
      controller.ts
      service.ts
      repository.ts
    product/
      ...
```

---

### 5. Centralized Types

**Slop:**

```
src/
  types/
    user.types.ts
    product.types.ts
    order.types.ts
  services/
    user.service.ts   ← imports from ../types/
```

**Problem:** Types far from where they're used.

**Better:**

```
src/
  features/
    user/
      user.types.ts   ← colocated
      user.service.ts
```

---

### 6. Utils Dumping Ground

**Slop:**

```
src/
  utils/
    string.ts
    date.ts
    array.ts
    validation.ts
    formatting.ts
    api.ts
    ... 30 more files
```

**Better options:**

1. Move to consumer: `features/user/user.utils.ts`
2. Extract to package: `@myorg/date-utils`
3. Use established library

---

### 7. Deep Nesting

**Slop:**

```
src/
  modules/
    core/
      features/
        user/
          components/
            forms/
              CreateUserForm.tsx  ← 6 levels deep
```

**Better:**

```
src/
  features/
    user/
      CreateUserForm.tsx  ← 3 levels
```

---

## When Layering is Justified

| Layer      | Keep if...                                              |
| ---------- | ------------------------------------------------------- |
| Controller | Handles HTTP concerns (validation, response formatting) |
| Service    | Contains business logic, orchestrates multiple repos    |
| Repository | Abstracts data access, could swap DB                    |
| DTO        | Different shape than entity, validation rules           |
| Mapper     | Non-trivial transformation logic                        |
| Interface  | Multiple implementations OR needed for DI/testing       |

---

## Feature-Based vs Layer-Based

### Layer-Based (often slop)

```
src/
  controllers/    ← grouped by type
  services/
  repositories/
```

### Feature-Based (usually better)

```
src/
  features/       ← grouped by domain
    user/
    product/
    order/
```

### Hybrid (pragmatic)

```
src/
  shared/         ← truly shared code
    db/
    auth/
  features/       ← domain modules
    user/
    product/
```

---

## Severity Guide

| Severity  | Pattern                        | Action                 |
| --------- | ------------------------------ | ---------------------- |
| 🔴 High   | Empty dirs, passthrough layers | Remove now             |
| 🟡 Medium | Single-file dirs, barrel files | Refactor when touching |
| 🟢 Low    | Centralized types, deep utils  | Note for future        |
