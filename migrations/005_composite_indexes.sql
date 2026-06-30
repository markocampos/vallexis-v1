-- 005_composite_indexes.sql: composite indexes for optimized lists
CREATE INDEX IF NOT EXISTS idx_deployments_project_id_created_at ON deployments(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_audits_user_id_created_at ON seo_audits(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_storage_objects_user_id_created_at ON storage_objects(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bandwidth_usage_user_id_recorded_at ON bandwidth_usage(user_id, recorded_at DESC);
