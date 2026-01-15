import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jsPDF } from 'jspdf'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { documentId, projectId } = body

    if (!documentId || !projectId) {
      return NextResponse.json(
        { error: 'Document ID and Project ID are required' },
        { status: 400 }
      )
    }

    // Fetch the document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('project_id', projectId)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      )
    }

    if (!document.content) {
      return NextResponse.json(
        { error: 'Document has no content' },
        { status: 400 }
      )
    }

    // Generate PDF
    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    const maxWidth = pageWidth - 2 * margin
    let yPosition = margin

    // Add title
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    const titleLines = pdf.splitTextToSize(document.title, maxWidth)
    titleLines.forEach((line: string) => {
      if (yPosition + 10 > pageHeight - margin) {
        pdf.addPage()
        yPosition = margin
      }
      pdf.text(line, margin, yPosition)
      yPosition += 10
    })

    yPosition += 10

    // Process content line by line
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')

    const lines = document.content.split('\n')

    for (const line of lines) {
      // Check if we need a new page
      if (yPosition > pageHeight - margin) {
        pdf.addPage()
        yPosition = margin
      }

      if (line.trim() === '') {
        yPosition += 5
        continue
      }

      // Handle different markdown elements
      if (line.startsWith('# ')) {
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        const text = line.slice(2)
        const textLines = pdf.splitTextToSize(text, maxWidth)
        textLines.forEach((textLine: string) => {
          if (yPosition + 8 > pageHeight - margin) {
            pdf.addPage()
            yPosition = margin
          }
          pdf.text(textLine, margin, yPosition)
          yPosition += 8
        })
        yPosition += 3
        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'normal')
      } else if (line.startsWith('## ')) {
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        const text = line.slice(3)
        const textLines = pdf.splitTextToSize(text, maxWidth)
        textLines.forEach((textLine: string) => {
          if (yPosition + 7 > pageHeight - margin) {
            pdf.addPage()
            yPosition = margin
          }
          pdf.text(textLine, margin, yPosition)
          yPosition += 7
        })
        yPosition += 3
        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'normal')
      } else if (line.startsWith('### ')) {
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        const text = line.slice(4)
        const textLines = pdf.splitTextToSize(text, maxWidth)
        textLines.forEach((textLine: string) => {
          if (yPosition + 6 > pageHeight - margin) {
            pdf.addPage()
            yPosition = margin
          }
          pdf.text(textLine, margin, yPosition)
          yPosition += 6
        })
        yPosition += 2
        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'normal')
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        const text = '• ' + line.slice(2)
        const textLines = pdf.splitTextToSize(text, maxWidth - 5)
        textLines.forEach((textLine: string, index: number) => {
          if (yPosition + 6 > pageHeight - margin) {
            pdf.addPage()
            yPosition = margin
          }
          pdf.text(textLine, margin + (index > 0 ? 5 : 0), yPosition)
          yPosition += 6
        })
      } else if (line.match(/^\d+\. /)) {
        const textLines = pdf.splitTextToSize(line, maxWidth - 5)
        textLines.forEach((textLine: string, index: number) => {
          if (yPosition + 6 > pageHeight - margin) {
            pdf.addPage()
            yPosition = margin
          }
          pdf.text(textLine, margin + (index > 0 ? 5 : 0), yPosition)
          yPosition += 6
        })
      } else {
        // Regular paragraph
        const textLines = pdf.splitTextToSize(line, maxWidth)
        textLines.forEach((textLine: string) => {
          if (yPosition + 6 > pageHeight - margin) {
            pdf.addPage()
            yPosition = margin
          }
          pdf.text(textLine, margin, yPosition)
          yPosition += 6
        })
      }
    }

    // Add page numbers
    const totalPages = pdf.internal.pages.length - 1 // pages array starts at index 1
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    // Create filename: [project-name]-[document-name].pdf
    const projectName = project.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    const docName = document.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    const filename = `${projectName}-${docName}.pdf`

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
