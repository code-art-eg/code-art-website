import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ProjectDetail } from '@/components/ProjectDetail'
import { getProjectBySlug } from '@/lib/collections'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) return { title: 'Project not found' }

  return {
    title: project.title,
    description: project.summary,
  }
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) notFound()

  return <ProjectDetail project={project} />
}
