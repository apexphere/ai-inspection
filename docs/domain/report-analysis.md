# Example Report Analysis

> Pattern analysis of 12 sample PDF reports across 4 report types.

**Author:** Riley 📐
**Date:** 2026-02-28
**Ticket:** #537
**Source:** `docs/resources/example-reports/`

---

## Summary of Findings

All report types from Abacus Building Consulting follow a **consistent structure** with shared conventions. The key differences are in the **assessment framework** and **scope**:

| Type | Purpose | Assessment Basis | Typical Pages |
|------|---------|-----------------|---------------|
| **COA** | Certificate of Acceptance for unconsented work | NZBC clause-by-clause review | 16–47 |
| **CCC** | Code Compliance Certificate gap analysis | Defect schedule + NZBC gap analysis | 29–96 |
| **PPI** | Pre-Purchase Inspection | NZS 4306:2005 condition assessment | 37–55 |
| **SS** | Safe & Sanitary for pre-1992 work | Building Act 1991 s.64 (safe/insanitary) | 10–20 |

---

## Cross-Type Common Structure

All Abacus reports share this skeleton:

| Section | COA | CCC | PPI | SS | Notes |
|---------|-----|-----|-----|-----|-------|
| Cover Page | ✅ | ✅ | ✅ | ✅ | Report title, address, client, job no, date |
| Document Control | ❌ | ✅ | ❌ | ❌ | CCC only — revision history + acceptance |
| Table of Contents | ✅ | ✅ | ✅ | ✅ | Always page 2 |
| Report Information Summary | ✅ | ❌ | ✅ | ✅ | Key project metadata table |
| Introduction | ✅ | ✅ | ✅ | ✅ | Engagement statement |
| Building & Site Description | ✅ | ✅ | ✅ | ✅ | Property details, history |
| Assessment/Methodology | ✅ | ✅ | ✅ | ✅ | Personnel, approach |
| Main Assessment | ✅ | ✅ | ✅ | ✅ | Type-specific (see below) |
| Remedial Works | ✅ | ✅ | varies | ✅ | Scope of required fixes |
| Limitations | ✅ | ✅ | ✅ | ✅ | Standard disclaimers |
| Signatures | ✅ | ✅ | ✅ | ✅ | Author + reviewer |
| Appendix A — Photos | ✅ | ✅ | ✅ | ✅ | Numbered: "Photograph 1", "Photograph 2" |
| Appendix B+ | ✅ | ✅ | varies | ❌ | Drawings, certificates, lab reports |

### Cover Page Format (all types)
```
[REPORT TYPE] REPORT
FOR
[PROPERTY ADDRESS]

Client:       [Name]
At:           [Full address]
Job no:       [Number]
Date:         [Date]
```

### Report Information Summary (COA, PPI, SS)
Standard key-value table:

| Field | Example |
|-------|---------|
| Project Number | 25012 |
| Activity | Conversion of Wine Cellar to Bathroom |
| Project Address | 18 Dene Court Lane, Greenhithe, Auckland |
| Client | Marius & Nita Brink |
| Territorial Authority | Auckland Council |
| Report Author | Jake Li |
| Report Reviewer | Ian Fong |
| Inspection Personnel | Jake Li |
| Date of Inspection | 01/10/2025 |
| Weather | Rain |
| Authorised for issue | Signed: Registered Building Surveyor |

### Signature Block Format (all types)
```
Report prepared by:                    Peer reviewed by:

[Signature]                            [Signature]

[Name]                                 [Name]
[Title]                                [Title]
[Credentials]                          [Credentials]

For and on behalf of [Company]         For and on behalf of [Company]
```

### Page Header/Footer (all types)
- **Header:** Job number + address
- **Footer:** Page number (e.g., "P a g e | 7")

### Photo Format (all types)
```
Photograph [N]
[Caption describing what the photo shows]

[Photo]
```

Photos are numbered sequentially across the report, referenced from the assessment sections (e.g., "Photograph 7,8,9").

---

## Type 1: COA (Certificate of Acceptance)

**Samples:** COA-18-Dene-Court-Lane.pdf (47pp), COA-76a-Chilcott-Rd.pdf (47pp)

### Structure
1. Cover Page
2. Table of Contents
3. **Section 1** — Report Information Summary
4. **Section 2** — Introduction
5. **Section 3** — Building & Site Description
   - 3.1 Background and Scope of CoA Work (location map, red highlights)
   - 3.2 Building History (consent table: building works → consent # → date)
   - Construction details (foundation, walls, roof, etc.)
6. **Section 4** — Assessment Methodology
   - 4.1 Assessment Personnel (credentials string)
   - 4.2 Methodology
   - **4.3 NZBC Code Clause Review** (main assessment table)
7. **Section 4 (cont)** — Preliminary Scope of Remedial Works
8. **Section 5** — Other Items to Submit to Council
9. **Section 6** — Limitations
10. **Section 7** — Signatures
11. **Appendix A** — Inspection Photographs
12. **Appendix B** — COA Drawings Extracts
13. **Appendix C** — Construction Report
14. **Appendix D** — Electrical COC & Safety Certificate
15. **Appendix E** — Producer Statement (Plumbing PS3)

### NZBC Code Clause Review Table (Core of COA)

This is the most important section — a table with columns:

| Column | Description |
|--------|-------------|
| **NZBC Code Clause** | e.g., B1 Structure, B2 Durability, E2 External Moisture |
| **Photographic Reference** | e.g., "Photograph 7,8,9" |
| **Observations and Analysis** | Detailed findings per clause |
| **Documentation provided** | What evidence exists |
| **Documentation required** | What's still needed |
| **Compliance requirement** | Quoted NZBC clause text |
| **Remedial works required** | What needs fixing (or "Nil" / "N/A") |

**Clauses reviewed** (in order): B1 Structure → B2 Durability → C Fire Safety → D1 Access Routes → E1 Surface Water → E2 External Moisture → E3 Internal Moisture → F1 Hazardous Agents → F2 Hazardous Building Materials → F4 Safety from Falling → F5 Construction Hazards → F6 Visibility → F7 Warning Systems → F8 Signs → G1 Personal Hygiene → G2 Laundering → G3 Food Preparation → G4 Ventilation → G5 Interior Environment → G9 Electricity → G10 Piped Services → G11 Gas → G12 Water Supplies → G13 Foul Water → G14 Industrial Liquid Waste → G15 Solid Waste → H1 Energy Efficiency

For non-applicable clauses, pattern is:
> "The CoA works do not affect [area]. As such, this Clause is not applicable." → N/A

### Key COA Observations
- Building history presented as a table (works → consent → date)
- Construction details listed as label:value pairs
- Site data includes: Wind Zone, E/Q Zone, Exposure Zone, Lot/DP, Council Property ID
- The clause review table spans 7+ pages
- Each clause gets full NZBC text quoted alongside observations
- Photos referenced by number, displayed in Appendix A

---

## Type 2: CCC (Code Compliance Certificate Gap Analysis)

**Samples:** CCC-12-Astelia-R3.pdf (29pp), CCC-22b-Huka-Rd-Full.pdf (96pp)

### Structure
1. Cover Page
2. **Document Control Records** (unique to CCC)
   - Prepared by, Telephone, Email
   - Revision History table (Rev No, Prepared By, Description, Date)
   - Document Acceptance table (Action, Name, Signed, Date)
3. Table of Contents
4. **Executive Summary** (unique to CCC)
5. **Section 1** — Introduction
   - 1.1 Introduction
   - 1.2 Extent of Instructions
   - 1.3 Documentation Provided
   - 1.4 Dialogue
   - 1.5 Methodology
   - 1.6 Reporting Conditions
   - 1.7 Equipment and Tools
   - 1.8 Exclusions
   - 1.9 Areas Not Accessed
6. **Section 2** — General Information
   - 2.1 Building Overview (detailed construction table)
   - 2.2 Building Location
   - 2.3 Building History
7. **Section 3** — Assessment Summary
   - 3.1 Summary of Identified Defects
   - 3.2 Remedial Works Rationale
8. **Section 4** — Defect Schedule (main assessment table)
9. **Section 4 (cont)** — Recommendation
10. **Section 5** — Scope of Remedial Works
11. **Section 6** — Limitations
12. **Section 7** — Signatures
13. **Appendix A** — Cost Estimate (unique to CCC)
14. **Appendix B+** — Consented Drawings, Council RFI, Notice to Fix, Lab Reports, Moisture Survey, Remedial Works Summary

### CCC Building Overview Table

Much more detailed than COA:

| Field | Example |
|-------|---------|
| Street address | 12 Astelia Place Goodwood Heights |
| Territorial Authority | Auckland Council |
| Appellation | Lot 2 DP 176291 |
| BC Number / Year | 956659 / 1996 |
| Year of construction | 1997 |
| Foundation/flooring | Timber framed suspended timber floor |
| Wall/Cladding/System | EIFS with texture coat |
| Roof system | Timber truss with concrete tiles |
| Parapet/Gutter | Timber framed profiled gable parapet / uPVC |
| Roof slope | Pitch ≧20° |
| Exterior joinery | Aluminium framed single glazed |
| Interior lining | Plasterboard, carpet, tile |

Plus site data: Climate Zone, EQ Zone, Exposure Zone, Lee Zone, Rainfall Range, Wind Zone.

### Defect Schedule Table (Core of CCC)

| Column | Description |
|--------|-------------|
| **Areas / Marked-up Photographs** | Location photos with annotations |
| **Observations and Analysis** | Detailed description of defect |
| **NZ Building Code Gap / Breach** | Which clause is breached + quoted text |
| **Remedial works required** | Specific fix needed |

Each defect gets its own row with inline photos (marked up with annotations/arrows).

### Key CCC Observations
- Has Document Control (revision history) — COA does not
- Has Executive Summary upfront — COA does not
- Equipment and tools listed (e.g., Trotec T660 Moisture Meter, Borescope)
- Defect photos are **inline with annotations** (not in appendix)
- Cost Estimate appendix with line items
- Much longer than COA (29–96 pages vs 16–47)
- Moisture survey results included as appendix
- Multiple appendices for supporting documents (drawings, council letters, lab reports)

---

## Type 3: PPI (Pre-Purchase Inspection)

**Samples:** PPI-185-Henwood-Full.pdf (55pp), PPI-HPPI-DEMO-REPORT-2021.pdf (37pp)

### Structure (Abacus / Eastern format)
1. Cover Page
2. Table of Contents
3. **Section 1** — Report Information Summary
4. **Section 2** — Introduction
5. **Section 3** — Building & Site Description
   - 3.1 Site Information (zone data, lot/DP)
   - 3.2 Building Information (bedrooms, bathrooms, status)
6. **Section 4** — Inspection Methodology
   - 4.1 Inspection Personnel (credentials)
   - 4.2 Methodology
7. **Section 5** — Summary of Inspection (overall condition statement)
8. **Section 6** — Site and Ground Condition
9. **Section 7** — Exterior of Building (roof, cladding, joinery, foundation)
10. **Section 8** — Interior of Building (room-by-room)
11. **Section 9** — Service Systems (power, water, gas, drainage, alarms)
12. **Section 10** — Limitations
13. **Section 11** — Signatures
14. **Appendix A** — Inspection Photographs
15. **Appendix B** — Infrared Thermal Imaging (unique to PPI)
16. **Appendix C** — Floor Level Survey (unique to PPI)

### Structure (HPPI format — different company)
Different structure entirely:
1. Cover Page (with property image)
2. Summary of Report (major defects list upfront)
3. Weathertightness Risk Awareness
4. Terms and Conditions
5. Scope of Inspections
6. Moisture Testing Information
7. Overview
8. Defect Images
9. External Inspection
10. External & Landscaping
11. Retaining Walls
12. (continues by building element...)

### Key PPI Observations
- **Assessment basis is NZS 4306:2005** (not NZBC clauses like COA)
- Inspected by building element (site → exterior → interior → services), not by code clause
- Includes **infrared thermal imaging** results
- Includes **floor level survey** (laser level measurements)
- Conclusion per section: "No obvious defects" or lists findings
- Photo references: "[ Appendix A ] Photograph 1~10" (range notation)
- Different companies use significantly different formats (HPPI vs Eastern/Abacus)
- Overall condition rating: "above average" / "average" / "below average"
- Building info includes: bedrooms, bathrooms, year built, CCC status

---

## Type 4: SS (Safe & Sanitary)

**Samples:** SS-1-1-Opua-St.pdf (20pp), SS-Special-Inspection.pdf (10pp), SS-Third-Party-CHUR6.pdf (11pp)

### Structure (Abacus format)
1. Cover Page
2. Table of Contents
3. **Section 1** — Report Information Summary
4. **Section 2** — Introduction
5. **Section 3** — Building & Site Description (building info table)
6. **Section 4** — Assessment Methodology
   - 4.1 Assessment Personnel
   - 4.2 Methodology
   - 4.3 Assessment Framework (Building Act 1991 s.64)
7. **Section 3 (reused)** — Assessment Framework Table
8. **Section 4** — Preliminary Scope of Remedial Works
9. **Section 5** — Summary
10. **Section 6** — Limitations
11. **Section 7** — Signatures
12. **Appendix A** — Inspection Photographs

### Structure (Third-party / Archavium format)
Simpler, flatter structure:
1. Cover Page
2. Table of Contents
3. Background
4. Building Report — by NZBC clause (B1, B2, E1, E2, E3...)
5. Conclusion

### Assessment Framework Table (Core of SS)

| Column | Description |
|--------|-------------|
| **Items** | Building element (Foundation, Walls, Roof, Joinery, etc.) |
| **Photographic Reference** | Photo numbers |
| **Observations and Analysis** | Condition assessment |
| **Compliance requirement** | Building Act 1991 s.64(1) unsafe / s.64(4) insanitary |
| **Remedial works required** | Fixes needed (or "Nil") |

### Key SS Observations
- **Assessment basis is Building Act 1991 s.64** (not NZBC or NZS 4306)
- Two tests: (1) Is it **unsafe** under s.64(1)? (2) Is it **insanitary** under s.64(4)?
- For pre-1992 work only (before Building Act 2004)
- Much shorter than other types (10–20 pages)
- Simpler construction description
- Third-party formats vary significantly from Abacus format
- Same boilerplate limitations text as COA

---

## Cross-Type Patterns & Insights

### 1. Boilerplate Text (Reusable Templates)

**Introduction** — Same template across COA/SS:
> "[Company] have been engaged to carry out an independent assessment of the building works at [address] to determine compliance to the New Zealand Building Code."

**Limitations** — Nearly identical across all types:
> "This report has been prepared for the client by [Company] under a specific scope and Terms of Engagement. The report is based on our observations from a visual survey of the building visible at the time of inspection."

**Methodology** — Same opening across COA/CCC/SS:
> "In the process of the assessment, photographs were taken during the site inspection. Relevant documents provided by the client were used as references..."

### 2. Credential Strings

Personnel credentials follow a consistent format:
- `Ian Fong, Registered Building Surveyor, MNZIBS, Dip. Building Surveying, BE (Hons), MBA`
- `Jake Li, Building Surveyor, MConMgt, M.Engin.(Safety), BSc. (Materials)`

Format: `[Name], [Title], [Membership Code], [Qualifications comma-separated]`

### 3. Variable Data (What Changes Per Report)

| Variable | Source |
|----------|--------|
| Property address | Project |
| Client name | Client |
| Job number | Project |
| Date of inspection | Inspection |
| Weather | Inspection |
| Report author + credentials | Personnel |
| Report reviewer + credentials | Personnel |
| Territorial authority | Property |
| Lot/DP/Council Property ID | Property |
| Zone data (wind, EQ, climate, exposure) | Property (from BRANZ Maps) |
| Building history | Property research |
| Construction details | Inspection findings |

### 4. Photo Conventions

- Sequential numbering: "Photograph 1", "Photograph 2"
- Referenced from assessment sections: "Photograph 7,8,9"
- PPI uses range notation: "Photograph 1~10"
- CCC uses inline annotated photos in defect schedule
- COA/SS/PPI put photos in Appendix A
- Each photo has a descriptive caption below it

### 5. Assessment Table Variations

| Type | Rows are... | Key columns |
|------|-------------|-------------|
| COA | NZBC clauses (B1, B2, C, D1...) | Observations, Docs provided/required, Compliance, Remedial |
| CCC | Individual defects | Photos, Observations, Code breach, Remedial |
| PPI | Building elements (site, exterior, interior, services) | Narrative paragraphs per section |
| SS | Building elements + safety/sanitary tests | Observations, Compliance (s.64), Remedial |

### 6. Format Consistency Within Company

Abacus/Eastern reports follow a **very consistent** internal template — same fonts, same page layout, same section numbering. Third-party reports (HPPI, Archavium) use completely different formats. This confirms that **templates are company-specific**, not industry-standard.

---

## Implications for Our System

### What We Got Right
- ✅ Section-based report structure (sections 1–7 + appendices)
- ✅ Report Information Summary as key-value table
- ✅ NZBC clause review table for COA
- ✅ Defect schedule for CCC
- ✅ Variable substitution for boilerplate text
- ✅ Photo numbering and captioning
- ✅ Signature block with credentials
- ✅ Report versioning (CCC has revision history)

### Gaps to Address
1. **PPI report type not templated** — Structure is different (element-by-element, not clause-by-clause). Needs its own template with sections for Site, Exterior, Interior, Services.
2. **SS report type not templated** — Uses Building Act 1991 s.64 framework, not NZBC. Simpler structure.
3. **CCC Executive Summary missing** — Our CCC template needs an executive summary section upfront.
4. **CCC Document Control missing** — Revision history + document acceptance table.
5. **CCC inline photos** — Defect schedule has annotated photos inline, not in appendix. Different from COA.
6. **CCC Cost Estimate appendix** — We have the entity but need it rendered as an appendix.
7. **PPI thermal imaging appendix** — Infrared results as a dedicated section.
8. **PPI floor level survey** — Laser level measurements presented visually.
9. **Building history table** — Consent history (works → consent # → date granted) is standard across COA/CCC.
10. **Zone data from BRANZ Maps** — Climate, EQ, Exposure, Wind zones are standard metadata.
11. **N/A clause handling** — COA has a consistent pattern for non-applicable clauses that should be templated.
12. **Equipment list** — CCC lists specific tools used (moisture meter model, borescope, etc.).

### Priority Recommendations
1. **High:** Add PPI and SS report templates (new report types)
2. **High:** Add Executive Summary + Document Control to CCC template
3. **Medium:** Support inline annotated photos in defect schedule (CCC)
4. **Medium:** Add building history consent table
5. **Low:** Add thermal imaging and floor survey appendices for PPI
6. **Low:** Template N/A clause responses for COA
