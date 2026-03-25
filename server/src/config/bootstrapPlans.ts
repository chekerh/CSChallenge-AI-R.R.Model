import Plan from '../models/Plan';

export async function bootstrapDefaultPlans(): Promise<void> {
  const existing = await Plan.countDocuments({});
  if (existing > 0) return;

  await Plan.create([
    {
      code: 'free',
      name: 'Free',
      description: 'Essai du produit avec fonctionnalités limitées',
      currency: 'TND',
      price_monthly: 0,
      is_public: true,
      sort_order: 1,
      features: ['resume.ai_process'],
      limits: {
        cv_diagnosis_runs_per_month: 20,
        cv_job_matches_per_month: 0,
        cv_rewrite_sections_per_month: 0,
        resume_ai_process_runs_per_month: 20,
      },
    },
    {
      code: 'pro',
      name: 'Pro',
      description: 'Diagnostic complet, job match, réécriture IA, quotas élevés',
      currency: 'TND',
      price_monthly: 39,
      is_public: true,
      sort_order: 2,
      features: [
        'resume.ai_process',
        'cv.job_match',
        'cv.rewrite_section',
        'cv.diagnosis.full',
      ],
      limits: {
        cv_diagnosis_runs_per_month: 500,
        cv_job_matches_per_month: 300,
        cv_rewrite_sections_per_month: 300,
        resume_ai_process_runs_per_month: 500,
      },
    },
  ]);
  // eslint-disable-next-line no-console
  console.log('[bootstrap] Created default plans: free, pro');
}

