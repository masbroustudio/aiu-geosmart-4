import * as fs from "fs";
import * as path from "path";
import Papa from "papaparse";
import { query, getPool } from "./pool.js";

// Resolves data file paths relative to this file
function getDataPath(relativePath: string): string {
  // Try multiple paths to find ml/data folder
  const possiblePaths = [
    path.resolve(__dirname, "../../..", "ml/data", relativePath),
    path.resolve(__dirname, "../../../..", "ml/data", relativePath),
    path.resolve(process.cwd(), "ml/data", relativePath),
    path.resolve(process.cwd(), "../ml/data", relativePath),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return possiblePaths[0]; // fallback
}

function loadCSV<T>(filename: string): T[] {
  const filePath = getDataPath(filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`CSV file not found for seeding: ${filePath}`);
    return [];
  }
  const content = fs.readFileSync(filePath, "utf-8");
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
  });
  return result.data as T[];
}

const toNumber = (val: any): number => {
  if (val === undefined || val === null || val === '') return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

const toBoolean = (val: any): boolean => {
  if (val === undefined || val === null) return false;
  if (typeof val === 'boolean') return val;
  const str = String(val).toLowerCase().trim();
  return str === 'true' || str === '1' || str === 'yes' || str === 'ya';
};

export async function seedDatabase() {
  const p = getPool();
  if (p.mock) {
    console.log("Seeding skipped: Mock mode active.");
    return;
  }

  try {
    console.log("Checking if database seeding is required...");

    // 1. Seed umkm_dataset
    const datasetCheck = await query("SELECT COUNT(*) FROM umkm_dataset");
    const datasetCount = parseInt(datasetCheck.rows[0].count, 10);

    if (datasetCount === 0) {
      console.log("Seeding umkm_dataset table...");
      const rawDataset = loadCSV<Record<string, string>>("umkm_dataset.csv");
      
      if (rawDataset.length > 0) {
        console.log(`Loaded ${rawDataset.length} rows from umkm_dataset.csv. Inserting in batches...`);
        const batchSize = 250;
        
        for (let i = 0; i < rawDataset.length; i += batchSize) {
          const batch = rawDataset.slice(i, i + batchSize);
          const values: any[] = [];
          const placeholders: string[] = [];
          
          batch.forEach((row, idx) => {
            const offset = idx * 24;
            placeholders.push(`(
              $${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5},
              $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10},
              $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15},
              $${offset + 16}, $${offset + 17}, $${offset + 18}, $${offset + 19}, $${offset + 20},
              $${offset + 21}, $${offset + 22}, $${offset + 23}, $${offset + 24}
            )`);
            
            values.push(
              row.kabupaten_kota || "",
              row.kecamatan || "",
              toNumber(row.latitude),
              toNumber(row.longitude),
              toBoolean(row.is_kota),
              row.jenis_usaha || "",
              toNumber(row.tahun_berdiri),
              toNumber(row.jumlah_karyawan),
              toNumber(row.has_digital_presence),
              toNumber(row.omset_bulanan),
              toNumber(row.populasi),
              toNumber(row.kepadatan_penduduk),
              toNumber(row.income_per_kapita),
              toNumber(row.jarak_ke_jalan_utama),
              toNumber(row.jarak_ke_pasar),
              toNumber(row.akses_internet_pct),
              toNumber(row.skor_infrastruktur),
              toNumber(row.jumlah_kompetitor_radius_3km),
              toNumber(row.jarak_ke_bank_terdekat),
              toNumber(row.penetrasi_kur_pct),
              toNumber(row.risiko_banjir),
              toNumber(row.risiko_gempa),
              toNumber(row.skor_potensi),
              toNumber(row.is_survived_3yr)
            );
          });
          
          const sql = `
            INSERT INTO umkm_dataset (
              kabupaten_kota, kecamatan, latitude, longitude, is_kota, jenis_usaha,
              tahun_berdiri, jumlah_karyawan, has_digital_presence, omset_bulanan,
              populasi, kepadatan_penduduk, income_per_kapita, jarak_ke_jalan_utama,
              jarak_ke_pasar, akses_internet_pct, skor_infrastruktur,
              jumlah_kompetitor_radius_3km, jarak_ke_bank_terdekat, penetrasi_kur_pct,
              risiko_banjir, risiko_gempa, skor_potensi, is_survived_3yr
            ) VALUES ${placeholders.join(", ")}
          `;
          await query(sql, values);
        }
        console.log("umkm_dataset table seeded successfully.");
      }
    } else {
      console.log(`umkm_dataset table already contains ${datasetCount} rows. Seeding skipped.`);
    }

    // 2. Seed umkm_clustered
    const clusteredCheck = await query("SELECT COUNT(*) FROM umkm_clustered");
    const clusteredCount = parseInt(clusteredCheck.rows[0].count, 10);

    if (clusteredCount === 0) {
      console.log("Seeding umkm_clustered table...");
      const rawClustered = loadCSV<Record<string, string>>("umkm_clustered.csv");
      
      if (rawClustered.length > 0) {
        console.log(`Loaded ${rawClustered.length} rows from umkm_clustered.csv. Inserting in batches...`);
        const batchSize = 150; // Smaller batch size due to more parameters (37 columns)
        
        for (let i = 0; i < rawClustered.length; i += batchSize) {
          const batch = rawClustered.slice(i, i + batchSize);
          const values: any[] = [];
          const placeholders: string[] = [];
          
          batch.forEach((row, idx) => {
            const offset = idx * 37;
            placeholders.push(`(
              $${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5},
              $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10},
              $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15},
              $${offset + 16}, $${offset + 17}, $${offset + 18}, $${offset + 19}, $${offset + 20},
              $${offset + 21}, $${offset + 22}, $${offset + 23}, $${offset + 24}, $${offset + 25},
              $${offset + 26}, $${offset + 27}, $${offset + 28}, $${offset + 29}, $${offset + 30},
              $${offset + 31}, $${offset + 32}, $${offset + 33}, $${offset + 34}, $${offset + 35},
              $${offset + 36}, $${offset + 37}
            )`);
            
            values.push(
              row.kabupaten_kota || "",
              row.kecamatan || "",
              toNumber(row.latitude),
              toNumber(row.longitude),
              toBoolean(row.is_kota),
              row.jenis_usaha || "",
              toNumber(row.tahun_berdiri),
              toNumber(row.jumlah_karyawan),
              toNumber(row.has_digital_presence),
              toNumber(row.omset_bulanan),
              toNumber(row.populasi),
              toNumber(row.kepadatan_penduduk),
              toNumber(row.income_per_kapita),
              toNumber(row.jarak_ke_jalan_utama),
              toNumber(row.jarak_ke_pasar),
              toNumber(row.akses_internet_pct),
              toNumber(row.skor_infrastruktur),
              toNumber(row.jumlah_kompetitor_radius_3km),
              toNumber(row.jarak_ke_bank_terdekat),
              toNumber(row.penetrasi_kur_pct),
              toNumber(row.risiko_banjir),
              toNumber(row.risiko_gempa),
              toNumber(row.skor_potensi),
              toNumber(row.is_survived_3yr),
              toNumber(row.business_maturity),
              toNumber(row.infra_x_income),
              toNumber(row.competition_density_ratio),
              toNumber(row.avg_distance_to_facilities),
              toNumber(row.market_gap_score),
              toNumber(row.digital_readiness_index),
              toNumber(row.risk_composite),
              toNumber(row.financial_access_score),
              toNumber(row.omset_per_karyawan),
              toNumber(row.location_advantage),
              toNumber(row.cluster_kmeans),
              toNumber(row.cluster_dbscan),
              row.cluster_name || ""
            );
          });
          
          const sql = `
            INSERT INTO umkm_clustered (
              kabupaten_kota, kecamatan, latitude, longitude, is_kota, jenis_usaha,
              tahun_berdiri, jumlah_karyawan, has_digital_presence, omset_bulanan,
              populasi, kepadatan_penduduk, income_per_kapita, jarak_ke_jalan_utama,
              jarak_ke_pasar, akses_internet_pct, skor_infrastruktur,
              jumlah_kompetitor_radius_3km, jarak_ke_bank_terdekat, penetrasi_kur_pct,
              risiko_banjir, risiko_gempa, skor_potensi, is_survived_3yr,
              business_maturity, infra_x_income, competition_density_ratio,
              avg_distance_to_facilities, market_gap_score, digital_readiness_index,
              risk_composite, financial_access_score, omset_per_karyawan,
              location_advantage, cluster_kmeans, cluster_dbscan, cluster_name
            ) VALUES ${placeholders.join(", ")}
          `;
          await query(sql, values);
        }
        console.log("umkm_clustered table seeded successfully.");
      }
    } else {
      console.log(`umkm_clustered table already contains ${clusteredCount} rows. Seeding skipped.`);
    }

  } catch (error) {
    console.error("Failed to seed dataset tables:", error);
  }
}
