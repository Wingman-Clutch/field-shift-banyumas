// AI-assisted: generated with Claude (Anthropic). See README, "Use of AI".
import type { ReactNode } from 'react'
import type { BoundaryMetadata, PowerIndex } from '../lib/types.ts'

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-stone-300 underline-offset-2 hover:text-stone-700">
      {children}
    </a>
  )
}

interface AttributionFooterProps {
  boundary?: BoundaryMetadata
  power?: PowerIndex['metadata']
}

export default function AttributionFooter({ boundary, power }: AttributionFooterProps) {
  return (
    <footer className="space-y-1.5 border-t border-stone-200 pt-3 text-[11px] leading-snug text-stone-500">
      <p>
        <span className="font-medium text-stone-600">Climate data: </span>
        <ExternalLink href="https://power.larc.nasa.gov/">NASA POWER</ExternalLink>. {power?.acknowledgment}
      </p>
      <p>
        <span className="font-medium text-stone-600">Boundaries: </span>
        <ExternalLink href="https://www.geoboundaries.org/">geoBoundaries</ExternalLink> (IDN ADM3
        {boundary ? `, source: ${boundary.boundarySource}, ${boundary.boundaryYearRepresented}` : ''}).{' '}
        {boundary ? `License: ${boundary.license}.` : ''}
      </p>
      <p>
        <span className="font-medium text-stone-600">Basemap: </span>©{' '}
        <ExternalLink href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</ExternalLink>, ODbL.
      </p>
      <p>
        <span className="font-medium text-stone-600">AI-assisted: </span>
        scaffold, data scripts and UI code written with Claude (Anthropic). Details in the{' '}
        <ExternalLink href="https://github.com/Wingman-Clutch/field-shift-banyumas#use-of-ai">README</ExternalLink>.
      </p>
    </footer>
  )
}
