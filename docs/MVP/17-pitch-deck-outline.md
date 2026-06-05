# GeoUMKM Smart V4.0 - Pitch Deck Outline

**Version:** 4.0  
**Format:** 10-Slide Investor Pitch Deck  
**Duration:** 10-15 minutes presentation + 5-10 minutes Q&A  
**Audience:** Investors, Angel Investors, VCs, Strategic Partners

---

## SLIDE 1: COVER / TITLE SLIDE

### **Visual Design:**
- Background: Indonesia map (geospatial visualization) with kecamatan grid overlay
- Foreground: Company logo + key visual elements

### **Content:**
```
GeoUMKM Smart V4.0
AI-Powered MSME Credit Intelligence for Indonesia

Tagline: "The Only Platform Combining Explainable AI + Geospatial + Enterprise"

[Company Logo]

Investor Meeting
[Date]
[Location]
```

### **Speaker Notes:**
"Good morning. We're GeoUMKM Smart, and we're solving a $5 billion credit gap in Indonesia by combining explainable AI, geospatial analytics, and cloud-native technology. In the next 10 minutes, I'll walk you through our market opportunity, solution, traction, and why this is a once-in-a-generation investment in Indonesian fintech."

### **Slide Duration:** 30 seconds

---

## SLIDE 2: THE OPPORTUNITY (Market Problem)

### **Visual Design:**
- Large number: "61.5M UMKMs"
- Breakdown chart: 30% with formal credit, 70% unserved
- Animated metric: IDR 500T+ credit gap (grows/pulses)

### **Content:**

**Title:** "61.5M UMKMs. 40M Unserved. $5B Problem."

**Key Facts (Bullet Points):**
- Indonesia's 61.5M UMKMs contribute 60-70% of GDP
- Only 30% have formal credit access (40M remain unserved)
- Annual credit gap: IDR 500T+ of unmet demand
- Default rates: 8-12% portfolio loss (regulatory burden)
- Government program KUR: 25% of funding goes to low-growth areas (targeting blind spot)

**The Three Markets We Target:**

| Segment | Problem | Opportunity |
|---------|---------|-------------|
| **Banks** | 5-10 day assessment, 8-12% losses | Faster decisions, lower risk |
| **Government** | KUR targeting blind spot | Data-driven policy + ROI measurement |
| **Investors** | Can't identify growth clusters | Location intelligence for portfolio building |

### **Speaker Notes:**
"Indonesia's MSME sector is the backbone of the economy—97% of employment, 70% of GDP. But 40 million UMKMs lack formal credit. That's not just a problem for the UMKMs; it's a massive problem for banks who can't lend, governments who can't target programs effectively, and investors who miss high-growth opportunities. We're looking at IDR 500 trillion in unmet annual credit demand."

### **Slide Duration:** 1-2 minutes

---

## SLIDE 3: THE PROBLEM BREAKDOWN (Stakeholder Pain)

### **Visual Design:**
- Three panels side-by-side (Bank | Government | Investor)
- Icons + color coding (red = pain point, green = solution)

### **Content:**

**Title:** "Three Stakeholders. Three Broken Solutions."

**Left Panel — Bank's Pain:**
- Current: Manual assessment (5-10 days), black-box models (regulators skeptical), high defaults
- Cost: 8-12% portfolio loss = IDR billions annually
- Regulation: OJK demanding explainability (no solution available yet)

**Middle Panel — Government's Pain:**
- Current: KUR targeted by province (not data), no impact measurement, wasted budget
- Cost: 25% of KUR to low-growth areas = IDR 25T wasted annually
- Problem: Can't measure if training/infrastructure works

**Right Panel — Investor's Pain:**
- Current: Manual location screening, can't distinguish clusters, slow due diligence
- Cost: Missed opportunities + geographic concentration risk
- Problem: 3 months to evaluate locations (should be 3 weeks)

### **Speaker Notes:**
"Let me break down the three problems we solve:

**For banks:** Credit assessment takes 5-10 days, regulators distrust black-box models, and default rates are 8-12%. They need explainable scoring that works faster.

**For government:** KUR program has IDR 100T annually, but 25% goes to low-growth areas. They need data-driven targeting and a way to measure if interventions work.

**For investors:** They want to invest in high-growth MSME clusters, but they can't identify them. Current due diligence takes 3 months. They need instant location intelligence."

### **Slide Duration:** 1-2 minutes

---

## SLIDE 4: THE SOLUTION (GeoUMKM Platform)

### **Visual Design:**
- Central platform diagram showing three products
- Screenshots/mockups of Bank dashboard, Government dashboard, Investor API
- Tech stack badges (Python, XGBoost, Azure, OpenAI)

### **Content:**

**Title:** "GeoUMKM Smart: Three Products, One Platform"

**Product 1 — Bank Scoring API:**
- Endpoint: `POST /api/v1/credit-score`
- Input: UMKM ID
- Output: PD bucket (0-5), score (0-100), SHAP explainability
- Speed: <1 second latency
- Regulatory: OJK-compliant (SHAP reasoning)

**Product 2 — Government Policy Dashboard:**
- Real-time cluster mapping (kecamatan-level insights)
- What-if simulation: "If we add infrastructure to Region X, UMKM scores improve by Y%"
- KPI tracking: Measure KUR targeting efficiency + policy impact

**Product 3 — Investor Discovery Platform:**
- REST API: Location scores, opportunity ranking
- Dashboard: Sector + geographic heatmaps
- Alerts: Real-time high-growth cluster detection

**Technical Differentiation:**
- ✅ Explainable AI (SHAP): Every score includes "Why?"
- ✅ Geospatial (596 kecamatan): 34 engineered features (elevation, rainfall, electricity, ports, etc.)
- ✅ 2026-Ready: Cloud-native, serverless, multi-region disaster recovery
- ✅ Chat Interface: Azure OpenAI integration for natural language queries

### **Speaker Notes:**
"Here's our solution: GeoUMKM Smart is a single platform with three integrated products:

**First, for banks:** An API that returns credit scores in under 1 second. But unlike competitors, every score includes a detailed breakdown of WHY. For example: 'UMKM_12345 is high-risk because the area has 30% unemployment (minus 0.2 points), no registered business (minus 0.15 points), low electricity access (minus 0.1 points).' This explainability is critical—regulators are demanding it, and we have it built-in.

**Second, for government:** A policy dashboard where they can simulate the impact of their interventions. 'If we build 1000 MW of solar infrastructure in this region, UMKM scores improve by 15%.' This is how they turn gut-feel policy into data-driven decisions.

**Third, for investors:** A discovery platform that screens thousands of locations in minutes, highlighting the highest-opportunity UMKM clusters. Instead of 3-month due diligence, they get instant location intelligence.

And what ties all three together? Our geospatial technology. We've engineered 34 location-specific features—elevation, rainfall, port proximity, electricity density, road quality, human capital—that competitors don't have. This is our moat."

### **Slide Duration:** 2-3 minutes

---

## SLIDE 5: DIFFERENTIATION (Why We Win)

### **Visual Design:**
- **4-Quadrant Matrix** (most important slide visually):
  - X-axis left: Enterprise ←→ right: Geospatial
  - Y-axis bottom: Speed ←→ top: Explainability
  - GeoUMKM positioned top-right (Enterprise + Explainable + Geospatial)
  - Competitors scattered: Kredivo (bottom-left), Atena (top-left), CIBIL (middle), ZestFinance (top-middle)

### **Content:**

**Title:** "Unique Positioning: Four Corners, Only One Player"

**The GeoUMKM Quadrant (Top-Right: Enterprise + Explainable + Geospatial):**
- ✅ Enterprise focus (B2B2C: sell to banks/government, not consumers)
- ✅ Explainable (SHAP: transparent reasoning)
- ✅ Geospatial (596 kecamatan: location intelligence)
- ✅ Indonesia-optimized (local market expertise)
- ✅ 3 customer segments (banks + government + investors)

**Competitor Positioning:**

| Competitor | Position | Strength | Weakness |
|---|---|---|---|
| **Kredivo** | Bottom-left | Speed (5-min approval), brand (5M users) | Black-box, B2C only, no geospatial |
| **Atena** | Top-left | Explainability, B2B | No geospatial, fintech-only |
| **CIBIL** | Middle | B2B scale, incumbent | Not explainable, minimal geospatial, reactive |
| **ZestFinance** | Top-middle | Explainability + funding | No geospatial, minimal Indonesia, USA-centric |
| **GeoUMKM** | **Top-right** | **ALL four: Enterprise + Explainable + Geospatial + Indonesia** | **Only player at this corner** |

### **Key Insight:**
"Nobody else combines these four dimensions. Our competitors are strong in 1-2 areas; we own the intersection."

### **Speaker Notes:**
"The key to understanding our competitive position is this matrix. 

On the left, you have Kredivo—they're incredibly fast (5-minute approval), they have massive scale (5 million users), but they use black-box AI and they're consumer-focused. They don't serve banks. They don't offer enterprise features.

On the top-left, you have Atena. They're explainable (rule-based model), and they serve the enterprise market. But they have zero geospatial intelligence, and they only serve fintech platforms, not banks or government.

In the middle, you have CIBIL—the incumbent credit bureau. They have global scale, they serve enterprises, but they're not explainable and their geospatial is minimal (just state-level).

And then you have ZestFinance, probably the closest global competitor to us. They're explainable (using SHAP like we do), they serve enterprises, but they have no geospatial focus and they have minimal presence in Indonesia.

And then there's us. We're the only player who occupies this top-right quadrant: Enterprise, Explainable, Geospatial, AND Indonesia-optimized. Nobody else is at this intersection. That's our moat."

### **Slide Duration:** 1-2 minutes

---

## SLIDE 6: TRACTION & PROOF OF CONCEPT

### **Visual Design:**
- Three columns: Customers | Product | Data
- Milestone badges (✅ Completed, 🟡 In Progress, 🔵 Coming Soon)
- Screenshots of working product (Chat interface, Dashboard, API response)

### **Content:**

**Title:** "Proof of Concept: Product Built, Traction Started, Data Collected"

**Traction Metrics:**

| Category | Status | Details |
|----------|--------|---------|
| **Bank LOIs** | ✅ 3 signed | Regional banks; awaiting regulatory clarity to convert |
| **Government Interest** | ✅ 2-3 provinces | RFP pipeline; pre-qualified for 2-3 |
| **Investor SDK** | ✅ Beta testing | 2 VC/PE firms piloting; positive feedback |
| **Product v4.0** | ✅ Production-ready | Chat + RAG + Azure OpenAI, Explainability (SHAP) |
| **UMKM Dataset** | ✅ 10K+ records | Verified outcomes, 596 kecamatan features, 34 engineered features |
| **ML Pipeline** | ✅ 8 notebooks | Complete, reproducible, validated |
| **Models** | ✅ 4 trained | Location scoring, PD bucketing, clustering, recommendations |

**Product Screenshots:**
- Bank Dashboard: Credit score card with SHAP explanation
- Government Dashboard: Kecamatan map with cluster insights
- Chat Interface: Natural language query → AI-generated insights
- API Response: JSON with score, explanation, confidence level

### **Speaker Notes:**
"Here's where we are today:

**Product:** v4.0 is production-ready. We have a Chat interface powered by Azure OpenAI, full SHAP explainability on every score, geospatial clustering visualization, and REST APIs for all three customer segments.

**Traction:** We have 3 signed LOIs from regional banks—they're ready to deploy, but they're waiting for OJK regulatory clarity (expected 2026-2027). We have preliminary government interest from 2-3 provinces. And we have 2 VC/PE firms piloting our investor SDK with positive feedback.

**Data:** We've built a dataset of 10,000+ UMKMs with verified outcomes. We've engineered 34 geospatial features across 596 kecamatan. And we've built an 8-notebook ML pipeline that trains 4 core models: location scoring, credit risk, clustering, and recommendations.

This is not vaporware. We have a working product, early customers, and validated data. What we need now is capital to scale: hire sales, integrate real outcome data from our bank customers, and build government/investor products."

### **Slide Duration:** 1-2 minutes

---

## SLIDE 7: BUSINESS MODEL & FINANCIALS

### **Visual Design:**
- **Revenue Stream Breakdown (3-column chart):**
  - Bank: IDR 3.9B/year TAM
  - Government: IDR 6.8B/year TAM
  - Investor: IDR 14B+/year TAM
- **Pricing Table** (Bank, Gov, Investor tiers)
- **Unit Economics Table** (ACV, CAC, LTV, Payback)

### **Content:**

**Title:** "Three Revenue Streams. Diversified. Recurring. High-Margin."

**Revenue Stream 1 — Bank Licensing:**
- Pricing: IDR 50K per score OR IDR 10-50M/month SaaS
- Annual per-bank revenue (ACV): IDR 30M (regional) → IDR 200M+ (national)
- Gross margin: 70% (hosting minimal, support scalable)
- TAM: 130 banks × IDR 30M average = IDR 3.9B/year

**Revenue Stream 2 — Government Contracts:**
- Pricing: IDR 100-500M/province annually
- ACV: IDR 200M
- Gross margin: 65% (higher support, but government budget certainty)
- TAM: 34 provinces × IDR 200M = IDR 6.8B/year

**Revenue Stream 3 — Investor Intelligence:**
- Pricing: IDR 5-50M/month freemium, IDR 50-200M for custom reports
- ACV: IDR 20M
- Gross margin: 75% (minimal support, API-driven)
- TAM: 50+ VC/PE firms + corporate development = IDR 14B+/year

**Unit Economics:**

| Metric | Bank | Government | Investor |
|--------|------|-----------|----------|
| ACV | IDR 30M | IDR 200M | IDR 20M |
| CAC | IDR 10M | IDR 15M | IDR 2M |
| Payback | 4-5 mo | 1 mo | 1 mo |
| LTV (5yr) | IDR 150M | IDR 1B | IDR 100M |
| LTV:CAC | 15:1 | 66:1 | 50:1 |

**Financial Projections (Realistic Scenario):**

| Year | Revenue | Gross Margin | Operating Margin | Customers | Team |
|------|---------|------|---------|-----------|------|
| **Y1 2026** | IDR 5B | 60% | -70% | 12 | 10-12 |
| **Y2 2027** | IDR 15B | 68% | -10% | 35 | 18-22 |
| **Y3 2028** | IDR 35B | 70% | +15% | 70 | 30-40 |
| **Y5 2030** | IDR 80-100B | 75% | +35% | 150+ | 60-80 |

**Breakeven:** Year 2-3  
**Path to Profitability:** Clear; strong operating leverage from SaaS model

### **Speaker Notes:**
"Our business model is beautifully diversified. We're not betting on banks alone or government alone or investors alone. We have three revenue streams, each with strong unit economics:

**Banks** is our primary market. We charge either per-score (IDR 50K) or monthly SaaS (IDR 10-50M depending on bank size). For a mid-sized regional bank, that's IDR 30M/year. Our CAC is about IDR 10M (sales-heavy, because banks take time), so payback is 4-5 months. Over a 5-year contract, that's IDR 150M LTV. So LTV:CAC is 15:1, which is strong.

**Government** actually has the best unit economics. Annual contracts are IDR 100-500M per province. CAC is IDR 15M. Payback is 1 month. Over 3-5 years, that's IDR 1B LTV. LTV:CAC is 66:1.

**Investors** is the highest-margin business, with 75% gross margin. API-based, minimal support. CAC is only IDR 2M, payback is 1 month.

Our financial model shows:
- Year 1: IDR 5B revenue, still cash-burn (product build + sales hiring)
- Year 2: IDR 15B revenue, approaching breakeven (-10% operating margin)
- Year 3: IDR 35B revenue, profitability achieved (+15%)
- Year 5: IDR 80-100B revenue, strong EBITDA margins (+35%)

With a $2-3M seed, we have 24-36 months of runway to reach breakeven. That's the right timeframe."

### **Slide Duration:** 1-2 minutes

---

## SLIDE 8: INVESTOR INTELLIGENCE — UNTAPPED REVENUE STREAM

### **Visual Design:**
- Three columns: Deal Sourcing | Strategic Expansion | Impact Investing
- Real-time Indonesia heatmap showing high-growth kecamatan clusters (color-coded by opportunity)
- Screenshots: VC dashboard, corporate dashboard, impact fund dashboard
- Key metrics badges: "IDR 14B+ TAM", "50+ Customer Base", "75% Gross Margin"

### **Content:**

**Title:** "Investor Intelligence: The $14B Opportunity VC/PE Haven't Discovered Yet"

**The Problem for Investors:**
- 50+ VC/PE firms in Indonesia want to invest in MSME sector
- 600+ kecamatan × 50+ sectors = impossible to screen manually
- Due diligence takes 3 months; competition moves faster
- Current approach: Gut feel + field visits = low accuracy, slow speed

**GeoUMKM's Solution:**
- **Screen 1000s of UMKM locations in minutes** (not weeks)
- **Identify high-growth clusters** before competitors
- **Portfolio intelligence:** Geographic risk assessment, diversification recommendations
- **Impact tracking:** Real-time monitoring of jobs created, sustainability metrics

**Three Investor Use Cases:**

1. **VC Deal Sourcing (Accel Partners)**
   - Problem: Find 10 promising e-commerce UMKMs
   - Old way: 5-8 weeks, IDR 50-100M cost, 40% success rate
   - GeoUMKM way: 1 week, IDR 50M cost, 70-80% success rate
   - **ROI: 40-100x** (1-2 additional successful investments/year)

2. **Corporate Strategic Expansion (Telkom)**
   - Problem: Which of 10M customers are creditworthy?
   - Old way: Manual assessment of 100K customers (12 months)
   - GeoUMKM way: Batch assessment of 10M (2-3 weeks)
   - **ROI: 500-1000x** (IDR 500B-1T new revenue stream)

3. **Impact Fund Portfolio (Sedem Capital)**
   - Problem: Which regions for agritech/clean energy investment?
   - Old way: 8-12 months research, IDR 200-500K cost
   - GeoUMKM way: 2-3 weeks analysis, IDR 2.8B cost
   - **ROI: 20-25% financial return + exceptional impact (50K jobs/year)**

**Investor Product Tiers:**

| Segment | Use Case | Pricing | Annual Value per Customer |
|---------|----------|---------|--------------------------|
| **VC/PE Firms** | Deal sourcing API | IDR 5-50M/month | IDR 120-600M |
| **Corporate VCs** | Strategic expansion | IDR 500M - 2B (custom) | IDR 500M - 2B |
| **Impact Funds** | Portfolio construction | IDR 100-500M (custom) | IDR 200M - 500M |

**Market Opportunity:**
- 50+ VC/PE firms in Indonesia (market leader = Ganesha, Sequoia Southeast Asia)
- 20+ corporate development teams (Telko, Grab, Tokopedia, Traveloka all expanding to MSME)
- 15+ impact funds (mandated SDG investing by LPs)
- **Total TAM: IDR 14-20B/year**
- **Gross margin: 75%** (API-driven, minimal support)

**Competitive Advantage:**
- ✅ Only platform with geospatial intelligence for UMKM
- ✅ Explainability (SHAP) builds investor confidence in results
- ✅ Cluster analysis reveals hidden high-growth opportunities
- ✅ Can integrate with existing VC/PE portfolio tools

**Traction:**
- 2 VC/PE firms piloting (positive feedback on market applications)
- Expected Year 1 revenue: IDR 1-2B (5-10 investors)
- Expected Year 5 revenue: IDR 10-30B (50+ investor subscribers)

### **Speaker Notes:**

"I want to highlight a third market we've validated but haven't heavily marketed: investor intelligence.

The problem is simple: If you're a VC looking to invest in MSME sector, you have 600+ kecamatan and 50+ sectors to evaluate. You can't possibly visit them all. So either you (a) invest based on gut feel, or (b) hire a consultant for 3-6 months at IDR 100M+ to do due diligence.

With GeoUMKM, we can answer their questions in minutes. 'Which 20 kecamatan have the highest agritech potential?' Instant. 'Which e-commerce clusters are growing fastest?' Instant. 'Show me geographic concentration risk in my portfolio.' Real-time.

We've already validated this with 2 VC/PE firms piloting. And the TAM is enormous—there are 50+ VC firms, 20+ corporate development teams, and 15+ impact funds in Indonesia who all need this.

The beauty is: Banks are our cash cow (high ACV, long contracts). Government is our growth story (high volume). But **investors are our margin story—75% gross margin, 50:1 LTV:CAC, API-driven.**

In Year 1, we might get 5-10 investor customers (IDR 1-2B revenue). By Year 5, we could have 50+ (IDR 10-30B revenue). And each investor customer *also* needs our bank product to validate loan decisions. So it's a natural expansion for our existing customer base."

### **Slide Duration:** 2 minutes

---

## SLIDE 9: GO-TO-MARKET STRATEGY

### **Visual Design:**
- Timeline chart: Months 1-12 with milestones
- Three phases: Pilot (1-6), Scaling (7-12), Expansion (13+)
- Key metrics at each phase (customers, revenue, team)

### **Content:**

**Title:** "Go-to-Market: 12-Month Plan to Revenue"

**Phase 1: Pilot & Validation (Months 1-6)**
- Recruit 3-5 regional banks for pilot (30-day PoC + 3-6 month data)
- Offer pilot pricing (30-50% discount for data + testimonials)
- Launch 1-2 government pilots
- Release investor SDK beta
- Success metric: 3-5 pilot contracts, real outcome data collected

**Phase 2: Scaling (Months 7-12)**
- Convert pilots to commercial contracts (3-5 banks at full ACV)
- Launch government product nationally (5-10 provinces)
- Investor API to public beta
- Hire banking sales lead
- Success metric: 10-15 customers, IDR 3-5B revenue

**Phase 3: Expansion (Months 13+)**
- Target national + mega-banks
- ASEAN expansion (Malaysia, Philippines, Singapore)
- Launch "GeoUMKM Copilot" (chat standalone)
- Series A fundraising
- Success metric: 30-50 customers, path to profitability

**Key Hires:**
1. Banking Sales Lead (Month 1-2) — 5+ years enterprise credit experience
2. Government Relations Officer (Month 3-4) — 5+ years gov/dev experience
3. Backend Engineer (Month 1) — Azure cloud + API scaling
4. Data Scientist (Month 2) — Model monitoring + retraining

### **Speaker Notes:**
"Here's our 12-month roadmap to revenue:

**Phase 1 (Months 1-6) is validation.** We're recruiting 3-5 regional banks for pilots. They get 30% discount in exchange for (a) letting us use their data to validate our models against real defaults, and (b) giving us testimonials. We'll also launch government pilots and release the investor SDK beta.

**Phase 2 (Months 7-12) is scaling.** We convert those pilots to commercial contracts. We launch government product nationally. We hire our banking sales lead—this is critical; banks are slow to buy, and we need someone with deep enterprise credit software experience.

**Phase 3 (Months 13+) is expansion.** We target national banks, we expand to ASEAN, we launch a standalone Chat product.

The key is that we're being systematic: validate → scale → expand. And we're doing this with focused hires: sales (to close deals), gov relations (to land government contracts), engineering (to build and scale), and data science (to monitor models and keep them accurate)."

### **Slide Duration:** 1-2 minutes

---

## SLIDE 10: USE OF FUNDS & TEAM

### **Visual Design:**
- Left: Pie chart of $2-3M allocation (Product 40%, Sales 30%, Data 15%, Ops 15%)
- Right: Team org chart (Founders → 4 key hires → support team)
- Badges: Advisor logos (OJK, BI, if applicable)

### **Content:**

**Title:** "$2-3M Seed. Four Strategic Hires. 24-Month Runway."

**Use of Funds Breakdown:**

| Category | % | Amount | Details |
|----------|---|--------|---------|
| **Product** | 40% | $800K-1.2M | Compliance automation, real data integration, v4.1 (Container Apps, multi-region) |
| **Sales** | 30% | $600K-900K | Banking sales lead, pilot contracts (subsidized), gov relations |
| **Data** | 15% | $300K-450K | UMKM outcome data, satellite imagery partnerships, feature refresh |
| **Operations** | 15% | $300K-450K | Finance/legal/HR, compliance officer, advisory board (OJK/BI) |

**Team Structure:**

```
Founder(s): Data Science + Banking Domain + Regulatory Expertise
│
├─ VP Sales (Hire Month 1-2)
│  └─ Banking Sales Lead: Close 3-5 bank contracts, navigate RFPs
│
├─ Product Lead (Hire Month 3-4)
│  └─ Government Relations: Provincial government outreach, RFP strategy
│
├─ VP Engineering (Hire Month 1)
│  └─ Backend Engineer: Azure, API scaling, v4.1 migration
│
├─ VP Data (Hire Month 2)
│  └─ Data Scientist: Model monitoring, monthly retraining, feature freshness
│
└─ Operations (Co-founder or hire)
   └─ Finance, legal, HR, compliance
```

**Advisory Board (Optional, builds credibility):**
- OJK advisor (regulatory relationship)
- BI innovation lab contact (government relationship)
- Bank CISO (security/compliance)
- VC/PE advisor (investor intelligence validation)

### **Speaker Notes:**
"With the $2-3M seed, we're investing strategically:

**40% in product** — This builds the v4.0 regulatory compliance features, integrates real UMKM outcome data from our bank customers, and starts the v4.1 roadmap (Container Apps, multi-region disaster recovery).

**30% in sales** — This is critical. We need a banking sales lead with 5+ years of enterprise credit software experience. Banks are slow to buy, but they're sticky once you have them. We're also subsidizing pilots (30-50% discount) to accelerate conversion from LOI to contract.

**15% in data** — We integrate real outcome data from our pilot banks, we subscribe to satellite imagery for real-time geospatial updates, and we build an automated pipeline to refresh features monthly.

**15% in operations** — Finance, legal, HR, compliance. We hire a compliance officer to manage OJK/BI relationships. We build the infrastructure to be audit-ready.

This gives us 24-36 months of runway to reach breakeven, which is exactly what we need.

On the team side, we're adding four key hires: A banking sales lead (critical for closing deals), a government relations officer (provincial government sales), a backend engineer (Azure scaling), and a data scientist (model maintenance). The founders remain CEO + CTO, focused on product vision and strategy."

### **Slide Duration:** 1-2 minutes

---

## SLIDE 11: THE ASK & EXIT

### **Visual Design:**
- Left: "The Ask" box (large $2-3M number, terms)
- Middle: Timeline to exit (Year 3-5, exit timeline chart)
- Right: Return scenarios (Conservative/Realistic/Aggressive with IRR)

### **Content:**

**Title:** "The Ask: $2-3M Seed. The Return: 8-12x in 4-5 Years."

**Investment Terms:**
- **Raising:** $2-3M USD (or IDR 30-45B)
- **Terms:** Standard SAFE or Series Seed terms
- **Use of funds:** Product (40%), Sales (30%), Data (15%), Ops (15%)
- **Runway:** 24-36 months to breakeven

**Exit Strategy & Timelines:**

| Exit Target | Timing | Rationale | Valuation |
|---|---|---|---|
| **Acquisition by Regional Bank** | Year 3-4 | CIMB, Maybank, BCA seeking tech moat | $15-25M |
| **Acquisition by International Fintech** | Year 4-5 | Stripe, Square, PayPal entering ASEAN | $20-35M |
| **IPO** | Year 5-7 | If Indonesian fintech IPO market matures | Multi-billion IDR |

**Return Scenarios (on $2.5M seed):**

| Scenario | Exit Year | Revenue | Exit Valuation | Multiple | Return |
|----------|-----------|---------|---|----------|--------|
| **Conservative** | 5 | IDR 30B | $12M | 4x revenue | 4.8x |
| **Realistic** | 4 | IDR 50B | $20M | 4x revenue | 8x |
| **Aggressive** | 3 | IDR 80B | $32M | 4x revenue | 12.8x |

**Key Success Factors for Exit:**
1. ✅ Regulatory approval (OJK framework clarity)
2. ✅ Commercial traction (15-20+ customers by Year 2)
3. ✅ Path to profitability (breakeven by Year 2-3)
4. ✅ Acquisition interest (regional bank or international fintech)

### **Speaker Notes:**
"We're raising $2-3M seed. This funds 24-36 months to breakeven. Here's the exit math:

On the conservative side—we exit in Year 5 at 4x revenue. At that point, we'd have IDR 30B in revenue. 4x multiple = $12M valuation. On a $2.5M seed, that's 4.8x return.

Realistic scenario—we exit in Year 4 at $20M valuation (4x on IDR 50B revenue). That's 8x return.

Aggressive scenario—we exit in Year 3 at $32M valuation. That's 12.8x return.

Where are exits coming from? Most likely, acquisition by a regional bank—CIMB, Maybank, BCA—seeking our technology moat (geospatial IP) and regulatory relationships. Or, acquisition by an international fintech—Stripe, Square, PayPal—entering ASEAN and needing local market intelligence.

The path to exit is clear: 
- Build product (Year 1) ✅ Done
- Achieve commercial traction (Year 1-2) ← We are here
- Reach profitability (Year 2-3)
- 15-20+ customers by Year 2 (triggers inbound acquisition interest)
- Exit (Year 3-5)

We're not a moonshot. We're a capital-efficient B2B SaaS play with clear unit economics, strong gross margins (70%+), and a clear exit path. That's what makes this compelling for investors."

### **Slide Duration:** 1-2 minutes

---

## SLIDE 12 (OPTIONAL): KEY RISKS & MITIGATIONS

### **Visual Design (If Included):**
- Risk matrix: Likelihood vs. Impact
- Red = high risk, Yellow = medium, Green = low

### **Content:**

**Title:** "Risks & Mitigations"

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Regulatory approval delayed | Medium | High | Early BI engagement, compliance-by-design |
| ZestFinance enters Indonesia | Medium | High | Reach profitability before entry; acquisition exit |
| Model drift (accuracy decays) | Medium | Medium | Automated monitoring, monthly retraining |
| Bank sales cycles long | High | Medium | Regional banks first, pilot pricing |
| Privacy regulation (OJK) | Medium | Medium | Federated architecture, data residency |

### **Speaker Notes (If Q&A Likely):**
"We've thought carefully about risks:

**Regulatory approval could delay, but it's not a blocker.** We're engaging with BI early, we've built compliance-by-design, and we're GDPR-ready. Regulators want explainability—we have it.

**ZestFinance could enter Indonesia, but we move first.** We have 18-month head start on geospatial + explainability. Even if they enter in 2027, we'll have $15B+ revenue by then. Exit becomes likely.

**Model accuracy could decay over time, but we have solutions.** Automated monitoring alerts us to drift. We retrain monthly. Data science is core to our team, not an afterthought.

**Bank sales are slow, but we've built for it.** Regional banks first (faster decisions). Pilot pricing accelerates conversion. CAC payback is 4-5 months, which is acceptable.

**Privacy regulation could tighten, but we're architected for it.** Federated architecture means banks store data, not us. Data residency in Indonesia only. Privacy-by-design from the start."

### **Slide Duration (If Included):** 1 minute

---

## CLOSING STATEMENT (End of Presentation)

**Recommended Script:**

"Let me wrap up. 

Indonesia has a $5 billion credit gap. Banks can't assess risk fast enough. Government can't target programs effectively. Investors can't find high-growth clusters. Today, these three stakeholders have broken solutions. 

We're GeoUMKM Smart. We're solving all three problems with one platform: explainable AI, geospatial intelligence, and cloud-native architecture. 

We have a working product. We have LOIs from early customers. We have a clear path to profitability. 

What we need now is capital to scale: hire our sales team, integrate real outcome data, and reach the 15-20 customers we need by Year 2 to trigger acquisition interest.

This is a once-in-a-generation opportunity in Indonesian fintech. We're the first-movers in explainable geospatial MSME credit scoring. Our moat is defensible. Our unit economics are strong. Our exit path is clear.

I'm excited to partner with investors who see the Indonesia opportunity and want to build the future of MSME credit.

Thank you."

**Duration:** 1-2 minutes

---

## PRESENTATION TIPS

### **Visual Design Standards**
- **Color scheme:** Indonesian flag colors (red/white) + blue (tech/trust)
- **Font:** Clean sans-serif (Helvetica, San Francisco, or Inter)
- **Charts:** Minimize data density; 1-2 key messages per slide
- **Icons:** Use universally understood symbols (bank = building, government = capitol, investor = upward arrow)

### **Delivery Notes**
- **Pace:** 10-15 minutes presentation + 5-10 minutes Q&A = 15-25 minutes total
- **Tone:** Confident but not arrogant; data-driven; mission-driven (solving real problem)
- **Eye contact:** Look at investors, not slides
- **Pause for questions:** After Slides 4-5, pause for clarifications

### **Customization Suggestions**
- If presenting to banks: Emphasize regulatory moat + speed improvements
- If presenting to government: Emphasize policy simulation + impact measurement
- If presenting to VCs: Emphasize TAM + exit path + competitive moat
- If presenting to corporates: Emphasize partnership opportunities + API integration

---

**End of Pitch Deck Outline**

*This is a production-ready slide outline. Convert to PowerPoint, Google Slides, or Keynote with recommended visuals and animations.*
