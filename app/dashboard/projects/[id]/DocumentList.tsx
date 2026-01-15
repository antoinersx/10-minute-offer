'use client'

import { useState } from 'react'
import type { Database } from '@/lib/types/database'

type Document = Database['public']['Tables']['documents']['Row']

interface DocumentListProps {
  documents: Document[]
  projectId: string
  projectStatus: string
}

export default function DocumentList({ documents, projectId, projectStatus }: DocumentListProps) {
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null)
  const [downloadingZip, setDownloadingZip] = useState(false)
  const [regeneratingDoc, setRegeneratingDoc] = useState<string | null>(null)

  const handleDownloadPDF = async (documentId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDownloadingPdf(documentId)
    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId, projectId }),
      })

      if (!response.ok) {
        throw new Error('Failed to download PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : 'document.pdf'
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Failed to download PDF. Please try again.')
    } finally {
      setDownloadingPdf(null)
    }
  }

  const handleDownloadZip = async () => {
    setDownloadingZip(true)
    try {
      const response = await fetch('/api/export-zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      })

      if (!response.ok) {
        throw new Error('Failed to download ZIP')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : 'offer-package.zip'
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading ZIP:', error)
      alert('Failed to download ZIP. Please try again.')
    } finally {
      setDownloadingZip(false)
    }
  }

  const handleRegenerate = async (docType: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm('Are you sure you want to regenerate this document? The current version will be replaced.')) {
      return
    }

    setRegeneratingDoc(docType)
    try {
      const response = await fetch('/api/regenerate-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId, docType }),
      })

      if (!response.ok) {
        throw new Error('Failed to start regeneration')
      }

      alert('Regeneration started! The page will refresh automatically when complete.')

      // Start polling for updates
      const pollInterval = setInterval(async () => {
        window.location.reload()
      }, 5000)

      // Clean up polling after 3 minutes
      setTimeout(() => clearInterval(pollInterval), 180000)
    } catch (error) {
      console.error('Error regenerating document:', error)
      alert('Failed to regenerate document. Please try again.')
      setRegeneratingDoc(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      case 'generating':
        return (
          <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering - in production you'd use a proper markdown library
    return content.split('\n').map((line, i) => {
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-2xl font-bold mt-6 mb-4">{line.slice(2)}</h1>
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-bold mt-4 mb-3">{line.slice(3)}</h2>
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-semibold mt-3 mb-2">{line.slice(4)}</h3>
      }
      if (line.startsWith('- ')) {
        return <li key={i} className="ml-4">{line.slice(2)}</li>
      }
      if (line.trim() === '') {
        return <br key={i} />
      }
      return <p key={i} className="mb-2">{line}</p>
    })
  }

  const completedDocuments = documents.filter(doc => doc.status === 'complete')
  const hasCompletedDocuments = completedDocuments.length > 0

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold">Generated Documents</h2>
        {hasCompletedDocuments && (
          <button
            onClick={handleDownloadZip}
            disabled={downloadingZip}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {downloadingZip ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Downloading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download All (ZIP)
              </>
            )}
          </button>
        )}
      </div>

      {projectStatus === 'generating' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <div>
              <p className="font-semibold text-blue-900">Generation in progress...</p>
              <p className="text-sm text-blue-700">This page will auto-refresh as documents are completed.</p>
            </div>
          </div>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <p className="text-gray-600">Click "Generate Offer" to create your documents.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div
                className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    {getStatusIcon(doc.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-400">
                          {String(doc.doc_number).padStart(2, '0')}
                        </span>
                        <h3 className="text-base sm:text-lg font-semibold truncate">{doc.title}</h3>
                      </div>
                      <p className="text-sm text-gray-500 capitalize">{doc.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {doc.status === 'complete' && doc.content && (
                      <>
                        <button
                          onClick={(e) => handleRegenerate(doc.doc_type, e)}
                          disabled={regeneratingDoc === doc.doc_type}
                          className="px-3 py-1 text-xs sm:text-sm bg-amber-100 text-amber-700 rounded hover:bg-amber-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {regeneratingDoc === doc.doc_type ? (
                            <>
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span className="hidden sm:inline">Regenerating...</span>
                              <span className="sm:hidden">...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span className="hidden sm:inline">Regenerate</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={(e) => handleDownloadPDF(doc.id, e)}
                          disabled={downloadingPdf === doc.id}
                          className="px-3 py-1 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {downloadingPdf === doc.id ? (
                            <>
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span className="hidden sm:inline">Downloading...</span>
                              <span className="sm:hidden">...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              PDF
                            </>
                          )}
                        </button>
                      </>
                    )}
                    {doc.content && (
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                          expandedDoc === doc.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {expandedDoc === doc.id && doc.content && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <div className="prose max-w-none">
                    {renderMarkdown(doc.content)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
