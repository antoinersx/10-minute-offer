import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CreateProjectButton from './CreateProjectButton'
import OnboardingWrapper from './OnboardingWrapper'
import UpgradeButton from './UpgradeButton'
import ManageSubscriptionButton from './ManageSubscriptionButton'
import { getGenerationLimits } from '@/lib/usage/limits'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch user's projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch generation limits
  const limits = await getGenerationLimits(user.id)

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <OnboardingWrapper
        userId={user.id}
        showOnboarding={!profile?.onboarding_complete}
        profileData={profile}
      />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </form>
        </div>

        {limits && (
          <div className="mb-8 bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  {profile?.plan === 'pro' ? 'Pro Plan' : 'Pay As You Go'}
                </h3>
                <p className="text-sm text-gray-600">
                  {limits.allowed === 0
                    ? 'No reports yet - purchase to get started'
                    : `${limits.remaining} of ${limits.allowed} report${limits.allowed !== 1 ? 's' : ''} remaining${profile?.plan === 'pro' ? ' this month' : ''}`
                  }
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold">{limits.remaining}</div>
                  <div className="text-xs text-gray-500">remaining</div>
                </div>
                {profile?.plan === 'pro' ? (
                  <>
                    <UpgradeButton variant="secondary" />
                    <ManageSubscriptionButton />
                  </>
                ) : (
                  <UpgradeButton />
                )}
              </div>
            </div>
            {limits.remaining > 0 && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full transition-all"
                    style={{ width: `${(limits.remaining / limits.allowed) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold">Your Projects</h2>
            <CreateProjectButton profileData={profile} />
          </div>

          {!projects || projects.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first market research report to get started. We'll generate comprehensive insights in minutes.
                </p>
                <CreateProjectButton profileData={profile} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold line-clamp-2">{project.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        project.status === 'complete'
                          ? 'bg-green-100 text-green-800'
                          : project.status === 'generating'
                          ? 'bg-blue-100 text-blue-800'
                          : project.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : project.status === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                  {project.business_description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {project.business_description}
                    </p>
                  )}
                  <div className="text-xs text-gray-400">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
