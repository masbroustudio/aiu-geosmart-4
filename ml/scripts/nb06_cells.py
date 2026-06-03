"""Cells for Notebook 06: Recommendation Engine & What-If Simulation."""
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
    return cells


def _title_cells():
    return [nbf.v4.new_markdown_cell(TITLE_MD)]


def _section1_cells():
    return [
        nbf.v4.new_markdown_cell(S1_MD),
        nbf.v4.new_code_cell(S1_CODE1),
        nbf.v4.new_code_cell(S1_CODE2),
    ]


def _section2_cells():
    return [
        nbf.v4.new_markdown_cell(S2_MD),
        nbf.v4.new_code_cell(S2_CODE1),
        nbf.v4.new_code_cell(S2_CODE2),
        nbf.v4.new_code_cell(S2_CODE3),
    ]


def _section3_cells():
    return [
        nbf.v4.new_markdown_cell(S3_MD),
        nbf.v4.new_code_cell(S3_CODE1),
        nbf.v4.new_code_cell(S3_CODE2),
    ]


def _section4_cells():
    return [
        nbf.v4.new_markdown_cell(S4_MD),
        nbf.v4.new_code_cell(S4_CODE1),
        nbf.v4.new_code_cell(S4_CODE2),
        nbf.v4.new_code_cell(S4_CODE3),
        nbf.v4.new_code_cell(S4_CODE4),
    ]


def _section5_cells():
    return [
        nbf.v4.new_markdown_cell(S5_MD),
        nbf.v4.new_code_cell(S5_CODE1),
        nbf.v4.new_code_cell(S5_CODE2),
    ]


def _section6_cells():
    return [
        nbf.v4.new_markdown_cell(S6_MD),
        nbf.v4.new_code_cell(S6_CODE1),
        nbf.v4.new_code_cell(S6_CODE2),
        nbf.v4.new_code_cell(S6_CODE3),
        nbf.v4.new_code_cell(S6_CODE4),
    ]


def _section7_cells():
    return [
        nbf.v4.new_markdown_cell(S7_MD),
        nbf.v4.new_code_cell(S7_CODE1),
        nbf.v4.new_code_cell(S7_CODE2),
        nbf.v4.new_code_cell(S7_CODE3),
    ]


def _section8_cells():
    return [
        nbf.v4.new_markdown_cell(S8_MD),
        nbf.v4.new_code_cell(S8_CODE1),
        nbf.v4.new_markdown_cell(S8_CLOSING_MD),
    ]


# --- Content strings below ---

TITLE_MD = """# Notebook 06: Recommendation Engine & What-If Simulation

This notebook implements a comprehensive recommendation and simulation system for UMKM
(Micro, Small, and Medium Enterprises) in West Java. It combines:

1. **Content-Based Location Recommendations** - Finding optimal locations for new businesses
2. **Kecamatan-Level Rankings** - Aggregated area recommendations by business type
3. **What-If Simulations** - Predicting impact of infrastructure/policy changes
4. **Counterfactual Explanations** - Identifying minimum changes needed for improvement
5. **Policy Simulations** - Quantifying government intervention impacts
6. **Investment Scenario Modeling** - Guiding investor decisions

**Methodology Note:** All predictions use trained ML models (XGBoost for location scoring,
Logistic Regression for credit risk). Simulations modify input features and re-predict
outcomes, showing causal-style estimates under the assumption that the model captures
relevant relationships. These are estimates based on synthetic data and should be validated
with real-world experiments."""

S1_MD = """## Section 1: Load Models & Data

We load the pre-trained models and all required datasets."""

S1_CODE1 = """import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler, StandardScaler
import joblib
import warnings
warnings.filterwarnings('ignore')

# Load models
location_model = joblib.load('../models/location_scoring_model.joblib')
credit_model = joblib.load('../models/credit_risk_model.joblib')

# Get feature names from models
location_features = list(location_model.feature_names_in_)
print(f"Location scoring model features ({len(location_features)}):")
for i, f in enumerate(location_features, 1):
    print(f"  {i:2d}. {f}")

# Credit model features (from training notebook)
credit_features = [
    'omset_bulanan', 'jumlah_karyawan', 'tahun_berdiri', 'has_digital_presence',
    'jarak_ke_bank_terdekat', 'penetrasi_kur_pct', 'skor_infrastruktur',
    'risiko_banjir', 'risiko_gempa', 'jumlah_kompetitor_radius_3km',
    'kepadatan_penduduk', 'income_per_kapita', 'akses_internet_pct',
    'jarak_ke_jalan_utama', 'jarak_ke_pasar', 'populasi',
    'business_maturity', 'risk_composite', 'financial_access_score',
    'digital_readiness_index', 'omset_per_karyawan', 'market_gap_score',
    'competition_density_ratio'
]
print(f"\\nCredit risk model features ({len(credit_features)})")"""

S1_CODE2 = """# Load datasets
df = pd.read_csv('../data/umkm_clustered.csv')
kecamatan_ref = pd.read_csv('../data/kecamatan_reference.csv')

print(f"UMKM dataset: {df.shape[0]:,} rows, {df.shape[1]} columns")
print(f"Kecamatan reference: {kecamatan_ref.shape[0]} kecamatan")
print(f"\\nBusiness types: {df['jenis_usaha'].unique().tolist()}")
print(f"Kabupaten/Kota: {df['kabupaten_kota'].nunique()} areas")
print(f"\\nTarget distributions:")
print(f"  Mean skor_potensi: {df['skor_potensi'].mean():.1f}")
print(f"  Survival rate: {df['is_survived_3yr'].mean():.1%}")"""

S2_MD = """## Section 2: Content-Based Location Recommendation

For a given UMKM profile (business type, target revenue, number of employees), we find
the top 10 most similar **successful** locations using cosine similarity on normalized
feature vectors.

**Success criteria:** `is_survived_3yr == 1` AND `skor_potensi > 70`

**Methodology:**
1. Filter dataset to successful UMKMs only
2. Normalize feature vectors using MinMaxScaler
3. Compute cosine similarity between query profile and all successful UMKMs
4. Return top 10 most similar locations with explanations"""

S2_CODE1 = """# Define successful UMKMs
successful_mask = (df['is_survived_3yr'] == 1) & (df['skor_potensi'] > 70)
df_successful = df[successful_mask].copy()
print(f"Successful UMKMs (survived & score > 70): {len(df_successful):,} / {len(df):,} ({len(df_successful)/len(df):.1%})")

# Features for similarity computation
similarity_features = [
    'is_kota', 'jumlah_karyawan', 'has_digital_presence', 'omset_bulanan',
    'populasi', 'kepadatan_penduduk', 'income_per_kapita',
    'jarak_ke_jalan_utama', 'jarak_ke_pasar', 'akses_internet_pct',
    'skor_infrastruktur', 'jumlah_kompetitor_radius_3km',
    'jarak_ke_bank_terdekat', 'penetrasi_kur_pct',
    'business_maturity', 'market_gap_score', 'digital_readiness_index',
    'financial_access_score', 'omset_per_karyawan'
]

# Normalize features
scaler = MinMaxScaler()
X_successful = scaler.fit_transform(df_successful[similarity_features])
print(f"Feature matrix for similarity: {X_successful.shape}")"""

S2_CODE2 = """def recommend_locations(jenis_usaha, target_omset, jumlah_karyawan, top_n=10):
    \"\"\"Find top N most similar successful locations for a given UMKM profile.\"\"\"
    # Filter by business type
    type_mask = df_successful['jenis_usaha'] == jenis_usaha
    df_filtered = df_successful[type_mask].copy()
    
    if len(df_filtered) < 5:
        df_filtered = df_successful.copy()
    
    X_filtered = scaler.transform(df_filtered[similarity_features])
    
    # Create query profile
    query_profile = df_filtered[similarity_features].median().copy()
    query_profile['omset_bulanan'] = target_omset
    query_profile['jumlah_karyawan'] = jumlah_karyawan
    
    query_vector = scaler.transform(query_profile.values.reshape(1, -1))
    
    # Compute cosine similarity
    similarities = cosine_similarity(query_vector, X_filtered)[0]
    top_indices = np.argsort(similarities)[::-1][:top_n]
    
    results = []
    for idx in top_indices:
        row = df_filtered.iloc[idx]
        reasons = []
        if row['skor_infrastruktur'] > df['skor_infrastruktur'].median():
            reasons.append('Good infrastructure')
        if row['akses_internet_pct'] > 0.6:
            reasons.append('High internet access')
        if row['jumlah_kompetitor_radius_3km'] < df['jumlah_kompetitor_radius_3km'].median():
            reasons.append('Low competition')
        if row['financial_access_score'] > df['financial_access_score'].median():
            reasons.append('Good financial access')
        if row['market_gap_score'] > df['market_gap_score'].median():
            reasons.append('Market opportunity')
        
        results.append({
            'kecamatan': row['kecamatan'],
            'kabupaten_kota': row['kabupaten_kota'],
            'skor_potensi': round(row['skor_potensi'], 1),
            'similarity_score': round(similarities[idx], 4),
            'omset_bulanan': row['omset_bulanan'],
            'skor_infrastruktur': round(row['skor_infrastruktur'], 1),
            'akses_internet_pct': round(row['akses_internet_pct'], 2),
            'jumlah_kompetitor': row['jumlah_kompetitor_radius_3km'],
            'reason': '; '.join(reasons[:3]) if reasons else 'High overall similarity'
        })
    
    return pd.DataFrame(results)

# Recommendations for Makanan
print("=" * 80)
print("RECOMMENDATION: Makanan business, target Rp 15M/month, 5 employees")
print("=" * 80)
rec_makanan = recommend_locations('Makanan', 15_000_000, 5)
print(rec_makanan[['kecamatan', 'kabupaten_kota', 'skor_potensi', 'similarity_score', 'reason']].to_string(index=False))"""

S2_CODE3 = """print("\\n" + "=" * 80)
print("RECOMMENDATION: Fashion business, target Rp 25M/month, 8 employees")
print("=" * 80)
rec_fashion = recommend_locations('Fashion', 25_000_000, 8)
print(rec_fashion[['kecamatan', 'kabupaten_kota', 'skor_potensi', 'similarity_score', 'reason']].to_string(index=False))

print("\\n" + "=" * 80)
print("RECOMMENDATION: Jasa business, target Rp 10M/month, 3 employees")
print("=" * 80)
rec_jasa = recommend_locations('Jasa', 10_000_000, 3)
print(rec_jasa[['kecamatan', 'kabupaten_kota', 'skor_potensi', 'similarity_score', 'reason']].to_string(index=False))

print("\\n" + "=" * 80)
print("RECOMMENDATION: Pertanian business, target Rp 8M/month, 4 employees")
print("=" * 80)
rec_pertanian = recommend_locations('Pertanian', 8_000_000, 4)
print(rec_pertanian[['kecamatan', 'kabupaten_kota', 'skor_potensi', 'similarity_score', 'reason']].to_string(index=False))"""

S3_MD = """## Section 3: Kecamatan-Level Recommendation

We aggregate UMKM data to the kecamatan level and rank locations by predicted success
score, competition level, and infrastructure quality for each business type.

This provides actionable guidance for entrepreneurs choosing where to establish their business."""

S3_CODE1 = """# Aggregate UMKM data to kecamatan level by jenis_usaha
kec_agg = df.groupby(['kabupaten_kota', 'kecamatan', 'jenis_usaha']).agg(
    avg_skor_potensi=('skor_potensi', 'mean'),
    avg_omset=('omset_bulanan', 'mean'),
    survival_rate=('is_survived_3yr', 'mean'),
    avg_infrastruktur=('skor_infrastruktur', 'mean'),
    avg_kompetitor=('jumlah_kompetitor_radius_3km', 'mean'),
    avg_internet=('akses_internet_pct', 'mean'),
    avg_financial_access=('financial_access_score', 'mean'),
    umkm_count=('skor_potensi', 'count')
).reset_index()

# Composite recommendation score (higher is better)
kec_agg['competition_inv'] = 1 / (1 + kec_agg['avg_kompetitor'])
kec_agg['recommendation_score'] = (
    0.30 * kec_agg['avg_skor_potensi'] / 100 +
    0.25 * kec_agg['survival_rate'] +
    0.20 * kec_agg['avg_infrastruktur'] / kec_agg['avg_infrastruktur'].max() +
    0.15 * kec_agg['competition_inv'] +
    0.10 * kec_agg['avg_internet']
) * 100

print(f"Kecamatan-business type combinations: {len(kec_agg):,}")
print(f"Business types: {kec_agg['jenis_usaha'].nunique()}")
print(f"\\nRecommendation score stats:")
print(kec_agg['recommendation_score'].describe())"""

S3_CODE2 = """# Top 10 kecamatan per jenis_usaha
business_types = df['jenis_usaha'].unique()
all_recommendations = []

for btype in business_types:
    subset = kec_agg[kec_agg['jenis_usaha'] == btype].copy()
    subset = subset[subset['umkm_count'] >= 3]
    top10 = subset.nlargest(10, 'recommendation_score')
    
    print(f"\\n{'='*70}")
    print(f"TOP 10 KECAMATAN FOR: {btype.upper()}")
    print(f"{'='*70}")
    
    for rank, (_, row) in enumerate(top10.iterrows(), 1):
        explanation = []
        if row['survival_rate'] > 0.75:
            explanation.append(f"High survival ({row['survival_rate']:.0%})")
        if row['avg_kompetitor'] < kec_agg['avg_kompetitor'].median():
            explanation.append("Low competition")
        if row['avg_infrastruktur'] > kec_agg['avg_infrastruktur'].median():
            explanation.append("Good infrastructure")
        if row['avg_internet'] > 0.6:
            explanation.append(f"Good internet ({row['avg_internet']:.0%})")
        
        expl_str = '; '.join(explanation) if explanation else 'Balanced profile'
        print(f"  {rank:2d}. {row['kecamatan']:20s} ({row['kabupaten_kota']:20s}) "
              f"Score: {row['recommendation_score']:.1f} | {expl_str}")
        
        top10_row = row.to_dict()
        top10_row['rank'] = rank
        top10_row['explanation'] = expl_str
        all_recommendations.append(top10_row)

recommendations_df = pd.DataFrame(all_recommendations)
print(f"\\nTotal recommendations: {len(recommendations_df)} rows")"""

S4_MD = """## Section 4: What-If Simulation

Using the trained location scoring model, we simulate "what-if" scenarios to understand
the potential impact of infrastructure and policy changes.

**Approach:** We take actual UMKM data, modify specific features to simulate the
intervention, then re-predict scores. The difference shows the estimated impact.

**Scenarios:**
- (A) Infrastructure improves by 20% in Garut
- (B) A new bank branch opens in Pangandaran (reducing distance to banks by 50%)
- (C) Internet coverage reaches 80% in Ciamis"""

S4_CODE1 = """def predict_location_scores(data_df):
    \"\"\"Predict location scores using the trained model.\"\"\"
    X = data_df[location_features].copy()
    return location_model.predict(X)

def predict_survival_proba(data_df):
    \"\"\"Predict survival probability using the credit risk model.\"\"\"
    X = data_df[credit_features].copy()
    return credit_model.predict_proba(X)[:, 1]

def whatif_simulation(df_input, scenario_name, modifications):
    \"\"\"Run a what-if simulation by modifying features and re-predicting.\"\"\"
    df_before = df_input.copy()
    df_modified = df_input.copy()
    
    for feature, operation in modifications.items():
        if callable(operation):
            df_modified[feature] = operation(df_modified[feature])
        else:
            df_modified[feature] = operation
    
    # Recompute derived features if base features changed
    if 'skor_infrastruktur' in modifications or 'income_per_kapita' in modifications:
        df_modified['infra_x_income'] = df_modified['skor_infrastruktur'] * df_modified['income_per_kapita']
    if any(f in modifications for f in ['jarak_ke_bank_terdekat', 'jarak_ke_pasar', 'jarak_ke_jalan_utama']):
        df_modified['avg_distance_to_facilities'] = (
            df_modified['jarak_ke_bank_terdekat'] +
            df_modified['jarak_ke_pasar'] +
            df_modified['jarak_ke_jalan_utama']
        ) / 3
    if 'has_digital_presence' in modifications or 'akses_internet_pct' in modifications:
        df_modified['digital_readiness_index'] = (
            df_modified['has_digital_presence'] * 0.5 + df_modified['akses_internet_pct'] * 0.5
        )
    if 'jarak_ke_bank_terdekat' in modifications or 'penetrasi_kur_pct' in modifications:
        df_modified['financial_access_score'] = (
            df_modified['penetrasi_kur_pct'] * 0.5 +
            (1 / (1 + df_modified['jarak_ke_bank_terdekat'])) * 0.5
        )
    
    before_scores = predict_location_scores(df_before)
    after_scores = predict_location_scores(df_modified)
    improvement = after_scores - before_scores
    
    return {
        'scenario': scenario_name,
        'n_umkm_affected': len(df_input),
        'avg_score_before': round(before_scores.mean(), 2),
        'avg_score_after': round(after_scores.mean(), 2),
        'avg_improvement': round(improvement.mean(), 2),
        'max_improvement': round(improvement.max(), 2),
        'pct_improved': round((improvement > 0).mean() * 100, 1),
        'n_now_above_70': int(((after_scores > 70) & (before_scores <= 70)).sum())
    }

print("What-If simulation engine ready.")"""

S4_CODE2 = """# Scenario A: Infrastructure improves by 20% in Garut
print("=" * 80)
print("SCENARIO A: What if infrastructure improves by 20% in Garut?")
print("=" * 80)

garut_mask = df['kabupaten_kota'].str.contains('Garut', case=False, na=False)
df_garut = df[garut_mask].copy()
print(f"UMKMs in Garut: {len(df_garut)}")
print(f"Current avg skor_infrastruktur: {df_garut['skor_infrastruktur'].mean():.1f}")

result_a = whatif_simulation(
    df_garut,
    "Infrastructure +20% in Garut",
    {'skor_infrastruktur': lambda x: x * 1.2}
)

print(f"\\nResults:")
print(f"  Average score BEFORE: {result_a['avg_score_before']:.2f}")
print(f"  Average score AFTER:  {result_a['avg_score_after']:.2f}")
print(f"  Average improvement:  +{result_a['avg_improvement']:.2f} points")
print(f"  Maximum improvement:  +{result_a['max_improvement']:.2f} points")
print(f"  % UMKMs improved:     {result_a['pct_improved']:.1f}%")
print(f"  New UMKMs above 70:   {result_a['n_now_above_70']}")"""

S4_CODE3 = """# Scenario B: New bank branch in Pangandaran
print("=" * 80)
print("SCENARIO B: What if a new bank branch opens in Pangandaran?")
print("=" * 80)

pang_mask = df['kabupaten_kota'].str.contains('Pangandaran', case=False, na=False)
df_pang = df[pang_mask].copy()
print(f"UMKMs in Pangandaran: {len(df_pang)}")
print(f"Current avg jarak_ke_bank: {df_pang['jarak_ke_bank_terdekat'].mean():.2f} km")

result_b = whatif_simulation(
    df_pang,
    "New bank branch in Pangandaran (-50% distance)",
    {'jarak_ke_bank_terdekat': lambda x: x * 0.5}
)

print(f"\\nResults:")
print(f"  Average score BEFORE: {result_b['avg_score_before']:.2f}")
print(f"  Average score AFTER:  {result_b['avg_score_after']:.2f}")
print(f"  Average improvement:  +{result_b['avg_improvement']:.2f} points")
print(f"  Maximum improvement:  +{result_b['max_improvement']:.2f} points")
print(f"  % UMKMs improved:     {result_b['pct_improved']:.1f}%")
print(f"  New UMKMs above 70:   {result_b['n_now_above_70']}")"""

S4_CODE4 = """# Scenario C: Internet coverage reaches 80% in Ciamis
print("=" * 80)
print("SCENARIO C: What if internet coverage reaches 80% in Ciamis?")
print("=" * 80)

ciamis_mask = df['kabupaten_kota'].str.contains('Ciamis', case=False, na=False)
df_ciamis = df[ciamis_mask].copy()
print(f"UMKMs in Ciamis: {len(df_ciamis)}")
print(f"Current avg akses_internet_pct: {df_ciamis['akses_internet_pct'].mean():.2%}")

result_c = whatif_simulation(
    df_ciamis,
    "Internet coverage 80% in Ciamis",
    {'akses_internet_pct': lambda x: np.maximum(x, 0.80)}
)

print(f"\\nResults:")
print(f"  Average score BEFORE: {result_c['avg_score_before']:.2f}")
print(f"  Average score AFTER:  {result_c['avg_score_after']:.2f}")
print(f"  Average improvement:  +{result_c['avg_improvement']:.2f} points")
print(f"  Maximum improvement:  +{result_c['max_improvement']:.2f} points")
print(f"  % UMKMs improved:     {result_c['pct_improved']:.1f}%")
print(f"  New UMKMs above 70:   {result_c['n_now_above_70']}")

# Summary
print("\\n\\n" + "=" * 80)
print("WHAT-IF SIMULATION SUMMARY")
print("=" * 80)
whatif_results = pd.DataFrame([result_a, result_b, result_c])
print(whatif_results[['scenario', 'n_umkm_affected', 'avg_score_before', 'avg_score_after',
                       'avg_improvement', 'pct_improved', 'n_now_above_70']].to_string(index=False))"""

S5_MD = """## Section 5: Counterfactual Explanations

For UMKMs with low scores (bottom 20%), we find the minimum feature changes needed to
reach a score above 70. This provides actionable guidance: "What would need to change
for this business to succeed?"

**Algorithm:**
1. Identify low-scoring UMKMs (bottom 20% by skor_potensi)
2. Compute the mean feature values of successful UMKMs (score > 70)
3. Iteratively move features toward the successful mean
4. Re-predict at each step until the threshold is met
5. Report the minimum changes required"""

S5_CODE1 = """# Identify low-scoring UMKMs
threshold_low = df['skor_potensi'].quantile(0.20)
df_low = df[df['skor_potensi'] <= threshold_low].copy()
print(f"Low-scoring UMKMs (bottom 20%, score <= {threshold_low:.1f}): {len(df_low):,}")

# Successful UMKMs mean features (target profile)
df_high = df[df['skor_potensi'] > 70]
target_means = df_high[location_features].mean()

# Adjustable features (exclude immutable ones like tahun_berdiri, is_kota)
adjustable_features = [
    'skor_infrastruktur', 'akses_internet_pct', 'jumlah_kompetitor_radius_3km',
    'jarak_ke_bank_terdekat', 'penetrasi_kur_pct', 'has_digital_presence',
    'kepadatan_penduduk', 'income_per_kapita', 'jarak_ke_jalan_utama', 'jarak_ke_pasar'
]

def find_counterfactual(row_idx, target_score=70, max_steps=20):
    \"\"\"Find minimum changes to reach target score.\"\"\"
    row = df_low.iloc[row_idx].copy()
    original = row.copy()
    current_df = pd.DataFrame([row])
    current_score = predict_location_scores(current_df)[0]
    
    if current_score >= target_score:
        return None
    
    changes = {}
    step_size = 0.15  # Move 15% toward target each step
    
    for step in range(max_steps):
        # Move adjustable features toward successful mean
        for feat in adjustable_features:
            if feat in location_features:
                diff = target_means[feat] - row[feat]
                row[feat] = row[feat] + diff * step_size
        
        # Recompute derived features
        row['infra_x_income'] = row['skor_infrastruktur'] * row['income_per_kapita']
        row['avg_distance_to_facilities'] = (
            row['jarak_ke_bank_terdekat'] + row['jarak_ke_pasar'] + row['jarak_ke_jalan_utama']
        ) / 3
        row['digital_readiness_index'] = row['has_digital_presence'] * 0.5 + row['akses_internet_pct'] * 0.5
        row['financial_access_score'] = (
            row['penetrasi_kur_pct'] * 0.5 + (1 / (1 + row['jarak_ke_bank_terdekat'])) * 0.5
        )
        
        current_df = pd.DataFrame([row])
        current_score = predict_location_scores(current_df)[0]
        
        if current_score >= target_score:
            break
    
    # Calculate actual changes made
    for feat in adjustable_features:
        if feat in location_features:
            change = row[feat] - original[feat]
            if abs(change) > 0.01:
                changes[feat] = round(change, 3)
    
    return {
        'original_score': round(predict_location_scores(pd.DataFrame([original]))[0], 1),
        'final_score': round(current_score, 1),
        'steps_needed': step + 1,
        'changes': changes
    }

print("Counterfactual engine ready. Computing explanations for sample UMKMs...")"""

S5_CODE2 = """# Generate counterfactual explanations for 10 sample low-scoring UMKMs
np.random.seed(42)
sample_indices = np.random.choice(len(df_low), min(10, len(df_low)), replace=False)

print("=" * 80)
print("COUNTERFACTUAL EXPLANATIONS: What changes would improve these UMKMs?")
print("=" * 80)

counterfactual_results = []
for i, idx in enumerate(sample_indices):
    result = find_counterfactual(idx)
    if result is None:
        continue
    
    row = df_low.iloc[idx]
    print(f"\\nUMKM #{i+1}: {row['jenis_usaha']} in {row['kecamatan']}, {row['kabupaten_kota']}")
    print(f"  Score: {result['original_score']} -> {result['final_score']} (steps: {result['steps_needed']})")
    print(f"  Required changes:")
    
    for feat, change in sorted(result['changes'].items(), key=lambda x: abs(x[1]), reverse=True):
        direction = "+" if change > 0 else ""
        if 'pct' in feat or 'internet' in feat:
            print(f"    - {feat}: {direction}{change*100:.1f}%")
        elif 'jarak' in feat:
            print(f"    - {feat}: {direction}{change:.2f} km")
        else:
            print(f"    - {feat}: {direction}{change:.2f}")
    
    counterfactual_results.append({
        'kecamatan': row['kecamatan'],
        'kabupaten_kota': row['kabupaten_kota'],
        'jenis_usaha': row['jenis_usaha'],
        'original_score': result['original_score'],
        'target_score': result['final_score'],
        'n_steps': result['steps_needed'],
        'key_changes': str(result['changes'])
    })

print(f"\\nGenerated {len(counterfactual_results)} counterfactual explanations")"""

S6_MD = """## Section 6: Policy Simulation (Government)

We simulate three government intervention scenarios and quantify their impact on UMKM
scores and survival rates:

1. **KUR Expansion** - Increase penetrasi_kur by 20% in priority areas
2. **Infrastructure Investment** - Increase skor_infrastruktur by 30 in bottom kecamatan
3. **Digital Training Program** - Enable digital presence for 50% of non-digital UMKMs

For each scenario, we compute:
- Number of UMKMs improved
- Average score change
- Estimated additional survivors (using credit risk model)"""

S6_CODE1 = """# Policy A: KUR Expansion (+20% penetrasi_kur in priority areas)
print("=" * 80)
print("POLICY A: KUR Expansion - +20% penetrasi_kur_pct in low-KUR areas")
print("=" * 80)

# Priority areas: bottom 30% by penetrasi_kur
kur_threshold = df['penetrasi_kur_pct'].quantile(0.30)
priority_mask = df['penetrasi_kur_pct'] <= kur_threshold
df_priority_kur = df[priority_mask].copy()
print(f"Priority UMKMs (low KUR access): {len(df_priority_kur):,}")
print(f"Current avg penetrasi_kur: {df_priority_kur['penetrasi_kur_pct'].mean():.3f}")

# Before predictions
before_scores_a = predict_location_scores(df_priority_kur)
before_survival_a = predict_survival_proba(df_priority_kur)

# Apply intervention
df_modified_a = df_priority_kur.copy()
df_modified_a['penetrasi_kur_pct'] = df_modified_a['penetrasi_kur_pct'] + 0.20
df_modified_a['financial_access_score'] = (
    df_modified_a['penetrasi_kur_pct'] * 0.5 +
    (1 / (1 + df_modified_a['jarak_ke_bank_terdekat'])) * 0.5
)

# After predictions
after_scores_a = predict_location_scores(df_modified_a)
after_survival_a = predict_survival_proba(df_modified_a)

score_improvement_a = after_scores_a - before_scores_a
survival_improvement_a = after_survival_a - before_survival_a

print(f"\\nLocation Score Impact:")
print(f"  Avg improvement: +{score_improvement_a.mean():.2f} points")
print(f"  UMKMs improved: {(score_improvement_a > 0).sum():,} ({(score_improvement_a > 0).mean():.1%})")
print(f"  New above 70: {((after_scores_a > 70) & (before_scores_a <= 70)).sum()}")
print(f"\\nSurvival Rate Impact:")
print(f"  Avg survival probability change: +{survival_improvement_a.mean():.4f}")
print(f"  Estimated additional survivors: {int(survival_improvement_a.sum())}")"""

S6_CODE2 = """# Policy B: Infrastructure Investment (+30 skor_infra in bottom kecamatan)
print("=" * 80)
print("POLICY B: Infrastructure Investment - +30 skor_infrastruktur in bottom areas")
print("=" * 80)

# Bottom kecamatan by infrastructure
infra_threshold = df['skor_infrastruktur'].quantile(0.25)
low_infra_mask = df['skor_infrastruktur'] <= infra_threshold
df_low_infra = df[low_infra_mask].copy()
print(f"Low-infrastructure UMKMs: {len(df_low_infra):,}")
print(f"Current avg skor_infrastruktur: {df_low_infra['skor_infrastruktur'].mean():.1f}")

# Before
before_scores_b = predict_location_scores(df_low_infra)
before_survival_b = predict_survival_proba(df_low_infra)

# Apply intervention
df_modified_b = df_low_infra.copy()
df_modified_b['skor_infrastruktur'] = df_modified_b['skor_infrastruktur'] + 30
df_modified_b['infra_x_income'] = df_modified_b['skor_infrastruktur'] * df_modified_b['income_per_kapita']

# After
after_scores_b = predict_location_scores(df_modified_b)
after_survival_b = predict_survival_proba(df_modified_b)

score_improvement_b = after_scores_b - before_scores_b
survival_improvement_b = after_survival_b - before_survival_b

print(f"\\nLocation Score Impact:")
print(f"  Avg improvement: +{score_improvement_b.mean():.2f} points")
print(f"  UMKMs improved: {(score_improvement_b > 0).sum():,} ({(score_improvement_b > 0).mean():.1%})")
print(f"  New above 70: {((after_scores_b > 70) & (before_scores_b <= 70)).sum()}")
print(f"\\nSurvival Rate Impact:")
print(f"  Avg survival probability change: +{survival_improvement_b.mean():.4f}")
print(f"  Estimated additional survivors: {int(survival_improvement_b.sum())}")"""

S6_CODE3 = """# Policy C: Digital Training (has_digital_presence=1 for 50% of non-digital)
print("=" * 80)
print("POLICY C: Digital Training - Enable digital presence for 50% non-digital UMKMs")
print("=" * 80)

non_digital_mask = df['has_digital_presence'] == 0
df_non_digital = df[non_digital_mask].copy()
print(f"Non-digital UMKMs: {len(df_non_digital):,}")

# Select random 50% for training
np.random.seed(42)
train_indices = np.random.choice(len(df_non_digital), size=len(df_non_digital)//2, replace=False)
df_trained = df_non_digital.iloc[train_indices].copy()
print(f"UMKMs receiving training: {len(df_trained):,}")

# Before
before_scores_c = predict_location_scores(df_trained)
before_survival_c = predict_survival_proba(df_trained)

# Apply intervention
df_modified_c = df_trained.copy()
df_modified_c['has_digital_presence'] = 1
df_modified_c['digital_readiness_index'] = (
    df_modified_c['has_digital_presence'] * 0.5 + df_modified_c['akses_internet_pct'] * 0.5
)

# After
after_scores_c = predict_location_scores(df_modified_c)
after_survival_c = predict_survival_proba(df_modified_c)

score_improvement_c = after_scores_c - before_scores_c
survival_improvement_c = after_survival_c - before_survival_c

print(f"\\nLocation Score Impact:")
print(f"  Avg improvement: +{score_improvement_c.mean():.2f} points")
print(f"  UMKMs improved: {(score_improvement_c > 0).sum():,} ({(score_improvement_c > 0).mean():.1%})")
print(f"  New above 70: {((after_scores_c > 70) & (before_scores_c <= 70)).sum()}")
print(f"\\nSurvival Rate Impact:")
print(f"  Avg survival probability change: +{survival_improvement_c.mean():.4f}")
print(f"  Estimated additional survivors: {int(survival_improvement_c.sum())}")"""

S6_CODE4 = """# Policy Impact Summary
print("\\n" + "=" * 80)
print("POLICY SIMULATION SUMMARY")
print("=" * 80)

policy_results = pd.DataFrame([
    {
        'policy': 'KUR Expansion (+20%)',
        'target_group': f'Low-KUR areas ({len(df_priority_kur):,} UMKMs)',
        'avg_score_improvement': round(score_improvement_a.mean(), 2),
        'pct_improved': round((score_improvement_a > 0).mean() * 100, 1),
        'new_above_70': int(((after_scores_a > 70) & (before_scores_a <= 70)).sum()),
        'additional_survivors': int(survival_improvement_a.sum()),
    },
    {
        'policy': 'Infrastructure +30',
        'target_group': f'Low-infra areas ({len(df_low_infra):,} UMKMs)',
        'avg_score_improvement': round(score_improvement_b.mean(), 2),
        'pct_improved': round((score_improvement_b > 0).mean() * 100, 1),
        'new_above_70': int(((after_scores_b > 70) & (before_scores_b <= 70)).sum()),
        'additional_survivors': int(survival_improvement_b.sum()),
    },
    {
        'policy': 'Digital Training (50%)',
        'target_group': f'Non-digital UMKMs ({len(df_trained):,} trained)',
        'avg_score_improvement': round(score_improvement_c.mean(), 2),
        'pct_improved': round((score_improvement_c > 0).mean() * 100, 1),
        'new_above_70': int(((after_scores_c > 70) & (before_scores_c <= 70)).sum()),
        'additional_survivors': int(survival_improvement_c.sum()),
    }
])

print(policy_results.to_string(index=False))
print("\\nNote: 'additional_survivors' estimates the number of UMKMs that would move")
print("from predicted default to predicted survival based on credit model probability changes.")"""

S7_MD = """## Section 7: Investment Scenario Modeling

For potential investors, we model three scenarios:

1. **Digital Infrastructure Investment** - Expected improvement from investing in digital
   infrastructure in specific clusters
2. **Market Entry Analysis** - Identifying underserved kecamatan with high potential
   but low competition
3. **Portfolio Diversification** - Recommending a mix of locations across risk profiles"""

S7_CODE1 = """# Scenario A: Digital infrastructure investment impact by cluster
print("=" * 80)
print("INVESTMENT SCENARIO A: Digital Infrastructure Investment by Cluster")
print("=" * 80)

cluster_investment_results = []
for cluster_id in sorted(df['cluster_kmeans'].unique()):
    cluster_mask = df['cluster_kmeans'] == cluster_id
    cluster_name = df[cluster_mask]['cluster_name'].iloc[0]
    df_cluster = df[cluster_mask].copy()
    
    # Simulate: improve internet to 80%, enable digital presence
    df_improved = df_cluster.copy()
    df_improved['akses_internet_pct'] = np.maximum(df_improved['akses_internet_pct'], 0.80)
    df_improved['has_digital_presence'] = 1
    df_improved['digital_readiness_index'] = (
        df_improved['has_digital_presence'] * 0.5 + df_improved['akses_internet_pct'] * 0.5
    )
    
    before = predict_location_scores(df_cluster)
    after = predict_location_scores(df_improved)
    improvement = after - before
    
    cluster_investment_results.append({
        'cluster': cluster_id,
        'cluster_name': cluster_name,
        'n_umkm': len(df_cluster),
        'avg_improvement': round(improvement.mean(), 2),
        'max_improvement': round(improvement.max(), 2),
        'pct_above_70_before': round((before > 70).mean() * 100, 1),
        'pct_above_70_after': round((after > 70).mean() * 100, 1),
        'roi_indicator': round(improvement.mean() / (1 + (df_cluster['has_digital_presence'].mean())), 2)
    })

inv_df = pd.DataFrame(cluster_investment_results)
inv_df = inv_df.sort_values('roi_indicator', ascending=False)
print("\\nDigital Investment Impact by Cluster (sorted by ROI indicator):")
print(inv_df.to_string(index=False))
print("\\nROI Indicator: avg improvement normalized by existing digital adoption")
print("Higher = more room for improvement = better investment target")"""

S7_CODE2 = """# Scenario B: Market Entry - Underserved kecamatan with high potential
print("\\n" + "=" * 80)
print("INVESTMENT SCENARIO B: Market Entry - Underserved High-Potential Areas")
print("=" * 80)

# Aggregate to kecamatan level
kec_summary = df.groupby(['kabupaten_kota', 'kecamatan']).agg(
    avg_skor=('skor_potensi', 'mean'),
    avg_omset=('omset_bulanan', 'mean'),
    n_umkm=('skor_potensi', 'count'),
    avg_kompetitor=('jumlah_kompetitor_radius_3km', 'mean'),
    avg_infra=('skor_infrastruktur', 'mean'),
    survival_rate=('is_survived_3yr', 'mean'),
    avg_market_gap=('market_gap_score', 'mean'),
    avg_populasi=('populasi', 'mean')
).reset_index()

# Underserved = low competition + high potential + good market gap
kec_summary['market_entry_score'] = (
    0.30 * (kec_summary['avg_market_gap'] / kec_summary['avg_market_gap'].max()) +
    0.25 * (1 / (1 + kec_summary['avg_kompetitor'])) +
    0.25 * (kec_summary['avg_skor'] / 100) +
    0.20 * (kec_summary['avg_populasi'] / kec_summary['avg_populasi'].max())
) * 100

top_entry = kec_summary.nlargest(15, 'market_entry_score')
print("\\nTop 15 Kecamatan for Market Entry:")
print(f"{'Rank':<5}{'Kecamatan':<20}{'Kabupaten':<22}{'Entry Score':<12}{'Avg Potential':<14}{'Competition':<12}{'Market Gap':<10}")
print("-" * 95)
for rank, (_, row) in enumerate(top_entry.iterrows(), 1):
    print(f"{rank:<5}{row['kecamatan']:<20}{row['kabupaten_kota']:<22}"
          f"{row['market_entry_score']:<12.1f}{row['avg_skor']:<14.1f}"
          f"{row['avg_kompetitor']:<12.1f}{row['avg_market_gap']:<10.3f}")"""

S7_CODE3 = """# Scenario C: Portfolio Diversification across risk profiles
print("\\n" + "=" * 80)
print("INVESTMENT SCENARIO C: Portfolio Diversification Recommendation")
print("=" * 80)

# Categorize UMKMs by risk-return profile
df['predicted_score'] = predict_location_scores(df)
df['risk_category'] = pd.cut(
    df['risk_composite'],
    bins=[0, 0.3, 0.6, 1.0],
    labels=['Low Risk', 'Medium Risk', 'High Risk']
)
df['return_category'] = pd.cut(
    df['predicted_score'],
    bins=[0, 50, 70, 100],
    labels=['Low Return', 'Medium Return', 'High Return']
)

# Portfolio allocation by risk-return
portfolio = df.groupby(['risk_category', 'return_category']).agg(
    n_umkm=('predicted_score', 'count'),
    avg_score=('predicted_score', 'mean'),
    avg_survival=('is_survived_3yr', 'mean'),
    avg_omset=('omset_bulanan', 'mean')
).reset_index()

print("\\nRisk-Return Matrix:")
print(portfolio.to_string(index=False))

# Recommended portfolio mix
print("\\n\\nRECOMMENDED PORTFOLIO ALLOCATION:")
print("-" * 60)
print("Conservative (Risk-Averse):")
print("  60% Low Risk + High/Medium Return")
print("  30% Medium Risk + High Return")
print("  10% High Risk + High Return (opportunistic)")

low_high = df[(df['risk_category'] == 'Low Risk') & (df['return_category'] == 'High Return')]
med_high = df[(df['risk_category'] == 'Medium Risk') & (df['return_category'] == 'High Return')]
print(f"\\n  Low-Risk/High-Return locations: {len(low_high)} UMKMs available")
print(f"  Top kecamatan: {low_high['kecamatan'].value_counts().head(5).to_dict()}")
print(f"\\n  Medium-Risk/High-Return locations: {len(med_high)} UMKMs available")
print(f"  Top kecamatan: {med_high['kecamatan'].value_counts().head(5).to_dict()}")

# Clean up temporary columns
df.drop(columns=['predicted_score', 'risk_category', 'return_category'], inplace=True)"""

S8_MD = """## Section 8: Save Results

We save the key outputs to CSV files for use in downstream analysis and the dashboard."""

S8_CODE1 = """# Save recommendations by kecamatan
recommendations_df.to_csv('../data/recommendations_by_kecamatan.csv', index=False)
print(f"Saved: recommendations_by_kecamatan.csv ({len(recommendations_df)} rows)")

# Save what-if simulation results
whatif_results.to_csv('../data/whatif_simulation_results.csv', index=False)
print(f"Saved: whatif_simulation_results.csv ({len(whatif_results)} rows)")

# Save policy impact estimates
policy_results.to_csv('../data/policy_impact_estimates.csv', index=False)
print(f"Saved: policy_impact_estimates.csv ({len(policy_results)} rows)")

print("\\nAll output files saved to ../data/ directory.")"""

S8_CLOSING_MD = """## Summary & Limitations

### Key Findings
- **Location Recommendations:** Content-based filtering successfully identifies similar
  successful locations for each business type
- **What-If Simulations:** Infrastructure improvements show the most consistent positive
  impact across UMKMs
- **Policy Simulations:** Digital training and infrastructure investment show the highest
  return on investment in terms of UMKMs lifted above the success threshold

### Limitations
1. **Correlation vs Causation:** Model predictions assume feature relationships are causal.
   Real-world impacts may differ due to confounders.
2. **Synthetic Data:** Results are based on synthetically generated data and should be
   validated with real observations.
3. **Static Model:** Simulations assume the model remains valid under changed conditions
   (no concept drift).
4. **Feature Interactions:** Some interventions may have compounding effects not captured
   by single-feature modifications.
5. **Implementation Costs:** Simulations do not account for the cost or feasibility of
   implementing the suggested changes.

### Next Steps
- Validate key simulation results with pilot programs
- Incorporate time-series data for dynamic modeling
- Add cost-benefit analysis to policy recommendations
- Build interactive dashboard for stakeholder exploration"""

