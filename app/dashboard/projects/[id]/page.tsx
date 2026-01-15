import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GenerateButton from './GenerateButton'
import DocumentList from './DocumentList'
import { getGenerationLimits } from '@/lib/usage/limits'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (projectError || !project) {
    redirect('/dashboard')
  }

  // Fetch documents
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('project_id', id)
    .order('doc_number', { ascending: true })

  // Fetch generation limits
  const limits = await getGenerationLimits(user.id)

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <a
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </a>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{project.name}</h1>
              {project.business_description && (
                <p className="text-gray-600 mb-4">{project.business_description}</p>
              )}
              <div className="flex flex-wrap gap-2 sm:gap-4 text-sm text-gray-500">
                <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                <span className={`px-2 py-1 rounded-full font-semibold ${
                  project.status === 'complete'
                    ? 'bg-green-100 text-green-800'
                    : project.status === 'generating'
                    ? 'bg-blue-100 text-blue-800'
                    : project.status === 'failed'
                    ? 'bg-red-100 text-red-800'
                    : project.status === 'partial'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {project.status}
                </span>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <GenerateButton
                projectId={id}
                status={project.status}
                limits={limits}
                plan={profile?.plan || 'free'}
              />
            </div>
          </div>
        </div>

        <DocumentList documents={documents || []} projectId={id} projectStatus={project.status} />
      </div>
    </div>
  )
}
