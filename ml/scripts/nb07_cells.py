"""Cells for Notebook 07: LLM & RIG Preparation (Knowledge Base Construction)."""
import nbformat as nbf


def build_cells():
    cells = []
    cells += _title_cells()
    cells += _section1_cells()
    cells += _section2_cells()
    cells += _section3_cells()
    cells += _section4_cells()
    cells += _section5_cells()
    cells += _section6_cells()
    cells += _section7_cells()
    cells += _section8_cells()
    cells += _section9_cells()
    return cells


def _title_cells():
    return [nbf.v4.new_markdown_cell(TITLE_MD)]


def _section1_cells():
    return [
        nbf.v4.new_markdown_cell(S1_MD),
        nbf.v4.new_code_cell(S1_CODE),
    ]


def _section2_cells():
    return [
        nbf.v4.new_markdown_cell(S2_MD),
        nbf.v4.new_code_cell(S2_CODE),
    ]


def _section3_cells():
    return [
        nbf.v4.new_markdown_cell(S3_MD),
        nbf.v4.new_code_cell(S3_CODE),
    ]


def _section4_cells():
    return [
        nbf.v4.new_markdown_cell(S4_MD),
        nbf.v4.new_code_cell(S4_CODE),
    ]


def _section5_cells():
    return [
        nbf.v4.new_markdown_cell(S5_MD),
        nbf.v4.new_code_cell(S5_CODE),
    ]


def _section6_cells():
    return [
        nbf.v4.new_markdown_cell(S6_MD),
        nbf.v4.new_code_cell(S6_CODE),
    ]


def _section7_cells():
    return [
        nbf.v4.new_markdown_cell(S7_MD),
        nbf.v4.new_code_cell(S7_CODE),
    ]


def _section8_cells():
    return [
        nbf.v4.new_markdown_cell(S8_MD),
        nbf.v4.new_code_cell(S8_CODE),
    ]


def _section9_cells():
    return [
        nbf.v4.new_markdown_cell(S9_MD),
        nbf.v4.new_code_cell(S9_CODE),
    ]


# ---------------------------------------------------------------------------
# Cell content strings
# ---------------------------------------------------------------------------

TITLE_MD = """# Notebook 07: LLM & RIG Preparation (Knowledge Base Construction)

## Retrieval-Augmented Generation (RAG/RIG) Architecture

This notebook constructs a structured **knowledge base** from all model outputs generated in
Notebooks 01-06, designs retrieval schemas for different stakeholder personas, and provides
integration stubs for Azure OpenAI services.

### What is RIG (Retrieval-Integrated Generation)?

RIG extends the standard RAG paradigm by tightly coupling the retrieval layer with the
generative model. Instead of treating retrieval as a separate preprocessing step, RIG
integrates retrieval decisions into the generation loop, allowing the model to:

1. **Decide when to retrieve** - not every query needs external context
2. **Choose what to retrieve** - persona-aware retrieval strategies
3. **Validate retrieved context** - cross-reference multiple documents

### Architecture Overview

```
User Query --> Persona Detection --> Schema Selection --> Document Retrieval
                                                              |
                                                              v
                                    Response <-- LLM Generation <-- Context Assembly
```

### Knowledge Base Structure

| Document Type | Count | Purpose |
|---|---|---|
| Location Profiles | ~553+ | Per-kecamatan structured data |
| Cluster Summaries | 5 | Segment narratives with SWOT |
| Model Insights | 1 | Feature importance & key findings |
| Retrieval Schemas | 3 | Persona-specific query routing |

### Production Deployment Considerations

- **Embedding Model**: Azure OpenAI `text-embedding-ada-002` (1536 dimensions)
- **Vector Store**: Azure AI Search with semantic ranking
- **LLM**: Azure OpenAI GPT-4 for response generation
- **Caching**: Redis for frequent queries (credit checks, common locations)
- **Monitoring**: Application Insights for latency and relevance tracking
"""

S1_MD = """## 1. Load All Results

Load all CSV outputs from previous notebooks (Notebooks 01-06) that will form the basis
of our knowledge base documents.
"""

S1_CODE = '''import pandas as pd
import numpy as np
import json
import os
import warnings
warnings.filterwarnings('ignore')

# Load all data from previous notebooks
umkm = pd.read_csv('../data/umkm_clustered.csv')
cluster_profiles = pd.read_csv('../data/cluster_profiles.csv')
gov_priority = pd.read_csv('../data/government_priority_clusters.csv')
invest_opp = pd.read_csv('../data/investment_opportunity_clusters.csv')
recommendations = pd.read_csv('../data/recommendations_by_kecamatan.csv')
credit_bands = pd.read_csv('../data/credit_score_bands.csv')
policy_impact = pd.read_csv('../data/policy_impact_estimates.csv')
kecamatan_ref = pd.read_csv('../data/kecamatan_reference.csv')

# Create knowledge base output directory
os.makedirs('../data/knowledge_base', exist_ok=True)

print("=== Data Loaded Successfully ===")
print(f"UMKM records: {len(umkm):,}")
print(f"Unique kecamatan in UMKM data: {umkm['kecamatan'].nunique()}")
print(f"Kecamatan reference: {len(kecamatan_ref)}")
print(f"Cluster profiles: {len(cluster_profiles)}")
print(f"Government priority clusters: {len(gov_priority)}")
print(f"Investment opportunity clusters: {len(invest_opp)}")
print(f"Recommendations by kecamatan: {len(recommendations)}")
print(f"Credit score bands: {len(credit_bands)}")
print(f"Policy impact estimates: {len(policy_impact)}")
'''

S2_MD = """## 2. Location Profile Documents

For each kecamatan, we generate a structured JSON document containing all relevant
information for retrieval. These documents serve as the primary knowledge units for
location-specific queries.

Each document includes:
- Geographic identifiers (name, kabupaten, coordinates)
- Demographics (population, density, income)
- Infrastructure scores and risk levels
- UMKM statistics (count, average potential score)
- Cluster membership and recommended business types
"""

S2_CODE = '''# Aggregate UMKM data at kecamatan level
kec_agg = umkm.groupby(['kabupaten_kota', 'kecamatan']).agg(
    latitude=('latitude', 'mean'),
    longitude=('longitude', 'mean'),
    is_kota=('is_kota', 'first'),
    populasi=('populasi', 'first'),
    kepadatan_penduduk=('kepadatan_penduduk', 'first'),
    income_per_kapita=('income_per_kapita', 'first'),
    skor_infrastruktur=('skor_infrastruktur', 'first'),
    akses_internet_pct=('akses_internet_pct', 'first'),
    risiko_banjir=('risiko_banjir', 'mean'),
    risiko_gempa=('risiko_gempa', 'mean'),
    n_umkm=('jenis_usaha', 'count'),
    avg_skor_potensi=('skor_potensi', 'mean'),
    avg_omset=('omset_bulanan', 'mean'),
    survival_rate=('is_survived_3yr', 'mean'),
    cluster_kmeans=('cluster_kmeans', lambda x: x.mode().iloc[0] if len(x) > 0 else 0),
    cluster_name=('cluster_name', lambda x: x.mode().iloc[0] if len(x) > 0 else 'Unknown'),
    jenis_usaha_list=('jenis_usaha', lambda x: list(x.value_counts().head(3).index)),
    penetrasi_kur_pct=('penetrasi_kur_pct', 'first'),
    jarak_ke_bank_terdekat=('jarak_ke_bank_terdekat', 'first'),
    risk_composite=('risk_composite', 'mean'),
    financial_access_score=('financial_access_score', 'mean'),
).reset_index()

# Build location profile documents
location_profiles = []
for _, row in kec_agg.iterrows():
    profile = {
        "id": f"loc_{row['kecamatan'].lower().replace(' ', '_')}_{row['kabupaten_kota'].lower().replace(' ', '_').replace('.', '')}",
        "type": "location_profile",
        "name": row['kecamatan'],
        "kabupaten": row['kabupaten_kota'],
        "coordinates": {
            "latitude": round(float(row['latitude']), 6),
            "longitude": round(float(row['longitude']), 6)
        },
        "is_urban": bool(row['is_kota']),
        "demographics": {
            "populasi": int(row['populasi']) if pd.notna(row['populasi']) else 0,
            "kepadatan_penduduk": round(float(row['kepadatan_penduduk']), 1) if pd.notna(row['kepadatan_penduduk']) else 0,
            "income_per_kapita": round(float(row['income_per_kapita']), 2) if pd.notna(row['income_per_kapita']) else 0
        },
        "infrastructure": {
            "skor_infrastruktur": round(float(row['skor_infrastruktur']), 1) if pd.notna(row['skor_infrastruktur']) else 0,
            "akses_internet_pct": round(float(row['akses_internet_pct']), 1) if pd.notna(row['akses_internet_pct']) else 0,
            "penetrasi_kur_pct": round(float(row['penetrasi_kur_pct']), 1) if pd.notna(row['penetrasi_kur_pct']) else 0,
            "jarak_ke_bank_terdekat": round(float(row['jarak_ke_bank_terdekat']), 2) if pd.notna(row['jarak_ke_bank_terdekat']) else 0
        },
        "risk_levels": {
            "risiko_banjir": round(float(row['risiko_banjir']), 3),
            "risiko_gempa": round(float(row['risiko_gempa']), 3),
            "risk_composite": round(float(row['risk_composite']), 3)
        },
        "umkm_statistics": {
            "n_umkm": int(row['n_umkm']),
            "avg_skor_potensi": round(float(row['avg_skor_potensi']), 2),
            "avg_omset_juta": round(float(row['avg_omset']), 2),
            "survival_rate": round(float(row['survival_rate']), 3),
            "financial_access_score": round(float(row['financial_access_score']), 3)
        },
        "cluster": {
            "cluster_id": int(row['cluster_kmeans']),
            "cluster_name": row['cluster_name']
        },
        "recommended_business_types": row['jenis_usaha_list']
    }
    location_profiles.append(profile)

# Save location profiles
with open('../data/knowledge_base/location_profiles.json', 'w', encoding='utf-8') as f:
    json.dump(location_profiles, f, indent=2, ensure_ascii=False)

print(f"Generated {len(location_profiles)} location profile documents")
print(f"Sample document keys: {list(location_profiles[0].keys())}")
print(f"\\nSample profile (first entry):")
print(json.dumps(location_profiles[0], indent=2, ensure_ascii=False))
'''

S3_MD = """## 3. Cluster Summary Documents

For each cluster, we generate narrative summaries including SWOT analysis
(Strengths, Weaknesses, Opportunities, Threats). These documents provide
high-level strategic context for the LLM when answering cluster-related queries.
"""

S3_CODE = '''# Define cluster narratives based on profile data
cluster_descriptions = {
    "Urban Digital Leaders": "Mature urban businesses with strong digital presence, high infrastructure scores, and above-average revenue.",
    "Rural Developing": "Emerging businesses in rural areas with growing infrastructure and moderate digital adoption.",
    "Suburban Growth": "Businesses in peri-urban areas benefiting from urban spillover with balanced growth metrics.",
    "High-Risk Underserved": "Businesses in underserved areas with low infrastructure, high natural disaster risk, and limited financial access.",
    "Moderate Established": "Established businesses with moderate performance across all metrics, stable but limited growth."
}

cluster_summaries = []
for _, row in cluster_profiles.iterrows():
    cname = row['cluster_name']
    cluster_id = int(row['cluster_id'])

    # Determine SWOT based on cluster characteristics
    infra = float(row['skor_infrastruktur'])
    income = float(row['income_per_kapita'])
    digital = float(row['has_digital_presence'])
    survival = float(row['is_survived_3yr'])
    risk_banjir = float(row['risiko_banjir'])
    risk_gempa = float(row['risiko_gempa'])
    omset = float(row['omset_bulanan'])
    kur = float(row['penetrasi_kur_pct'])

    strengths = []
    weaknesses = []
    opportunities = []
    threats = []

    if infra > 70: strengths.append("Strong infrastructure base")
    if infra < 50: weaknesses.append("Poor infrastructure availability")
    if income > 10: strengths.append("High income per capita in area")
    if income < 7: weaknesses.append("Low area income levels")
    if digital > 0.6: strengths.append("High digital adoption")
    if digital < 0.3: weaknesses.append("Low digital presence")
    if survival > 0.7: strengths.append("High business survival rate")
    if survival < 0.5: weaknesses.append("Low business survival rate")
    if omset > 50: strengths.append("Strong revenue generation")
    if omset < 30: weaknesses.append("Below-average revenue")

    if kur < 25: opportunities.append("Room for KUR expansion")
    if digital < 0.5: opportunities.append("Digital transformation potential")
    if infra < 60: opportunities.append("Infrastructure development investment")
    opportunities.append("Government intervention programs")
    opportunities.append("New market entry for underserved sectors")

    if risk_banjir > 0.3: threats.append("High flood risk")
    if risk_gempa > 0.3: threats.append("Seismic activity risk")
    threats.append("Market competition from neighboring areas")
    if survival < 0.6: threats.append("Business sustainability concerns")

    # Check priority and investment rankings
    gov_row = gov_priority[gov_priority['cluster'] == cluster_id]
    inv_row = invest_opp[invest_opp['cluster'] == cluster_id]

    priority_rank = int(gov_row['priority_rank'].iloc[0]) if len(gov_row) > 0 else None
    investment_rank = int(inv_row['investment_rank'].iloc[0]) if len(inv_row) > 0 else None

    summary = {
        "id": f"cluster_{cluster_id}",
        "type": "cluster_summary",
        "cluster_id": cluster_id,
        "cluster_name": cname,
        "description": cluster_descriptions.get(cname, "A distinct business segment identified through clustering analysis."),
        "n_umkm": int(row['n_umkm']),
        "key_characteristics": {
            "avg_infrastructure_score": round(infra, 1),
            "avg_income_per_kapita": round(income, 2),
            "avg_omset_bulanan_juta": round(omset, 2),
            "digital_adoption_rate": round(digital, 3),
            "survival_rate_3yr": round(survival, 3),
            "kur_penetration_pct": round(kur, 1)
        },
        "swot": {
            "strengths": strengths if strengths else ["Stable market position"],
            "weaknesses": weaknesses if weaknesses else ["No major weaknesses identified"],
            "opportunities": opportunities,
            "threats": threats
        },
        "government_priority_rank": priority_rank,
        "investment_rank": investment_rank,
        "recommended_actions": []
    }

    # Add recommended actions based on characteristics
    if infra < 60:
        summary["recommended_actions"].append("Prioritize infrastructure development")
    if digital < 0.5:
        summary["recommended_actions"].append("Implement digital literacy programs")
    if kur < 20:
        summary["recommended_actions"].append("Expand KUR access and financial inclusion")
    if survival < 0.6:
        summary["recommended_actions"].append("Business mentorship and capacity building")
    if omset > 50:
        summary["recommended_actions"].append("Scale-up support and market expansion")
    if not summary["recommended_actions"]:
        summary["recommended_actions"].append("Maintain current support programs")

    cluster_summaries.append(summary)

# Save cluster summaries
with open('../data/knowledge_base/cluster_summaries.json', 'w', encoding='utf-8') as f:
    json.dump(cluster_summaries, f, indent=2, ensure_ascii=False)

print(f"Generated {len(cluster_summaries)} cluster summary documents")
for cs in cluster_summaries:
    print(f"  Cluster {cs['cluster_id']}: {cs['cluster_name']} ({cs['n_umkm']} UMKMs)")
    print(f"    Strengths: {cs['swot']['strengths']}")
    print(f"    Priority Rank: {cs['government_priority_rank']}, Investment Rank: {cs['investment_rank']}")
'''

S4_MD = """## 4. Model Insight Documents

Documents summarizing key model findings: top features for location scoring,
top features for credit risk, and policy simulation results. These provide
the LLM with analytical context when explaining model-driven recommendations.
"""

S4_CODE = '''import joblib

# Load models to extract feature importance
location_model = joblib.load('../models/location_scoring_model.joblib')
credit_model = joblib.load('../models/credit_risk_model.joblib')

# Extract feature importances
def get_feature_importance(model, top_n=10):
    """Extract top feature importances from a model."""
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
        if hasattr(model, 'feature_names_in_'):
            features = model.feature_names_in_
        else:
            features = [f"feature_{i}" for i in range(len(importances))]
        feat_imp = sorted(zip(features, importances), key=lambda x: x[1], reverse=True)
        return [{"feature": f, "importance": round(float(imp), 4)} for f, imp in feat_imp[:top_n]]
    return []

location_features = get_feature_importance(location_model)
credit_features = get_feature_importance(credit_model)

# Policy impact findings
policy_findings = []
for _, row in policy_impact.iterrows():
    policy_findings.append({
        "policy": row['policy'],
        "target_group": row['target_group'],
        "avg_score_improvement": round(float(row['avg_score_improvement']), 2),
        "pct_improved": round(float(row['pct_improved']), 1),
        "new_above_70": int(row['new_above_70']),
        "additional_survivors": int(row['additional_survivors'])
    })

# Credit score band insights
credit_band_insights = []
for _, row in credit_bands.iterrows():
    credit_band_insights.append({
        "rating": row['Rating'],
        "score_range": row['Score Range'],
        "count": row['Count'],
        "pct_of_portfolio": row['Pct of Portfolio'],
        "actual_default_rate": row['Actual Default Rate'],
        "mean_predicted_pd": row['Mean Predicted PD']
    })

# Build model insights document
model_insights = {
    "id": "model_insights",
    "type": "model_insight",
    "location_scoring_model": {
        "description": "Predicts location potential score (skor_potensi) for UMKM locations",
        "model_type": type(location_model).__name__,
        "top_features": location_features,
        "key_findings": [
            "Infrastructure score is the strongest predictor of location potential",
            "Internet access and income per capita are critical secondary factors",
            "Risk composite negatively impacts location scores",
            "Urban areas generally score higher due to better infrastructure"
        ]
    },
    "credit_risk_model": {
        "description": "Predicts 3-year survival probability for UMKM businesses",
        "model_type": type(credit_model).__name__,
        "top_features": credit_features,
        "credit_score_bands": credit_band_insights,
        "key_findings": [
            "Business maturity is the top predictor of survival",
            "Digital presence significantly improves survival probability",
            "Financial access score correlates with lower default risk",
            "Competition density has non-linear effect on survival"
        ]
    },
    "policy_simulation_results": {
        "description": "What-if simulation results for policy interventions",
        "policies_tested": policy_findings,
        "key_findings": [
            "KUR expansion shows immediate measurable impact on potential scores",
            "Infrastructure investment has the highest long-term ROI",
            "Combined interventions show synergistic effects"
        ]
    }
}

# Save model insights
with open('../data/knowledge_base/model_insights.json', 'w', encoding='utf-8') as f:
    json.dump(model_insights, f, indent=2, ensure_ascii=False)

print("Model Insights Document Generated")
print(f"\\nLocation Scoring - Top 5 Features:")
for feat in location_features[:5]:
    print(f"  {feat['feature']}: {feat['importance']}")
print(f"\\nCredit Risk - Top 5 Features:")
for feat in credit_features[:5]:
    print(f"  {feat['feature']}: {feat['importance']}")
print(f"\\nPolicy Simulations: {len(policy_findings)} policies tested")
'''

S5_MD = """## 5. Persona-Specific Retrieval Schema

Define retrieval schemas for each stakeholder persona. These schemas determine
which documents and fields are retrieved based on the query type and user role.

### Personas:
1. **Bank** - Credit assessment, KUR eligibility, risk evaluation
2. **Government** - Policy planning, priority areas, budget allocation
3. **Investor** - Market opportunities, growth potential, ROI analysis
"""

S5_CODE = '''# Define persona-specific retrieval schemas
retrieval_schemas = {
    "personas": {
        "bank": {
            "name": "Bank / Financial Institution",
            "description": "Credit officers evaluating UMKM loan applications and KUR eligibility",
            "primary_queries": [
                "Credit worthiness assessment for specific kecamatan",
                "KUR eligibility evaluation",
                "Portfolio risk analysis by area",
                "Default probability estimation"
            ],
            "retrieval_strategy": {
                "primary_documents": ["location_profiles", "model_insights"],
                "secondary_documents": ["cluster_summaries"],
                "key_fields": [
                    "umkm_statistics.survival_rate",
                    "umkm_statistics.financial_access_score",
                    "risk_levels.risk_composite",
                    "infrastructure.penetrasi_kur_pct",
                    "infrastructure.jarak_ke_bank_terdekat"
                ],
                "scoring_criteria": {
                    "credit_score_band": "Map survival_rate to AAA-D rating scale",
                    "probability_of_default": "1 - survival_rate as PD estimate",
                    "survival_probability": "3-year survival based on cluster characteristics",
                    "risk_factors": ["risk_composite", "risiko_banjir", "risiko_gempa", "competition_density"]
                }
            },
            "response_template": {
                "format": "structured_assessment",
                "sections": ["credit_summary", "risk_factors", "recommendation", "supporting_data"]
            }
        },
        "government": {
            "name": "Government / Policy Maker",
            "description": "Officials planning interventions, budget allocation, and infrastructure development",
            "primary_queries": [
                "Priority areas for intervention",
                "Infrastructure development needs",
                "Budget allocation recommendations",
                "Policy impact projections"
            ],
            "retrieval_strategy": {
                "primary_documents": ["cluster_summaries", "model_insights"],
                "secondary_documents": ["location_profiles"],
                "key_fields": [
                    "government_priority_rank",
                    "swot.weaknesses",
                    "recommended_actions",
                    "key_characteristics.avg_infrastructure_score",
                    "policy_simulation_results"
                ],
                "scoring_criteria": {
                    "priority_clusters": "Ranked by priority_score (low infra + low income + high risk)",
                    "intervention_recommendations": "Based on SWOT weaknesses and recommended_actions",
                    "budget_allocation": "Proportional to priority_score and n_umkm affected",
                    "impact_projection": "From policy simulation what-if results"
                }
            },
            "response_template": {
                "format": "policy_brief",
                "sections": ["situation_analysis", "priority_areas", "recommendations", "budget_estimate", "expected_impact"]
            }
        },
        "investor": {
            "name": "Investor / Private Sector",
            "description": "Investors seeking UMKM market opportunities, growth sectors, and partnership potential",
            "primary_queries": [
                "Best investment locations by sector",
                "Market gaps and opportunities",
                "Growth potential analysis",
                "Risk-adjusted return estimation"
            ],
            "retrieval_strategy": {
                "primary_documents": ["cluster_summaries", "location_profiles"],
                "secondary_documents": ["model_insights"],
                "key_fields": [
                    "investment_rank",
                    "umkm_statistics.avg_omset_juta",
                    "umkm_statistics.avg_skor_potensi",
                    "recommended_business_types",
                    "cluster.cluster_name"
                ],
                "scoring_criteria": {
                    "investment_opportunities": "Ranked by investment_score (growth + low competition + infra + survival + revenue)",
                    "market_gaps": "Areas with high potential but low UMKM density",
                    "growth_potential": "Based on skor_potensi trend and infrastructure trajectory",
                    "risk_return_profile": "Survival rate vs revenue potential ratio"
                }
            },
            "response_template": {
                "format": "investment_memo",
                "sections": ["opportunity_summary", "market_analysis", "risk_assessment", "financial_projections", "recommendation"]
            }
        }
    },
    "routing_rules": {
        "description": "Rules for routing queries to the appropriate persona schema",
        "keyword_mapping": {
            "bank": ["kredit", "KUR", "pinjaman", "default", "risiko kredit", "layak", "agunan", "bunga"],
            "government": ["intervensi", "infrastruktur", "prioritas", "anggaran", "kebijakan", "pembangunan"],
            "investor": ["investasi", "peluang", "pasar", "ROI", "pertumbuhan", "sektor", "modal"]
        },
        "fallback": "If persona cannot be determined, use investor schema (broadest coverage)"
    }
}

# Save retrieval schemas
with open('../data/knowledge_base/retrieval_schemas.json', 'w', encoding='utf-8') as f:
    json.dump(retrieval_schemas, f, indent=2, ensure_ascii=False)

print("Retrieval Schemas Generated for 3 Personas:")
for persona, schema in retrieval_schemas['personas'].items():
    print(f"\\n  {schema['name']}:")
    print(f"    Primary queries: {len(schema['primary_queries'])}")
    print(f"    Key fields: {len(schema['retrieval_strategy']['key_fields'])}")
    print(f"    Response format: {schema['response_template']['format']}")
'''

S6_MD = """## 6. Example Queries & Expected Responses

Demonstration of how the RIG system would handle real queries from each persona.
These examples serve as:
1. **Test cases** for validating the retrieval pipeline
2. **Few-shot examples** for prompt engineering
3. **Quality benchmarks** for response evaluation
"""

S6_CODE = '''# Get sample data for realistic examples
sample_kec = umkm.groupby('kecamatan').first().reset_index().iloc[0]
sample_kec_name = sample_kec['kecamatan']
sample_kab = sample_kec['kabupaten_kota']

# Example queries and expected responses for each persona
example_queries = {
    "bank_examples": [
        {
            "query": f"Apakah UMKM di Kecamatan {sample_kec_name} layak untuk KUR?",
            "intent": "credit_assessment",
            "retrieved_docs": ["location_profile", "cluster_summary"],
            "expected_response": f"Berdasarkan analisis data untuk Kecamatan {sample_kec_name}, {sample_kab}: "
                f"Tingkat survival rate UMKM di area ini perlu dievaluasi bersama skor infrastruktur "
                f"dan penetrasi KUR existing. Rekomendasi: evaluasi individual dengan mempertimbangkan "
                f"profil risiko area dan historical performance cluster."
        },
        {
            "query": "Berapa tingkat default rate untuk UMKM di cluster Urban Digital Leaders?",
            "intent": "portfolio_risk",
            "retrieved_docs": ["cluster_summary", "model_insights"],
            "expected_response": "Cluster Urban Digital Leaders memiliki survival rate tertinggi (~72%). "
                "Estimasi default rate: ~28% dalam 3 tahun. Faktor pendukung: infrastruktur kuat, "
                "adopsi digital tinggi, dan akses finansial baik."
        },
        {
            "query": "Area mana yang memiliki risiko kredit tertinggi?",
            "intent": "risk_mapping",
            "retrieved_docs": ["location_profiles", "cluster_summaries"],
            "expected_response": "Area dengan risiko kredit tertinggi berada di cluster High-Risk Underserved "
                "dengan karakteristik: infrastruktur rendah, income per kapita rendah, dan risiko bencana tinggi. "
                "Kecamatan-kecamatan di cluster ini memerlukan jaminan tambahan atau skema KUR khusus."
        },
        {
            "query": "Bagaimana profil risiko portofolio KUR berdasarkan score band?",
            "intent": "portfolio_analysis",
            "retrieved_docs": ["model_insights"],
            "expected_response": "Distribusi portofolio berdasarkan credit score band menunjukkan "
                "konsentrasi terbesar pada rating menengah. Rekomendasi: diversifikasi exposure "
                "dengan meningkatkan porsi di area high-potential yang underserved."
        },
        {
            "query": "Faktor apa saja yang mempengaruhi kemampuan bayar UMKM?",
            "intent": "risk_factors",
            "retrieved_docs": ["model_insights"],
            "expected_response": "Top faktor yang mempengaruhi survival/kemampuan bayar UMKM: "
                "1) Business maturity (usia usaha), 2) Digital presence, "
                "3) Financial access score, 4) Infrastructure quality, "
                "5) Competition density. Model credit risk menunjukkan bahwa "
                "kombinasi faktor ini menjelaskan mayoritas variasi dalam default rate."
        }
    ],
    "government_examples": [
        {
            "query": "Kecamatan mana yang paling butuh intervensi infrastruktur?",
            "intent": "priority_identification",
            "retrieved_docs": ["cluster_summaries", "location_profiles"],
            "expected_response": "Kecamatan-kecamatan di cluster High-Risk Underserved (priority rank #1) "
                "paling membutuhkan intervensi infrastruktur. Cluster ini memiliki skor infrastruktur terendah "
                "dan mencakup sejumlah besar UMKM. Rekomendasi: fokus pada akses jalan, jaringan internet, "
                "dan proximity ke fasilitas keuangan."
        },
        {
            "query": "Berapa anggaran yang dibutuhkan untuk program digitalisasi UMKM?",
            "intent": "budget_planning",
            "retrieved_docs": ["cluster_summaries", "model_insights"],
            "expected_response": "Berdasarkan analisis cluster, prioritas digitalisasi tertinggi ada di "
                "cluster dengan digital adoption < 50%. Estimasi impact dari policy simulation: "
                "program digitalisasi dapat meningkatkan skor potensi rata-rata dan survival rate. "
                "Alokasi anggaran proporsional terhadap jumlah UMKM affected."
        },
        {
            "query": "Apa dampak ekspansi KUR terhadap UMKM?",
            "intent": "policy_impact",
            "retrieved_docs": ["model_insights"],
            "expected_response": "Simulasi What-If menunjukkan bahwa ekspansi KUR +20% dapat meningkatkan "
                "skor potensi rata-rata, dengan mayoritas UMKM di area low-KUR mengalami improvement. "
                "Program ini berpotensi menghasilkan UMKM baru di atas threshold viable."
        },
        {
            "query": "Cluster mana yang harus diprioritaskan untuk program pemberdayaan?",
            "intent": "cluster_prioritization",
            "retrieved_docs": ["cluster_summaries"],
            "expected_response": "Urutan prioritas pemberdayaan: 1) High-Risk Underserved - kebutuhan paling mendesak, "
                "2) Rural Developing - potensi transformasi tinggi, "
                "3) Moderate Established - perlu dukungan scaling. "
                "Alokasi anggaran mengikuti priority score dan jumlah UMKM terdampak."
        },
        {
            "query": "Bagaimana distribusi UMKM berdasarkan tingkat kerentanan?",
            "intent": "vulnerability_mapping",
            "retrieved_docs": ["cluster_summaries", "location_profiles"],
            "expected_response": "Distribusi kerentanan UMKM: cluster High-Risk Underserved memiliki "
                "vulnerability tertinggi (low survival + high risk), diikuti Rural Developing. "
                "Total UMKM vulnerable perlu mendapat perhatian khusus dalam program perlindungan sosial."
        }
    ],
    "investor_examples": [
        {
            "query": "Di mana peluang investasi terbaik untuk sektor makanan?",
            "intent": "sector_opportunity",
            "retrieved_docs": ["location_profiles", "cluster_summaries"],
            "expected_response": "Peluang investasi sektor makanan terbaik berada di kecamatan-kecamatan "
                "dengan: 1) Populasi tinggi tapi kompetisi rendah (market gap), "
                "2) Infrastruktur memadai (skor > 70), "
                "3) Income per kapita tinggi (daya beli). "
                "Top locations teridentifikasi dari cluster Urban Digital Leaders dan Suburban Growth."
        },
        {
            "query": "Cluster mana yang memberikan ROI tertinggi?",
            "intent": "roi_analysis",
            "retrieved_docs": ["cluster_summaries", "model_insights"],
            "expected_response": "Berdasarkan investment ranking, cluster Urban Digital Leaders memberikan "
                "ROI tertinggi dengan investment score tertinggi. Faktor pendorong: growth potential maksimal, "
                "survival rate tinggi, dan revenue level kuat. Total market size cluster ini sangat signifikan."
        },
        {
            "query": "Bagaimana potensi pasar UMKM di area suburban?",
            "intent": "market_sizing",
            "retrieved_docs": ["cluster_summaries", "location_profiles"],
            "expected_response": "Area suburban (cluster Suburban Growth) menunjukkan potensi pasar yang menarik: "
                "pertumbuhan populasi dari urban spillover, infrastruktur yang berkembang, "
                "dan tingkat kompetisi yang masih moderat. Market gap analysis menunjukkan "
                "peluang di sektor-sektor tertentu yang belum terlayani."
        },
        {
            "query": "Area mana yang cocok untuk fintech lending?",
            "intent": "fintech_opportunity",
            "retrieved_docs": ["location_profiles", "model_insights"],
            "expected_response": "Area potensial untuk fintech lending: kecamatan dengan "
                "penetrasi KUR rendah (<20%), jarak ke bank jauh (>5km), tapi memiliki "
                "akses internet memadai (>60%). Ini menunjukkan demand untuk layanan keuangan "
                "yang belum terpenuhi oleh institusi tradisional."
        },
        {
            "query": "Apa risiko investasi di area rural?",
            "intent": "risk_assessment",
            "retrieved_docs": ["cluster_summaries", "location_profiles"],
            "expected_response": "Risiko investasi di area rural (cluster Rural Developing): "
                "1) Survival rate lebih rendah dari urban, "
                "2) Infrastruktur terbatas mempengaruhi operasional, "
                "3) Risiko bencana alam di beberapa area, "
                "4) Daya beli terbatas. Mitigasi: fokus pada sektor esensial "
                "dengan barrier to entry rendah."
        }
    ]
}

print("Example Queries Generated:")
for persona, examples in example_queries.items():
    print(f"\\n  {persona}: {len(examples)} examples")
    for i, ex in enumerate(examples, 1):
        print(f"    {i}. [{ex['intent']}] {ex['query'][:60]}...")
'''

S7_MD = """## 7. Azure OpenAI Integration Design (Code Stubs)

The following cells contain **non-executable code stubs** for production deployment
with Azure OpenAI services. These are wrapped in `if False:` blocks to prevent execution.

### Integration Components:
1. **Embedding Creation** - Azure OpenAI `text-embedding-ada-002`
2. **Vector Indexing** - Azure AI Search with semantic configuration
3. **RAG Pipeline** - Query processing, retrieval, and response generation

### Configuration Requirements:
- Azure OpenAI endpoint and API key
- Azure AI Search service endpoint
- Deployment names for embedding and chat models
"""

S7_CODE = '''# === AZURE OPENAI INTEGRATION STUBS ===
# These are non-executable code patterns for production deployment.
# DO NOT remove the `if False:` guards.

# --- 7a. Embedding Creation with Azure OpenAI ---
if False:
    from openai import AzureOpenAI

    # Configuration
    AZURE_OPENAI_ENDPOINT = "https://<your-resource>.openai.azure.com/"
    AZURE_OPENAI_KEY = "<your-api-key>"
    EMBEDDING_DEPLOYMENT = "text-embedding-ada-002"
    CHAT_DEPLOYMENT = "gpt-4"

    client = AzureOpenAI(
        azure_endpoint=AZURE_OPENAI_ENDPOINT,
        api_key=AZURE_OPENAI_KEY,
        api_version="2024-02-01"
    )

    def create_embeddings(texts, batch_size=16):
        """Create embeddings for a list of texts using Azure OpenAI."""
        all_embeddings = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            response = client.embeddings.create(
                input=batch,
                model=EMBEDDING_DEPLOYMENT
            )
            batch_embeddings = [item.embedding for item in response.data]
            all_embeddings.extend(batch_embeddings)
        return all_embeddings

    # Create embeddings for all location profiles
    profile_texts = [
        f"{p['name']}, {p['kabupaten']}. "
        f"Cluster: {p['cluster']['cluster_name']}. "
        f"Infrastructure: {p['infrastructure']['skor_infrastruktur']}. "
        f"UMKM count: {p['umkm_statistics']['n_umkm']}. "
        f"Avg potential: {p['umkm_statistics']['avg_skor_potensi']}. "
        f"Business types: {', '.join(p['recommended_business_types'])}."
        for p in location_profiles
    ]
    embeddings = create_embeddings(profile_texts)
    print(f"Created {len(embeddings)} embeddings of dimension {len(embeddings[0])}")

# --- 7b. Azure AI Search Indexing ---
if False:
    from azure.search.documents import SearchClient
    from azure.search.documents.indexes import SearchIndexClient
    from azure.search.documents.indexes.models import (
        SearchIndex, SimpleField, SearchFieldDataType,
        SearchableField, VectorSearch, HnswAlgorithmConfiguration,
        VectorSearchProfile, SearchField
    )
    from azure.core.credentials import AzureKeyCredential

    SEARCH_ENDPOINT = "https://<your-search>.search.windows.net"
    SEARCH_KEY = "<your-search-key>"
    INDEX_NAME = "geoumkm-knowledge-base"

    # Create index schema
    index = SearchIndex(
        name=INDEX_NAME,
        fields=[
            SimpleField(name="id", type=SearchFieldDataType.String, key=True),
            SearchableField(name="content", type=SearchFieldDataType.String),
            SimpleField(name="type", type=SearchFieldDataType.String, filterable=True),
            SimpleField(name="persona", type=SearchFieldDataType.String, filterable=True),
            SimpleField(name="cluster_id", type=SearchFieldDataType.Int32, filterable=True),
            SimpleField(name="kabupaten", type=SearchFieldDataType.String, filterable=True),
            SearchField(
                name="embedding",
                type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
                searchable=True,
                vector_search_dimensions=1536,
                vector_search_profile_name="default-profile"
            )
        ],
        vector_search=VectorSearch(
            algorithms=[HnswAlgorithmConfiguration(name="default-algo")],
            profiles=[VectorSearchProfile(name="default-profile", algorithm_configuration_name="default-algo")]
        )
    )

    # Create or update index
    index_client = SearchIndexClient(SEARCH_ENDPOINT, AzureKeyCredential(SEARCH_KEY))
    index_client.create_or_update_index(index)

    # Upload documents with embeddings
    search_client = SearchClient(SEARCH_ENDPOINT, INDEX_NAME, AzureKeyCredential(SEARCH_KEY))
    documents = []
    for profile, embedding in zip(location_profiles, embeddings):
        documents.append({
            "id": profile["id"],
            "content": profile_texts[location_profiles.index(profile)],
            "type": profile["type"],
            "persona": "all",
            "cluster_id": profile["cluster"]["cluster_id"],
            "kabupaten": profile["kabupaten"],
            "embedding": embedding
        })
    result = search_client.upload_documents(documents)
    print(f"Indexed {len(documents)} documents")

# --- 7c. RAG Pipeline ---
if False:
    def rag_pipeline(query, persona="investor", top_k=5):
        """
        Full RAG pipeline: query -> embed -> retrieve -> generate.

        Args:
            query: User question in natural language
            persona: One of 'bank', 'government', 'investor'
            top_k: Number of documents to retrieve

        Returns:
            Generated response with citations
        """
        # Step 1: Create query embedding
        query_embedding = create_embeddings([query])[0]

        # Step 2: Retrieve relevant documents
        from azure.search.documents.models import VectorizedQuery
        vector_query = VectorizedQuery(
            vector=query_embedding,
            k_nearest_neighbors=top_k,
            fields="embedding"
        )

        results = search_client.search(
            search_text=query,
            vector_queries=[vector_query],
            filter=f"persona eq '{persona}' or persona eq 'all'",
            top=top_k
        )

        # Step 3: Assemble context
        context_docs = []
        for result in results:
            context_docs.append(result["content"])
        context = "\\n\\n".join(context_docs)

        # Step 4: Generate response with LLM
        system_prompt = f"""You are a UMKM intelligence assistant for {persona} stakeholders.
        Use the following context to answer the question. Always cite specific data points.
        Respond in Bahasa Indonesia.

        Context:
        {context}
        """

        response = client.chat.completions.create(
            model=CHAT_DEPLOYMENT,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            temperature=0.3,
            max_tokens=1000
        )

        return {
            "answer": response.choices[0].message.content,
            "sources": context_docs,
            "persona": persona,
            "query": query
        }

    # Example usage
    result = rag_pipeline(
        query="Di mana peluang investasi terbaik untuk sektor makanan?",
        persona="investor",
        top_k=5
    )
    print(result["answer"])

print("Azure OpenAI integration stubs defined (not executed)")
print("Components: Embedding Creation, AI Search Indexing, RAG Pipeline")
'''

S8_MD = """## 8. Embedding Simulation (TF-IDF Local Stand-in)

Since we cannot call Azure OpenAI in this notebook, we use **scikit-learn TF-IDF**
as a local stand-in for embeddings to demonstrate the retrieval concept.

This simulation:
1. Vectorizes all location profile documents using TF-IDF
2. Performs cosine similarity search for sample queries
3. Returns top-k most relevant documents

In production, TF-IDF would be replaced by `text-embedding-ada-002` embeddings
with 1536 dimensions and superior semantic understanding.
"""

S8_CODE = '''from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Convert location profiles to text documents for TF-IDF
def profile_to_text(profile):
    """Convert a location profile JSON to a searchable text document."""
    parts = [
        f"Kecamatan {profile['name']} di {profile['kabupaten']}",
        f"Cluster {profile['cluster']['cluster_name']}",
        f"Infrastruktur skor {profile['infrastructure']['skor_infrastruktur']}",
        f"Internet akses {profile['infrastructure']['akses_internet_pct']} persen",
        f"Populasi {profile['demographics']['populasi']}",
        f"Kepadatan {profile['demographics']['kepadatan_penduduk']}",
        f"Income per kapita {profile['demographics']['income_per_kapita']} juta",
        f"Jumlah UMKM {profile['umkm_statistics']['n_umkm']}",
        f"Skor potensi rata-rata {profile['umkm_statistics']['avg_skor_potensi']}",
        f"Omset rata-rata {profile['umkm_statistics']['avg_omset_juta']} juta",
        f"Survival rate {profile['umkm_statistics']['survival_rate']}",
        f"Risiko banjir {profile['risk_levels']['risiko_banjir']}",
        f"Risiko gempa {profile['risk_levels']['risiko_gempa']}",
        f"KUR penetrasi {profile['infrastructure']['penetrasi_kur_pct']} persen",
        f"Jenis usaha rekomendasi {' '.join(profile['recommended_business_types'])}",
    ]
    if profile['is_urban']:
        parts.append("area urban kota perkotaan")
    else:
        parts.append("area rural desa pedesaan")
    return " ".join(parts)

# Build document corpus
documents = [profile_to_text(p) for p in location_profiles]
print(f"Built corpus of {len(documents)} documents")
print(f"Sample document (first 200 chars): {documents[0][:200]}...")

# Fit TF-IDF vectorizer
vectorizer = TfidfVectorizer(
    max_features=5000,
    ngram_range=(1, 2),
    stop_words=None  # Keep Indonesian words
)
tfidf_matrix = vectorizer.fit_transform(documents)
print(f"\\nTF-IDF matrix shape: {tfidf_matrix.shape}")
print(f"Vocabulary size: {len(vectorizer.vocabulary_)}")

# Define similarity search function
def search_documents(query, top_k=5):
    """Search documents using TF-IDF cosine similarity."""
    query_vec = vectorizer.transform([query])
    similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
    top_indices = similarities.argsort()[::-1][:top_k]

    results = []
    for idx in top_indices:
        results.append({
            "rank": len(results) + 1,
            "kecamatan": location_profiles[idx]['name'],
            "kabupaten": location_profiles[idx]['kabupaten'],
            "cluster": location_profiles[idx]['cluster']['cluster_name'],
            "similarity_score": round(float(similarities[idx]), 4),
            "n_umkm": location_profiles[idx]['umkm_statistics']['n_umkm'],
            "avg_potensi": location_profiles[idx]['umkm_statistics']['avg_skor_potensi']
        })
    return results

# Demo queries
demo_queries = [
    "peluang investasi makanan di area urban dengan infrastruktur tinggi",
    "kecamatan rural dengan risiko banjir tinggi butuh intervensi",
    "area dengan penetrasi KUR rendah dan akses internet tinggi untuk fintech",
    "UMKM potensi tinggi di cluster Urban Digital Leaders",
    "daerah suburban dengan pertumbuhan populasi dan kompetisi rendah"
]

print("\\n" + "="*70)
print("RETRIEVAL SIMULATION RESULTS")
print("="*70)

for query in demo_queries:
    print(f"\\nQuery: '{query}'")
    print("-" * 60)
    results = search_documents(query, top_k=3)
    for r in results:
        print(f"  #{r['rank']} | {r['kecamatan']}, {r['kabupaten']} "
              f"| Cluster: {r['cluster']} "
              f"| Score: {r['similarity_score']:.4f} "
              f"| UMKMs: {r['n_umkm']}")

print("\\n\\nTF-IDF Simulation Complete - demonstrates retrieval concept")
print("In production: replace TF-IDF with Azure OpenAI text-embedding-ada-002")
'''

S9_MD = """## 9. Save Knowledge Base & Manifest

Save all JSON documents to the knowledge base directory and create a manifest file
documenting all available documents and their purposes.

### Knowledge Base Contents:
| File | Description | Document Count |
|------|-------------|----------------|
| `location_profiles.json` | Per-kecamatan structured profiles | ~553 |
| `cluster_summaries.json` | Cluster narratives with SWOT | 5 |
| `model_insights.json` | Model feature importance & findings | 1 |
| `retrieval_schemas.json` | Persona-specific retrieval rules | 3 personas |
| `example_queries.json` | Demo queries with expected responses | 15 |
| `manifest.json` | Knowledge base inventory | 1 |
"""

S9_CODE = '''# Save example queries
with open('../data/knowledge_base/example_queries.json', 'w', encoding='utf-8') as f:
    json.dump(example_queries, f, indent=2, ensure_ascii=False)

# Create manifest
manifest = {
    "knowledge_base_version": "1.0",
    "created_by": "Notebook 07 - LLM & RIG Preparation",
    "description": "Structured knowledge base for GeoUMKM Smart RAG/RIG system",
    "documents": {
        "location_profiles.json": {
            "type": "location_profile",
            "count": len(location_profiles),
            "description": "Per-kecamatan structured profiles with demographics, infrastructure, risk, and UMKM statistics",
            "primary_personas": ["bank", "investor", "government"],
            "key_fields": ["name", "kabupaten", "coordinates", "demographics", "infrastructure", "risk_levels", "umkm_statistics", "cluster", "recommended_business_types"]
        },
        "cluster_summaries.json": {
            "type": "cluster_summary",
            "count": len(cluster_summaries),
            "description": "Cluster-level narrative summaries with SWOT analysis and recommended actions",
            "primary_personas": ["government", "investor"],
            "key_fields": ["cluster_name", "description", "key_characteristics", "swot", "recommended_actions"]
        },
        "model_insights.json": {
            "type": "model_insight",
            "count": 1,
            "description": "Model feature importance, credit score bands, and policy simulation results",
            "primary_personas": ["bank", "government"],
            "key_fields": ["location_scoring_model", "credit_risk_model", "policy_simulation_results"]
        },
        "retrieval_schemas.json": {
            "type": "retrieval_schema",
            "count": 3,
            "description": "Persona-specific retrieval strategies defining what to retrieve and how to format responses",
            "primary_personas": ["bank", "government", "investor"],
            "key_fields": ["personas", "routing_rules"]
        },
        "example_queries.json": {
            "type": "example_queries",
            "count": 15,
            "description": "5 example queries per persona with expected responses for testing and few-shot prompting",
            "primary_personas": ["bank", "government", "investor"],
            "key_fields": ["query", "intent", "retrieved_docs", "expected_response"]
        }
    },
    "embedding_config": {
        "production_model": "text-embedding-ada-002",
        "dimensions": 1536,
        "local_simulation": "TF-IDF (scikit-learn)",
        "local_dimensions": int(tfidf_matrix.shape[1])
    },
    "deployment_notes": {
        "vector_store": "Azure AI Search",
        "llm": "Azure OpenAI GPT-4",
        "cache": "Redis for frequent queries",
        "monitoring": "Azure Application Insights"
    }
}

# Save manifest
with open('../data/knowledge_base/manifest.json', 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

# Summary
print("="*70)
print("KNOWLEDGE BASE CONSTRUCTION COMPLETE")
print("="*70)
kb_files = os.listdir('../data/knowledge_base')
print(f"\\nFiles in data/knowledge_base/: {len(kb_files)}")
for fname in sorted(kb_files):
    fpath = f'../data/knowledge_base/{fname}'
    size = os.path.getsize(fpath)
    print(f"  {fname:40s} ({size:,} bytes)")

print(f"\\nTotal location profiles: {len(location_profiles)}")
print(f"Total cluster summaries: {len(cluster_summaries)}")
print(f"Total example queries: {sum(len(v) for v in example_queries.values())}")
print(f"\\nKnowledge base ready for Azure OpenAI integration")
'''
