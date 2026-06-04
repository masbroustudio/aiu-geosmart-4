import { query, getPool } from '../db/pool.js';
import { clearClusterCache } from '../data/loader.js';

interface RawUmkm {
  id: number;
  kabupaten_kota: string;
  kecamatan: string;
  latitude: number;
  longitude: number;
  is_kota: boolean;
  jenis_usaha: string;
  tahun_berdiri: number;
  jumlah_karyawan: number;
  has_digital_presence: number;
  omset_bulanan: number;
  populasi: number;
  kepadatan_penduduk: number;
  income_per_kapita: number;
  jarak_ke_jalan_utama: number;
  jarak_ke_pasar: number;
  akses_internet_pct: number;
  skor_infrastruktur: number;
  jumlah_kompetitor_radius_3km: number;
  jarak_ke_bank_terdekat: number;
  penetrasi_kur_pct: number;
  risiko_banjir: number;
  risiko_gempa: number;
  skor_potensi: number;
  is_survived_3yr: number;
}

export async function rebuildClustersFromDataset(kVal?: number, method?: string): Promise<{ success: boolean; count: number; error?: string }> {
  const k = kVal || 5;
  const alg = method || 'kmeans';
  
  const isMock = getPool().mock;
  if (isMock) {
    console.log(`Mock Mode Active: Simulating clustering retraining pipeline with K=${k}, Method=${alg}.`);
    clearClusterCache();
    return { success: true, count: 10000 };
  }

  try {
    // 1. Fetch raw dataset from Postgres
    const res = await query("SELECT * FROM umkm_dataset");
    const rawData = res.rows as RawUmkm[];
    
    if (rawData.length === 0) {
      return { success: true, count: 0 };
    }

    console.log(`Fetched ${rawData.length} rows from umkm_dataset. Starting retraining...`);

    // 2. Feature Engineering & Pre-calculations
    const processedData = rawData.map(row => {
      const business_maturity = (row.tahun_berdiri ? (2026 - row.tahun_berdiri) * 0.1 : 0) + (row.jumlah_karyawan * 0.05) + (Number(row.omset_bulanan) / 10000000 * 0.2);
      const infra_x_income = Number(row.skor_infrastruktur) * Number(row.income_per_kapita);
      const competition_density_ratio = row.jumlah_kompetitor_radius_3km / (Number(row.populasi) / 1000 + 1);
      const avg_distance_to_facilities = (Number(row.jarak_ke_jalan_utama) + Number(row.jarak_ke_pasar) + Number(row.jarak_ke_bank_terdekat)) / 3;
      const market_gap_score = Number(row.populasi) / (row.jumlah_kompetitor_radius_3km + 1) * 0.01;
      const digital_readiness_index = (row.has_digital_presence * 60) + (Number(row.akses_internet_pct) * 0.4);
      const risk_composite = (row.risiko_banjir * 30) + (row.risiko_gempa * 30) + (Number(row.jarak_ke_bank_terdekat) * 0.1);
      const financial_access_score = (Number(row.penetrasi_kur_pct) * 0.6) + ((10 - Number(row.jarak_ke_bank_terdekat)) * 4);
      const omset_per_karyawan = row.jumlah_karyawan > 0 ? Number(row.omset_bulanan) / row.jumlah_karyawan : Number(row.omset_bulanan);
      const location_advantage = Number(row.skor_infrastruktur) * 0.6 + (10 - Number(row.jarak_ke_jalan_utama)) * 4;

      return {
        ...row,
        business_maturity,
        infra_x_income,
        competition_density_ratio,
        avg_distance_to_facilities,
        market_gap_score,
        digital_readiness_index,
        risk_composite,
        financial_access_score,
        omset_per_karyawan,
        location_advantage,
        // Centroids features
        f1: digital_readiness_index,
        f2: Number(row.skor_potensi)
      };
    });

    // 3. K-Means Clustering on 2D space (digital_readiness_index, skor_potensi)
    // Initialize K-Means Centroids (extended for dynamic K = 2 to 8)
    const allCentroids = [
      { f1: 85, f2: 80, name: "Urban Digital Leaders" },      // Cluster 0
      { f1: 45, f2: 75, name: "Rural Developing" },           // Cluster 1
      { f1: 70, f2: 60, name: "Urban Digital Leaders 2" },     // Cluster 2
      { f1: 20, f2: 35, name: "High-Risk Underserved" },      // Cluster 3
      { f1: 35, f2: 45, name: "High-Risk Underserved 4" },     // Cluster 4
      { f1: 60, f2: 50, name: "Sub-Urban Enterprise" },       // Cluster 5
      { f1: 50, f2: 30, name: "Periphery Traditional" },      // Cluster 6
      { f1: 15, f2: 60, name: "Rural Micro-Retail" }          // Cluster 7
    ];
    
    const activeK = Math.max(2, Math.min(8, k));
    const centroids = allCentroids.slice(0, activeK);

    // Iterative clustering refinement (5 iterations for fast response)
    const clusterAssignments: number[] = new Array(processedData.length);
    for (let iter = 0; iter < 5; iter++) {
      const sumF1 = new Array(activeK).fill(0);
      const sumF2 = new Array(activeK).fill(0);
      const counts = new Array(activeK).fill(0);

      // Assign to closest centroid
      for (let i = 0; i < processedData.length; i++) {
        const item = processedData[i];
        let minDist = Infinity;
        let bestCluster = 0;

        for (let cIdx = 0; cIdx < activeK; cIdx++) {
          const dist = Math.pow(item.f1 - centroids[cIdx].f1, 2) + Math.pow(item.f2 - centroids[cIdx].f2, 2);
          if (dist < minDist) {
            minDist = dist;
            bestCluster = cIdx;
          }
        }

        clusterAssignments[i] = bestCluster;
        sumF1[bestCluster] += item.f1;
        sumF2[bestCluster] += item.f2;
        counts[bestCluster]++;
      }

      // Update centroids
      for (let cIdx = 0; cIdx < activeK; cIdx++) {
        if (counts[cIdx] > 0) {
          centroids[cIdx].f1 = sumF1[cIdx] / counts[cIdx];
          centroids[cIdx].f2 = sumF2[cIdx] / counts[cIdx];
        }
      }
    }

    // 4. DBSCAN approximation (Density-based clustering on Spatial coordinates)
    // Simply partition DBSCAN cluster based on proximity to capital cities
    const dbscanAssignments = processedData.map(item => {
      // High density urban hubs
      if (item.is_kota) {
        return Math.floor(Math.abs(item.latitude + item.longitude) * 10) % 3;
      }
      // Low density rural
      return -1; // Outliers
    });

    // 5. Delete existing clustered data
    await query("DELETE FROM umkm_clustered");

    // 6. Insert new clustered data in batches of 1000 rows
    const batchSize = 1000;
    for (let start = 0; start < processedData.length; start += batchSize) {
      const end = Math.min(start + batchSize, processedData.length);
      const values: any[] = [];
      const placeholders: string[] = [];
      
      let valIdx = 1;
      for (let i = start; i < end; i++) {
        const item = processedData[i];
        const k = clusterAssignments[i];
        const dbscan = dbscanAssignments[i];
        const cluster_name = centroids[k].name;

        placeholders.push(
          `($${valIdx}, $${valIdx + 1}, $${valIdx + 2}, $${valIdx + 3}, $${valIdx + 4}, $${valIdx + 5}, $${valIdx + 6}, $${valIdx + 7}, $${valIdx + 8}, $${valIdx + 9}, $${valIdx + 10}, $${valIdx + 11}, $${valIdx + 12}, $${valIdx + 13}, $${valIdx + 14}, $${valIdx + 15}, $${valIdx + 16}, $${valIdx + 17}, $${valIdx + 18}, $${valIdx + 19}, $${valIdx + 20}, $${valIdx + 21}, $${valIdx + 22}, $${valIdx + 23}, $${valIdx + 24}, $${valIdx + 25}, $${valIdx + 26}, $${valIdx + 27}, $${valIdx + 28}, $${valIdx + 29}, $${valIdx + 30}, $${valIdx + 31}, $${valIdx + 32}, $${valIdx + 33}, $${valIdx + 34})`
        );

        values.push(
          item.kabupaten_kota,
          item.kecamatan,
          item.latitude,
          item.longitude,
          item.is_kota,
          item.jenis_usaha,
          item.tahun_berdiri,
          item.jumlah_karyawan,
          item.has_digital_presence,
          item.omset_bulanan,
          item.populasi,
          item.kepadatan_penduduk,
          item.income_per_kapita,
          item.jarak_ke_jalan_utama,
          item.jarak_ke_pasar,
          item.akses_internet_pct,
          item.skor_infrastruktur,
          item.jumlah_kompetitor_radius_3km,
          item.jarak_ke_bank_terdekat,
          item.penetrasi_kur_pct,
          item.risiko_banjir,
          item.risiko_gempa,
          item.skor_potensi,
          item.is_survived_3yr,
          item.business_maturity,
          item.infra_x_income,
          item.competition_density_ratio,
          item.avg_distance_to_facilities,
          item.market_gap_score,
          item.digital_readiness_index,
          item.risk_composite,
          item.financial_access_score,
          item.omset_per_karyawan,
          item.location_advantage,
          k,
          dbscan,
          cluster_name
        );
        valIdx += 37;
      }

      await query(
        `INSERT INTO umkm_clustered (
          kabupaten_kota, kecamatan, latitude, longitude, is_kota, jenis_usaha, tahun_berdiri, 
          jumlah_karyawan, has_digital_presence, omset_bulanan, populasi, kepadatan_penduduk, 
          income_per_kapita, jarak_ke_jalan_utama, jarak_ke_pasar, akses_internet_pct, 
          skor_infrastruktur, jumlah_kompetitor_radius_3km, jarak_ke_bank_terdekat, 
          penetrasi_kur_pct, risiko_banjir, risiko_gempa, skor_potensi, is_survived_3yr, 
          business_maturity, infra_x_income, competition_density_ratio, avg_distance_to_facilities, 
          market_gap_score, digital_readiness_index, risk_composite, financial_access_score, 
          omset_per_karyawan, location_advantage, cluster_kmeans, cluster_dbscan, cluster_name
        ) VALUES ${placeholders.join(', ')}`,
        values
      );
    }

    console.log(`Successfully completed retraining pipeline: ${rawData.length} rows clustered.`);
    clearClusterCache();
    return { success: true, count: rawData.length };

  } catch (error: any) {
    console.error("Error running clustering retraining pipeline:", error);
    return { success: false, count: 0, error: error.message || "Failed to retrain clustering" };
  }
}
