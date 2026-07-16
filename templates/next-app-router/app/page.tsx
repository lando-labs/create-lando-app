// This page is a React Server Component (no 'use client').
//
// Server-safe DS leaves are imported from their per-module subpaths (the
// `./components/*` deep export, #276) so the bundler ships only the modules
// this page actually renders — not the entire client surface behind the barrel.
import { PageHeader } from '@lando-labs/lando-ds/components/PageHeader/PageHeader'
import { Card } from '@lando-labs/lando-ds/components/Card/Card'
import { CardHeader } from '@lando-labs/lando-ds/components/Card/CardHeader'
import { CardBody } from '@lando-labs/lando-ds/components/Card/CardBody'
import { CardTitle } from '@lando-labs/lando-ds/components/Card/CardTitle'
import { Badge } from '@lando-labs/lando-ds/components/Badge/Badge'
import { Button } from '@lando-labs/lando-ds/components/Button/Button'

export default function HomePage() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '4rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
      }}
    >
      <PageHeader
        title="{{PROJECT_NAME}}"
        subtitle="A Next.js app pre-wired with the Lando Labs Design System."
      />

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>You&rsquo;re all set</CardTitle>
        </CardHeader>
        <CardBody>
          <p style={{ marginBottom: '1rem' }}>
            Edit <code>app/page.tsx</code> to start building. Components, design
            tokens, dark mode, and the cascade-layer reset are already wired up.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              marginBottom: '1.5rem',
            }}
          >
            <Badge variant="success">Design tokens</Badge>
            <Badge variant="info">Dark mode</Badge>
            <Badge variant="primary">RSC-ready</Badge>
          </div>
          <Button variant="primary">Get started</Button>
        </CardBody>
      </Card>
    </main>
  )
}
