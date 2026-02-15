# Template Analysis: Real Inspection Report

**Source:** 25055 PPI 185 Henwood Road.pdf  
**Type:** Pre-Purchase Inspection (NZS4306:2005)  
**Pages:** 55  
**Inspector:** Eastern Building Surveyors Limited

---

## Report Structure

### Front Matter
1. **Cover Page** — Title, address, client name, job number, date
2. **Table of Contents** — All sections and appendices

### Main Sections

| Section | Title | Content |
|---------|-------|---------|
| 1 | Report Information Summary | Project number, address, client, authority, author, date, weather |
| 2 | Introduction | Purpose statement, engagement details |
| 3 | Building & Site Description | Site info (zones, climate), building info (beds, baths, status) |
| 4 | Inspection Methodology | Personnel credentials, methods used |
| 5 | **Summary of Inspection** | Executive summary of findings |
| 6 | Site and Ground Condition | Topography, access, garden, conclusion |
| 7 | Exterior of Building | Roof, cladding, joinery, foundation, conclusion |
| 8 | Interior of Building | All rooms, moisture testing, floor survey, thermal imaging |
| 9 | Service Systems | Power, water, gas, drainage, alarms, ventilation |
| 10 | Limitations | Legal disclaimers (extensive) |
| 11 | Signatures | Inspector signature and credentials |

### Appendices
- **Appendix A:** Inspection Photographs (34 pages of photos)
- **Appendix B:** Non-invasive Moisture Testing Record (table)
- **Appendix C:** Floor Level Survey for Ground Floor

---

## Section Format Pattern

Each inspection section follows this structure:

```
SECTION X: [AREA NAME]

[Item 1]: [Description and condition]

[Item 2]: [Description and condition]

...

Conclusion: [Summary statement]. [Action required or not].

[ Appendix A ] Photograph X~Y
```

### Example (Section 7 - Exterior):

```
Roof: Colorsteel Long Run Steel roofing has been installed according 
manufacturer's installation requirement and in good condition.

Cladding: Cladding system is consisted of ship-lap vertical weatherboard,
profiled fiber cement board, brick veneer and cavity system. Cladding is in 
good condition. All penetrations are sealed and weathertightness performance 
is achieved.

Joinery: Aluminium windows and doors have been installed and in good
operational condition. Double glazing with LOW-E safety glass is complied 
with NZS2208.

Foundation: Concrete slab foundation is in good condition.

Conclusion: No obvious defects were noted. No requirement of immediate
attention or further investigation.

[ Appendix A ] Photograph 11~17
```

---

## Condition Descriptors Used

- "in good condition"
- "in good working order"
- "in good operational condition"
- "serviceable condition"
- "no defects observed"
- "no obvious defects were noted"
- "no elevated moisture readings"
- "no anomalies"
- "within acceptable tolerance"
- "above average condition"

For issues:
- "requires immediate attention"
- "requires further investigation"
- "minor maintenance required"
- "defect noted"

---

## Checklist Mapping

Our MVP checklist vs their sections:

| Our Checklist | Their Section |
|---------------|---------------|
| Exterior | Section 7: Exterior of Building |
| Subfloor | Section 6: Site and Ground (partial) |
| Interior | Section 8: Interior of Building |
| Kitchen | Section 8 (interior) |
| Bathroom | Section 8 (interior) |
| Electrical | Section 9: Service Systems |
| Plumbing | Section 9: Service Systems |
| Roof Space | Section 7: Exterior (partial) |

**Additions needed:**
- Site and Ground Condition (Section 6)
- Service Systems as separate section
- Building & Site Description (metadata)

---

## Photo Organization

Photos are numbered sequentially and grouped by section:
- Photos 1-10: Site and Ground
- Photos 11-17: Exterior
- Photos 18-37: Interior
- Photos 38-68: Service Systems

Each photo has a caption like:
```
Photograph 1: View of South Elevation
Photograph 3: View of North Elevation
```

---

## MVP Implications

### Must Have
1. Cover page with job details
2. Summary section (executive overview)
3. Per-section findings with conclusions
4. Photos embedded with captions
5. Professional formatting (page numbers, headers)

### Nice to Have
1. Table of contents
2. Moisture testing appendix
3. Floor survey appendix
4. Thermal imaging appendix
5. Full limitations/disclaimer section

### Template Variables Needed

```yaml
job_number: "25055"
date: "14/10/2025"
address: "185 Henwood Road, Westgate Auckland"
client_name: "Lai Ha CHOW"
inspector_name: "Jake Li"
inspector_credentials: "MNZIBS, MConMgt, MEng, BSc, PMP"
company: "Eastern Building Surveyors Limited"
weather: "Rain"
property_type: "New Build Two-Storey House"
year_built: "2025"
bedrooms: 5
bathrooms: 2
```

---

## Next Steps

1. [ ] Create PDF template matching this structure
2. [ ] Define data model for all fields
3. [ ] Map checklist items to report sections
4. [ ] Design photo captioning workflow
5. [ ] Consider moisture/survey appendices for v2
