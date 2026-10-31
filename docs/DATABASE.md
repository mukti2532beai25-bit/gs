# BahiVerse AI — Database & Schema Specification

## Target Database Engine: PostgreSQL 16
Prisma Schema is located at `backend/prisma/schema.prisma`.

### Relational Entities (3NF Normalized)
1. **`Business`**
   - Tenant boundary entity.
   - Primary Key: `UUID`
   - Attributes: `name`, `gstin`, `address`, `phone`, `email`, `language`, `currency`, `createdAt`, `updatedAt`
   - Indexed on `gstin`.

2. **`User`**
   - Store owners and staff accounts.
   - Primary Key: `UUID`
   - Relations: `Business` (foreign key `businessId`).
   - Security: PBKDF2 / Bcrypt salted password hash.

3. **`Customer`**
   - Store parties and debtors.
   - Primary Key: `UUID`
   - Relations: Belongs to `Business`.
   - Indexed on `[businessId, name]` and `[businessId, phone]`.

4. **`Product`**
   - Catalog standard items.
   - Attributes: `name`, `aliases` (JSON array of regional names), `unit`, `defaultPrice` (Decimal 12,2).

5. **`Bill`**
   - Invoice / receipt header.
   - Attributes: `imageUrl`, `captureMode`, `rawText`, `language`, `billNumber`, `billDate`, `subtotal` (Decimal), `taxAmount` (Decimal), `totalAmount` (Decimal), `status`, `confidence`.
   - Status workflow: `pending` → `extracted` → `reviewed` → `approved` → `exported`.

6. **`BillItem`**
   - Line-item breakdown.
   - Preserves **historical transaction price** (`unitPrice` Decimal) even if catalog product prices fluctuate over time.
   - `quantity` (Decimal 10,3), `totalPrice` (Decimal 12,2), `confidence` (Float), `isEdited` (Boolean).

7. **`VocabularyMapping`**
   - Local shop slang and dialect mapping.
   - Unique on `[businessId, rawTerm]`.
   - Attributes: `rawTerm`, `normalizedTerm`, `category`, `language`, `usageCount`.

8. **`Correction`**
   - Audit trail of human and voice corrections.
   - Attributes: `fieldName`, `originalValue`, `correctedValue`, `source` (`manual` | `voice`).

9. **`ProcessingJob`**
   - Async extraction pipeline tracker with error capturing.

10. **`ExportRecord`**
    - History log of CSV, JSON, and Tally XML downloads.

---

## Starting PostgreSQL via Docker
```bash
# In repository root:
docker compose up -d

# Verify container status:
docker compose ps

# Run Prisma migration:
npm run prisma:migrate
```
