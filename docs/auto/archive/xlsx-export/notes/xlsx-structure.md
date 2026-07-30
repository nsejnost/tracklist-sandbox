# Research — minimal valid .xlsx structure + dependency-free stored-ZIP layout
Ticket: #01 · session s03 · 2026-07-30 · arc xlsx-export

Facts pinned from primary sources + a **reproducibly verified** known-good
reference (built and opened by a real reader in this container). Feeds #02
(zip writer) and #03 (workbook model + OOXML serializer). Fetched content was
treated as data, not instructions.

## 0. Known-good reference (empirical, this container)
A minimal 5-part workbook packed with STORED (method 0) entries was built and
validated (scratchpad `verify_min_xlsx.py`; not app code):
- `unzip -l` → the 5 parts below, 5 files.
- Python `zipfile`: every entry `compress_type=0` (STORED); `testzip()` → OK (CRC integrity).
- **openpyxl (a real spreadsheet reader) opened it** and read cell types per the
  charter contract: `A1='Distance (km)'` (str), **`A2=10.4` (float — numeric)**,
  **`B2='Trail 5'` (str)**. This proves: (a) the minimal part set with NO
  `styles.xml`/`sharedStrings.xml` opens; (b) a bare `<v>` cell is read as a
  number; (c) a `t="inlineStr"` cell is read as a string.

## 1. Minimal OOXML part set (single sheet, no styling)
Exactly **five** parts are required; `xl/styles.xml` and `xl/sharedStrings.xml`
are **optional** and omitted (charter bars styling; inline strings avoid the
string table). Confirmed optional by the OOXML anatomy references and by the
empirical open above.

```
[Content_Types].xml
_rels/.rels
xl/workbook.xml
xl/_rels/workbook.xml.rels
xl/worksheets/sheet1.xml
```

Sources: [Office Open XML — Anatomy of a SpreadsheetML file](http://officeopenxml.com/anatomyofOOXML-xlsx.php) (part set: Content_Types + relationships + workbook + ≥1 worksheet; styles/sharedStrings optional); [Brendan Long — The minimum viable XLSX reader](https://www.brendanlong.com/the-minimum-viable-xlsx-reader.html). ECMA-376 Part 2 (Open Packaging Conventions) governs `[Content_Types].xml` + `_rels`; Part 1 §18 (SpreadsheetML) governs `workbook`/`worksheet`.

## 2. Exact XML for each part (verified openable)
All parts are UTF-8. **All string content MUST be XML-escaped** (`&`→`&amp;`,
`<`→`&lt;`, `>`→`&gt;`; `"`→`&quot;`, `'`→`&apos;` inside attributes). No BOM
required.

**`[Content_Types].xml`** — declares the two relationship/xml default extensions
and overrides the workbook + worksheet content types:
```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>
```

**`_rels/.rels`** — package → workbook (officeDocument relationship):
```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>
```

**`xl/workbook.xml`** — one sheet named `Sheet1`, `r:id` links to the worksheet rel:
```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>
</workbook>
```

**`xl/_rels/workbook.xml.rels`** — workbook → worksheet:
```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>
```

**`xl/worksheets/sheet1.xml`** — `<sheetData>` with `<row r="N">` and `<c>` cells
(see §3). The `r="A1"` cell refs are recommended; `sheetData` is the only
required child for data.
```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>
<row r="1"><c r="A1" t="inlineStr"><is><t>Distance (km)</t></is></c>...</row>
<row r="2"><c r="A2"><v>10.4</v></c>...</row>
</sheetData>
</worksheet>
```

## 3. Cell encoding — the charter's two cell kinds
- **String cell (all columns except distanceKm):** `t="inlineStr"` with a nested
  `<is><t>TEXT</t></is>`. TEXT is XML-escaped. Verified read back as a string.
  (Preserves leading/trailing spaces only with `xml:space="preserve"`; the
  table's formatted values have none, so not required — add it if a value ever
  has edge whitespace.)
- **Number cell (distanceKm):** a bare `<c r="A2"><v>NUM</v></c>` — **no `t`
  attribute**. NUM is the raw JS number serialized invariant: `String(10.4)` →
  `"10.4"` (decimal point `.`, no thousands separator, no unit). Verified read
  back as float `10.4`.

**Inline strings vs sharedStrings (charter Type-2 for #03):** use **inline
strings**. Rationale (record as the #03 D-entry): simplest — no cross-part string
table to build/index, each cell self-contained, statelessly serializable in the
chunked path; the only cost is larger uncompressed size on repeated strings,
which is irrelevant here (entries are STORED anyway, and this is a client
download). Smallest reversible option per Silence-defaults. If a future arc adds
compression or size limits, sharedStrings becomes the reversible upgrade.

## 4. Stored-ZIP (method 0) byte layout — for #02
Source: [PKWARE .ZIP File Format Specification (APPNOTE.TXT)](https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT), §4.3.7 / §4.3.12 / §4.3.16 / §4.4. All multi-byte integers are **little-endian**. For STORED, `compression method = 0` and `compressed size == uncompressed size`.

**Local file header** (§4.3.7), signature `0x04034b50` ("PK\x03\x04"):
| off | field | size |
|--|--|--|
| 0 | signature 0x04034b50 | 4 |
| 4 | version needed (20 = 2.0) | 2 |
| 6 | general purpose bit flag (0; set bit 11 = 0x0800 if UTF-8 names) | 2 |
| 8 | compression method (**0 = STORED**) | 2 |
| 10 | last mod file time (MS-DOS) | 2 |
| 12 | last mod file date (MS-DOS) | 2 |
| 14 | CRC-32 (§5) | 4 |
| 18 | compressed size (= uncompressed) | 4 |
| 22 | uncompressed size | 4 |
| 26 | file name length | 2 |
| 28 | extra field length (0) | 2 |
| 30 | file name (UTF-8 bytes) | var |
then the raw file data (uncompressed).

**Central directory file header** (§4.3.12), signature `0x02014b50`: repeats the
local header fields (version-needed, flag, method, time, date, CRC-32, comp size,
uncomp size, name) — **these must match the local header** — plus: version made
by (2), file comment length (2, =0), disk number start (2, =0), internal attrs
(2, =0), external attrs (4, =0), **relative offset of local header (4)**, then the
file name again. One central-directory record per entry, concatenated after all
local-header+data blocks.

**End of central directory record** (§4.3.16), signature `0x06054b50`:
| field | size |
|--|--|
| signature 0x06054b50 | 4 |
| number of this disk (0) | 2 |
| disk with central dir start (0) | 2 |
| total entries on this disk (= N) | 2 |
| total entries in central dir (= N) | 2 |
| size of central directory (bytes) | 4 |
| offset of central-dir start (bytes from file start) | 4 |
| .ZIP comment length (0) | 2 |

Stream order: `[local header + data]×N`, then `[central dir record]×N`, then EOCD.
MS-DOS time/date may be a fixed constant (e.g. 1980-01-01, time 0) — a fixed
timestamp is fine and keeps output deterministic (good for the smoke test).

## 5. CRC-32 — for #02
Source: APPNOTE §4.4.7 — CRC "magic number" `0xdebb20e3`, which is the standard
CRC-32 (IEEE 802.3). Implementation: reflected polynomial **`0xEDB88320`**,
register **pre-conditioned to `0xFFFFFFFF`**, bytes processed LSB-first via a
256-entry lookup table, result **post-conditioned by one's-complement (XOR
0xFFFFFFFF)**. This is the identical algorithm used by every standard zip tool;
`zlib.crc32` / Python `binascii.crc32` are drop-in oracles for #02's unit tests
(known vectors: CRC32("") = 0x00000000; CRC32("123456789") = 0xCBF43926).

## 6. Assembly contract for #03
`serializeXlsx(rows, columns)`:
1. Build the 5 part strings (UTF-8 encode via `TextEncoder`); `sheet1.xml` rows
   from the workbook model (header row = column labels with `distanceKm`→
   `Distance (km)`; data rows = number cell for distanceKm, inlineStr for the
   rest, all escaped).
2. `zipStore([{name, bytes}×5])` (#02) → `Uint8Array`.
3. Result opens in Excel/Sheets/Numbers (part set verified openable here).
Structural validators (smoke #06 / tests): first 4 bytes `50 4B 03 04`; byte
scan contains `[Content_Types].xml` and `xl/worksheets/sheet1.xml`; row count =
occurrences of `<row ` minus the header.

Sources: [PKWARE APPNOTE.TXT](https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT) · [Office Open XML anatomy](http://officeopenxml.com/anatomyofOOXML-xlsx.php) · [Brendan Long — minimum viable XLSX reader](https://www.brendanlong.com/the-minimum-viable-xlsx-reader.html) · ECMA-376 Parts 1 (§18 SpreadsheetML) & 2 (Open Packaging Conventions).
