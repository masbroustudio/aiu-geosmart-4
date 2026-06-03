'use client';

import { useState, useEffect } from 'react';
import { Users, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import KPICard from '@/components/dashboard/KPICard';
import FilteredMapView from '@/components/dashboard/FilteredMapView';
import ScoreDistributionChart from '@/components/dashboard/ScoreDistributionChart';
import ClusterDonutChart from '@/components/dashboard/ClusterDonutChart';
import TopKabupatenChart from '@/components/dashboard/TopKabupatenChart';
import { overviewData as staticOverview, kecamatanMapData as staticMapData } from '@/lib/static-data';
import { fetchOverview, fetchKecamatan } from '@/lib/api';
import DownloadCSVButton from '@/components/ui/DownloadCSVButton';

export default function OverviewPage() {
  const [overviewData, setOverviewData] = useState(staticOverview);
  const [kecamatanMapData, setKecamatanMapData] = useState(staticMapData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const [overview, mapData] = await Promise.all([
          fetchOverview(),
          fetchKecamatan(),
        ]);
        if (!cancelled) {
          setOverviewData(overview);
          setKecamatanMapData(mapData);
        }
      } catch {
        // Keep static data on error
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 mt-12 lg:mt-0">
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-1/2 mb-3" />
              <div className="h-8 bg-slate-700 rounded w-3/4" />
            </div>
          ))}
        </div>
        <div className="glass-card p-6 h-[300px] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-12 lg:mt-0">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <div className="flex flex-wrap gap-2">
          <DownloadCSVButton
            data={overviewData.score_distribution as unknown as Record<string, unknown>[]}
            filename="geoumkm-score-distribution"
            label="Export Score Distribution"
          />
          <DownloadCSVButton
            data={overviewData.top_kabupaten as unknown as Record<string, unknown>[]}
            filename="geoumkm-top-kabupaten"
            label="Export Top Kabupaten"
          />
          <DownloadCSVButton
            data={overviewData.cluster_distribution as unknown as Record<string, unknown>[]}
            filename="geoumkm-cluster-distribution"
            label="Export Cluster Distribution"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Users}
          label="Total UMKM"
          value={overviewData.total_umkm.toLocaleString()}
          subtitle="West Java region"
          color="#3B82F6"
          trend="up"
          delay={0}
        />
        <KPICard
          icon={TrendingUp}
          label="Avg Score"
          value={overviewData.avg_score.toFixed(1)}
          subtitle="Skor potensi rata-rata"
          color="#10B981"
          trend="up"
          delay={0.1}
        />
        <KPICard
          icon={AlertTriangle}
          label="High Risk Areas"
          value={overviewData.high_risk_count}
          subtitle="Kecamatan skor < 30"
          color="#EF4444"
          trend="down"
          delay={0.2}
        />
        <KPICard
          icon={Activity}
          label="Survival Rate"
          value={`${overviewData.survival_rate}%`}
          subtitle="Rata-rata tingkat kelangsungan"
          color="#8B5CF6"
          trend="up"
          delay={0.3}
        />
      </div>

      {/* Map */}
      <FilteredMapView data={kecamatanMapData} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScoreDistributionChart data={overviewData.score_distribution} />
        <ClusterDonutChart data={overviewData.cluster_distribution} />
      </div>

      <TopKabupatenChart data={overviewData.top_kabupaten} />
    </div>
  );
}
