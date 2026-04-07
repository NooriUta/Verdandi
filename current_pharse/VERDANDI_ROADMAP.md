# VERDANDI — Полный план проекта (Roadmap)

**Дата:** 07.04.2026
**Статус:** Phase 3 — 83% завершено
**Текущий коммит:** `c4f540b` (master)

---

## Общий прогресс

```
Phase 1    ████████████████████  100%  Scaffold + Mock Data          03.04
Phase 1.5  ████████████████████  100%  Auth + i18n                   04.04
Phase 2    ████████████████████  100%  Quarkus + RBAC + Real Data    04.04
Phase 3    ████████████████░░░░   83%  Core Features (текущий)       ⟵ мы здесь
Phase 4    ░░░░░░░░░░░░░░░░░░░░    0%  Polish + Performance
Phase 5    ░░░░░░░░░░░░░░░░░░░░    0%  ANVIL ипостась
```

---

## Phase 1 — Scaffold + Mock Data ✅

**Дата:** 03.04.2026 | **Задачи:** LOOM-001 – LOOM-011 (11/11)

| Задача | Описание |
|--------|----------|
| LOOM-001 | Vite + React 19 + TypeScript setup |
| LOOM-002 | React Flow canvas с mock-нодами |
| LOOM-003 | Drill-down L1 → L2 → L3 |
| LOOM-004 | Dark theme + SEER Design System (CSS variables) |
| LOOM-005 | ELK.js layout engine |
| LOOM-006 | Minimap + Controls |
| LOOM-007 | 5 палитр (Amber Forest, Lichen, Slate, Juniper, Warm Dark) |
| LOOM-008 | Breadcrumb навигация |
| LOOM-009 | StatusBar (nodes, edges, zoom) |
| LOOM-010 | Node типы: Table, Routine, Statement, Column |
| LOOM-011 | Базовая структура файлов и типов |

---

## Phase 1.5 — Auth + i18n ✅

**Дата:** 04.04.2026 | **Задачи:** LOOM-012 – LOOM-014 (3/3)

| Задача | Описание |
|--------|----------|
| LOOM-012 | Chur auth gateway (Fastify + JWT httpOnly cookie) |
| LOOM-013 | LoginPage + ProtectedRoute + authStore |
| LOOM-014 | react-i18next (EN / RU), все UI-строки |

---

## Phase 2 — Quarkus + RBAC + Real Data ✅

**Дата:** 04.04.2026 | **Задачи:** LOOM-015 – LOOM-022 (все)

| Задача | Описание |
|--------|----------|
| LOOM-015 | Quarkus 3 + SmallRye GraphQL setup |
| LOOM-016 | ArcadeGateway — HTTP client → ArcadeDB |
| LOOM-017 | OverviewService (L1 schema overview) |
| LOOM-018 | ExploreService (L2/L3 schema + package + rid explore) |
| LOOM-019 | LineageService (upstream/downstream) |
| LOOM-020 | SearchService (12 типов, full-text) |
| LOOM-021 | Chur RBAC proxy (X-Seer-Role header, write-op guard) |
| LOOM-022 | Frontend переключение mock → real data |

---

## Phase 3 — Core Features 🔄

**Начало:** 04.04.2026 | **Текущий статус:** 10/12 задач ✅

### Завершённые задачи Phase 3

| Задача | Описание | Коммит | Дата |
|--------|----------|--------|------|
| LOOM-023 | Canvas read-only mode (drag/zoom/select) | b31a52c | 04.04 |
| LOOM-023b | Filter Toolbar L2/L3 (Table/Stmt/Column cascade) | b12372b | 05.04 |
| LOOM-024 | L1 ApplicationNode + 3-уровневый canvas (App→DB→Schema) | 3a76300 | 05.04 |
| LOOM-024b | FilterToolbarL1 (App scope, DB/Schema cascade, depth) | f456587 | 05.04 |
| LOOM-025 | Column Mapping L2 + jumpTo из поиска | f456587 | 05.04 |
| LOOM-026 | TableNode три состояния (collapsed/partial/expanded) | b12372b | 05.04 |
| LOOM-027 | Expand buttons upstream/downstream на нодах | f8e31b8 | 06.04 |
| LOOM-032 | SearchPanel (поиск по всем типам, navigate to L1/L2) | b12372b | 05.04 |
| KNOT-001 | KNOT Report inspector — 5 вкладок, backend, тесты | dde4418 | 07.04 |
| S-01–S-05 | Стабилизация: error handling, SQL injection fix, logs | 1590188 | 07.04 |

### Оставшиеся задачи Phase 3

| # | Задача | Приоритет | Оценка | Срок |
|---|--------|-----------|--------|------|
| **F-01** | **LOOM-028: KNOT Inspector** — правая панель деталей ноды в LOOM | 🔴 | 4–6 ч | Среда 09.04 |
| **F-02** | **LOOM-029: Context menu** — right-click меню на нодах | 🟡 | 2–3 ч | Четверг 10.04 |
| **F-03** | **LOOM-030: Export PNG** — экспорт canvas | 🟡 | 2–3 ч | Четверг 10.04 |
| R-01 | Рефакторинг LoomCanvas (~866 LOC → ~250 + хуки) | 🟢 | 3–4 ч | Пятница 11.04 |
| R-02 | Split transformGraph.ts на 3 файла | 🟢 | 2–3 ч | Пятница 11.04 |
| R-03 | Unit-тесты transformGraph (Vitest) | 🟢 | 4–6 ч | Пятница 11.04 |
| R-04 | Удалить L1NodesProto.tsx (прототип) | 🟢 | 15 мин | Пятница 11.04 |

> Детальное описание каждой задачи — `PLAN_PHASE3_REMAINING.md`

---

## Phase 4 — Polish + Performance

**Ориентировочно:** 14–18 апреля 2026

### 4.1 Производительность (LOOM-031)

**Проблема:** При 500+ нодах React Flow может тормозить (все ноды рендерятся в DOM).

| Задача | Описание | Оценка |
|--------|----------|--------|
| P-01 | Виртуализация React Flow — только видимые ноды (RF v11+ поддерживает) | 4–6 ч |
| P-02 | Lazy load expansion — не загружать всё дерево сразу | 2–3 ч |
| P-03 | Мемоизация displayGraph — устранить лишние пересчёты | 2 ч |
| P-04 | Web Worker для ELK layout — не блокировать UI thread | 3–4 ч |
| P-05 | Бенчмарк: Load test с 1000+ нод (реальные данные Hound) | 2 ч |

### 4.2 HOUND-DB-001 — Schema alignment

**Проблема:** Ad-hoc DaliDatabase-вершины (не привязанные к DaliApplication) невидимы для SHUTTLE overview-запроса.

| Задача | Описание | Оценка | Владелец |
|--------|----------|--------|----------|
| H-01 | Анализ структуры Hound-графа для orphan DaliDatabase | 2 ч | Hound team |
| H-02 | Обновление OverviewService: включить orphan DB | 3 ч | SHUTTLE |
| H-03 | Обновление transformGqlOverview: отобразить orphan DB | 2 ч | verdandi |

### 4.3 Chur — Auth improvements

| Задача | Описание | Оценка |
|--------|----------|--------|
| C-01 | Refresh token — автопродление сессии (silent renew) | 4 ч |
| C-02 | Rate limiting на /auth/login (brute-force защита) | 2 ч |
| C-03 | Вынести ArcadeDB credentials в env/secrets (не plaintext в config) | 1 ч |

### 4.4 UX-улучшения

| Задача | Описание | Оценка |
|--------|----------|--------|
| U-01 | Diff view — сравнение двух версий lineage (до/после изменений в Hound) | 8–12 ч |
| U-02 | Impact analysis overlay — визуальная трассировка downstream impact с highlight | 4–6 ч |
| U-03 | Keyboard shortcuts (← → для navigation, / для поиска, Esc для сброса) | 2–3 ч |
| U-04 | Node grouping — сворачивать несколько нод в "группу" для чистоты canvas | 6–8 ч |
| U-05 | Pinned nodes — зафиксировать важные ноды при перекомпоновке | 2 ч |

### 4.5 Тестирование

| Задача | Описание | Оценка |
|--------|----------|--------|
| T-01 | Integration тесты SHUTTLE — проверка Cypher на реальной ArcadeDB (test profile) | 6–8 ч |
| T-02 | E2E тест (Playwright) — drill-down L1→L2→L3 и обратно | 4–6 ч |
| T-03 | Unit тесты transformGraph (Vitest) — если не сделано в Phase 3 | 4–6 ч |
| T-04 | Accessibility аудит (axe-core) + ARIA labels | 3–4 ч |

### 4.6 DevOps

| Задача | Описание | Оценка |
|--------|----------|--------|
| D-01 | Docker Compose — один файл для запуска ArcadeDB + SHUTTLE + Chur + verdandi | 3–4 ч |
| D-02 | CI pipeline (GitHub Actions) — lint + test на каждый PR | 3–4 ч |
| D-03 | Environment profiles — dev / staging / prod конфиги | 2 ч |

---

## Phase 5 — ANVIL ипостась

**Ориентировочно:** май 2026+

ANVIL — вторая ипостась SEER Studio (рядом с LOOM). Предполагаемое назначение: редактирование и версионирование lineage-графа (в отличие от LOOM который read-only visualizer).

> ⚠️ Требования к ANVIL не зафиксированы. Ниже — предварительная оценка.

| Компонент | Описание | Статус |
|-----------|----------|--------|
| A-01 | ANVIL routing + navigation (рядом с LOOM в Header) | Планируется |
| A-02 | Editable canvas — drag, connect, disconnect nodes | Планируется |
| A-03 | SHUTTLE: write endpoints (createEdge, deleteNode и т.д.) | Планируется |
| A-04 | Version history — diff между версиями lineage | Планируется |
| A-05 | Approval flow — предложить изменение → review → merge | Планируется |
| A-06 | Conflict detection — если Hound и ANVIL расходятся | Планируется |

---

## Технический долг — бэклог

### 🔴 Критический (всё закрыто в Phase 3)

| # | Проблема | Статус |
|---|----------|--------|
| TD-01 | SQL injection в SearchService | ✅ Закрыт (07.04) |
| TD-02 | Нет error handling в SHUTTLE (Uni без .onFailure) | ✅ Закрыт (07.04) |
| TD-03 | Нет error states в LoomCanvas | ✅ Закрыт (07.04) |
| TD-04 | console.log в production-коде | ✅ Закрыт (07.04) |
| TD-05 | Expand buttons зависают при ошибке | ✅ Закрыт (07.04) |

### 🟡 Высокий приоритет

| # | Проблема | Файл | Когда |
|---|----------|------|-------|
| TD-06 | LoomCanvas 866 LOC — монолит | LoomCanvas.tsx | Phase 3 финал / Phase 4 |
| TD-07 | transformGraph.ts ~700 LOC — монолит | transformGraph.ts | Phase 3 финал / Phase 4 |
| TD-08 | Нет retry-логики в React Query hooks | hooks.ts | Phase 4 |
| TD-09 | FilterToolbar + FilterToolbarL1 дублируют UI-примитивы | layout/ | Phase 4 |
| TD-10 | Нет rate limiting на /auth/login | Chur | Phase 4 |
| TD-11 | Hardcoded LIMIT в Cypher (200–500) без сигнала клиенту | SHUTTLE | Phase 4 |

### 🟢 Средний / Низкий приоритет

| # | Проблема | Когда |
|---|----------|-------|
| TD-12 | ColumnInfo.type всегда пустая строка (нужен Hound fix) | Phase 4 / Hound |
| TD-13 | Accessibility (ARIA labels, keyboard navigation) | Phase 4 |
| TD-14 | walkTree() в transformGraph без защиты от циклов | Phase 4 |
| TD-15 | Magic numbers не вынесены в конфиг (L2_MAX_COLS и т.д.) | Phase 4 |
| TD-16 | L1NodesProto.tsx (618 LOC прототип) — удалить | Phase 3 финал |
| TD-17 | ArcadeDB credentials в plaintext config (Chur) | Phase 4 |
| TD-18 | JWT refresh token не реализован | Phase 4 |

---

## Блокеры и внешние зависимости

| Блокер | Влияет на | Ответственный | Статус |
|--------|----------|---------------|--------|
| **HOUND-DB-001** — orphan DaliDatabase не видны | L1 Overview неполный | Hound team | ⬜ Не начат |
| **ArcadeDB Cypher UNION баг** — дедупликация labels | ExploreService данные | ArcadeDB vendor | 🔄 Обходной путь |
| **ColumnInfo.type** — тип колонки не парсится Hound | TableNode/Inspector типы | Hound team | ⬜ Не начат |
| **ANVIL requirements** — нет ТЗ | Phase 5 планирование | Product Owner | ⬜ Не зафиксировано |

---

## Метрики по фазам

| Фаза | LOC (FE) | LOC (BE) | Тесты | Фичи |
|------|---------|---------|-------|------|
| После Phase 1 | ~2,000 | 0 | 0 | Mock canvas |
| После Phase 2 | ~4,500 | ~1,100 | 0 | Real data |
| После Phase 3 (текущий) | ~12,000 | ~2,000 | 24 | Full LOOM + KNOT |
| Цель Phase 4 | ~10,000* | ~2,500 | 60+ | Performance + polish |
| Цель Phase 5 | ~16,000 | ~3,500 | 100+ | ANVIL |

*— уменьшение за счёт рефакторинга LoomCanvas + transformGraph

---

## Рекомендуемый порядок работ (апрель 2026)

```
Неделя 07–11 апреля (текущая)
  ├── Среда    F-01 KNOT Inspector (правая панель LOOM)
  ├── Четверг  F-02 Context menu + F-03 Export PNG
  └── Пятница  R-04 + R-01 LoomCanvas refactor + R-02 transformGraph split

Неделя 14–18 апреля
  ├── Понедельник  R-03 Unit-тесты transformGraph (Vitest)
  ├── Вторник      T-01 Integration тесты SHUTTLE (test profile)
  ├── Среда        D-01 Docker Compose
  ├── Четверг      P-01 Виртуализация React Flow + P-03 displayGraph memo
  └── Пятница      C-01 Refresh token + C-02 Rate limiting

Неделя 21–25 апреля
  ├── Понедельник  U-02 Impact analysis overlay
  ├── Вторник      U-03 Keyboard shortcuts
  ├── Среда–Пятница  H-01/H-02/H-03 HOUND-DB-001 (если Hound team готов)

Май 2026
  └── Phase 5 — ANVIL (после фиксации требований)
```
