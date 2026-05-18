# Drop 01 Tag Backfill — Operation Doc

## Why

The new "Drop NN Available" smart collections are rule-gated on `TAG=drop-NN AND inventory>0`. Without backfilling, the existing 97 Drop 01 products have empty tags and won't match. Audit confirmed: all 97 Drop 01 products currently have `tags: []`.

## What

Add the `drop-01` tag to all 97 Drop 01 products in one sequential pass. Safe — they currently have zero tags, so we're not at risk of clobbering anything. Defensive read-first-then-write pattern preserves any tags Maxwell adds in the meantime.

## When

Run **after** the existing `drop-01-available` smart collection rule is updated to require `TAG=drop-01` — otherwise that collection breaks (would show 0 products) until the backfill completes. Sequence is critical.

## Plan

### Step 1 — Update `drop-01-available` smart collection rule

Pre-step: identify the existing collection's `ruleSet`. Current state from the earlier MCP `search_collections` call: handle `drop-01-available`, GID `gid://shopify/Collection/308052197454`, single rule `VARIANT_INVENTORY > 0`.

Need to update to: `(TAG = drop-01) AND (VARIANT_INVENTORY > 0)` (conjunctive).

MCP doesn't have a `update-collection` tool that exposes ruleSet, so use `graphql_mutation` with `collectionUpdate`:

```graphql
mutation UpdateDrop01AvailableRule($input: CollectionInput!) {
  collectionUpdate(input: $input) {
    collection { id handle ruleSet { appliedDisjunctively rules { column relation condition } } }
    userErrors { field message }
  }
}
```

Variables:
```json
{
  "input": {
    "id": "gid://shopify/Collection/308052197454",
    "ruleSet": {
      "appliedDisjunctively": false,
      "rules": [
        { "column": "TAG", "relation": "EQUALS", "condition": "drop-01" },
        { "column": "VARIANT_INVENTORY", "relation": "GREATER_THAN", "condition": "0" }
      ]
    }
  }
}
```

Immediately after this lands, `/collections/drop-01-available` will read empty until Step 2 runs. Plan for back-to-back execution.

### Step 2 — Bulk-tag the 97 Drop 01 products

The 97 products live in manual collection `DROP 01` (handle `drop-01`, GID `gid://shopify/Collection/307842908238`). Fetch product IDs in pages of 50, then `productUpdate` each one with `tags: <existing> + ["drop-01"]`.

**Read query:**
```graphql
query Drop01ProductsForBackfill($cursor: String) {
  collection(id: "gid://shopify/Collection/307842908238") {
    products(first: 50, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      edges { node { id tags } }
    }
  }
}
```

**Per-product update:**
```graphql
mutation TagProduct($input: ProductInput!) {
  productUpdate(input: $input) {
    product { id tags }
    userErrors { field message }
  }
}
```

Variables (built per product — preserve existing tags, append `drop-01` if not already present):
```json
{
  "input": {
    "id": "gid://shopify/Product/XXXXXXXXX",
    "tags": ["drop-01", "<any-existing-tags>..."]
  }
}
```

### Step 3 — Verify

- `search_products` with `tag:drop-01 status:active` → should return 97.
- Browse `/collections/drop-01-available` → in-stock Drop 01 pieces only. Approximate count from earlier audit: ~36.
- Browse `/collections/archive` (sold from Drop 01) → ~61 pieces. (Unchanged — Archive rule is independent.)

### Step 4 — Create `drop-02-available` smart collection

Once Drop 01 is clean, create the Drop 02 counterpart so Drop 02 listings auto-populate once they ship with the `drop-02` tag.

```json
{
  "tool": "mcp__claude_ai_Shopify__create-collection",
  "args": {
    "title": "Drop 02 Available",
    "descriptionHtml": "<p>Currently available pieces from Drop 02.</p>",
    "sortOrder": "PRICE_DESC",
    "ruleSet": {
      "appliedDisjunctively": false,
      "rules": [
        { "column": "TAG", "relation": "EQUALS", "condition": "drop-02" },
        { "column": "VARIANT_INVENTORY", "relation": "GREATER_THAN", "condition": "0" }
      ]
    }
  }
}
```

Confirm the auto-generated handle is `drop-02-available` so the drawer nav link in [theme.liquid](../layout/theme.liquid) resolves.

## Idempotency

Re-running the backfill is safe: the per-product update preserves existing tags and only appends `drop-01` if missing. No duplicates.

If a product is added to `DROP 01` manual collection later (e.g. by Maxwell), re-running Step 2 picks it up.

## Rollback

If the rule update on `drop-01-available` causes issues before backfill is complete, revert to a single-rule ruleSet:

```json
{
  "input": {
    "id": "gid://shopify/Collection/308052197454",
    "ruleSet": {
      "appliedDisjunctively": false,
      "rules": [
        { "column": "VARIANT_INVENTORY", "relation": "GREATER_THAN", "condition": "0" }
      ]
    }
  }
}
```

This restores the prior (over-inclusive) behavior — every in-stock product across all drops appears.

## Estimated time

- Step 1: 1 mutation, ~2 seconds
- Step 2: ~100 mutations sequentially, ~3-4 minutes total at Shopify's rate limit (2 req/sec)
- Step 3: 2-3 MCP read queries + browser checks
- Step 4: 1 mutation, ~2 seconds

Total: ~5 minutes of MCP activity, fully reversible.
