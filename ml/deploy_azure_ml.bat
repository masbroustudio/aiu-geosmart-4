@echo off
echo =================================================================
echo  GeoUMKM Smart v4.1 - Azure Machine Learning Deployment CLI
echo =================================================================
echo.

echo [Step 1] Memastikan Azure CLI dan ekstensi Machine Learning terpasang...
call az extension add -n ml --upgrade
if %errorlevel% neq 0 (
    echo Gagal menginstal ekstensi 'ml' Azure CLI. Pastikan Azure CLI terpasang.
    exit /b %errorlevel%
)
echo Ekstensi 'ml' siap digunakan.
echo.

echo [Step 2] Membuat Resource Compute Cluster untuk pelatihan model...
call az ml compute create --name cpu-cluster --type amlcompute --size STANDARD_DS3_V2 --min-instances 0 --max-instances 4
if %errorlevel% neq 0 (
    echo Peringatan: Compute cluster mungkin sudah ada atau gagal dibuat. Melanjutkan...
)
echo.

echo [Step 3] Mendaftarkan Dataset UMKM PostgreSQL ke Azure Datastore...
call az ml data create --name umkm_dataset_postgres --version 1 --type uri_file --path "./data/umkm_dataset.csv"
if %errorlevel% neq 0 (
    echo Gagal mendaftarkan dataset ke Azure ML.
    exit /b %errorlevel%
)
echo Dataset terdaftar dengan sukses.
echo.

echo [Step 4] Mengeksekusi Job Pipeline MLOps Retraining otomatis...
call az ml job create -f azure_ml_pipeline.yml
if %errorlevel% neq 0 (
    echo Gagal memulai run pipeline retraining.
    exit /b %errorlevel%
)
echo.
echo =================================================================
echo  MLOps Pipeline berhasil dikirim ke Azure ML Studio!
echo =================================================================
pause
