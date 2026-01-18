'use client';

import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Copy, CheckCircle2, Github, BookOpen, Terminal, Code2, Zap, Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';
import { useState } from 'react';

const SDK_CONFIG = {
  python: {
    name: 'Python',
    icon: '🐍',
    color: 'from-blue-500 to-green-500',
    package: 'aidorag',
    install: 'pip install aidorag',
    github: 'https://github.com/aidorag/python-sdk',
    docs: 'https://pypi.org/project/aidorag/',
  },
  javascript: {
    name: 'JavaScript / TypeScript',
    icon: '🟨',
    color: 'from-yellow-500 to-yellow-600',
    package: '@aidorag/sdk',
    install: 'npm install @aidorag/sdk',
    github: 'https://github.com/aidorag/javascript-sdk',
    docs: 'https://www.npmjs.com/package/@aidorag/sdk',
  },
  go: {
    name: 'Go',
    icon: '🔵',
    color: 'from-cyan-500 to-blue-500',
    package: 'github.com/aidorag/go-sdk',
    install: 'go get github.com/aidorag/go-sdk',
    github: 'https://github.com/aidorag/go-sdk',
    docs: 'https://pkg.go.dev/github.com/aidorag/go-sdk',
  },
  ruby: {
    name: 'Ruby',
    icon: '💎',
    color: 'from-red-500 to-red-600',
    package: 'aidorag',
    install: 'gem install aidorag',
    github: 'https://github.com/aidorag/ruby-sdk',
    docs: 'https://rubygems.org/gems/aidorag',
  },
};

const VALID_SDKS = ['python', 'javascript', 'go', 'ruby'] as const;
type SDKKey = typeof VALID_SDKS[number];

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-lg bg-black/40 border border-[var(--landing-border)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--landing-border)] bg-black/20">
        <span className="text-xs text-[var(--landing-text-muted)] font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-[var(--landing-text-muted)] hover:text-white transition-colors"
        >
          {copied ? <CheckCircle2 className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm text-[var(--landing-cyan)]">{code}</code>
      </pre>
    </div>
  );
}

export default function SDKDetailPage() {
  const params = useParams();
  const { t } = useTranslation();
  const sdkKey = params.sdk as string;

  if (!VALID_SDKS.includes(sdkKey as SDKKey)) {
    notFound();
  }

  const sdk = SDK_CONFIG[sdkKey as SDKKey];

  const codeExamples: Record<SDKKey, { init: string; upload: string; query: string }> = {
    python: {
      init: `from aidorag import AIDORag

# Initialize the client
client = AIDORag(api_key="your-api-key")

# Or use environment variable AIDORAG_API_KEY
client = AIDORag()`,
      upload: `# Upload a document
document = client.documents.upload(
    file_path="./document.pdf",
    metadata={
        "title": "My Document",
        "category": "reports"
    }
)

print(f"Document ID: {document.id}")
print(f"Status: {document.status}")`,
      query: `# Query your documents
response = client.query(
    question="What are the key findings?",
    mode="hybrid",  # naive, local, global, hybrid, mix
    top_k=5
)

print(response.answer)
for source in response.sources:
    print(f"- {source.title}: {source.relevance}")`,
    },
    javascript: {
      init: `import { AIDORag } from '@aidorag/sdk';

// Initialize the client
const client = new AIDORag({
  apiKey: 'your-api-key'
});

// Or use environment variable AIDORAG_API_KEY
const client = new AIDORag();`,
      upload: `// Upload a document
const document = await client.documents.upload({
  filePath: './document.pdf',
  metadata: {
    title: 'My Document',
    category: 'reports'
  }
});

console.log(\`Document ID: \${document.id}\`);
console.log(\`Status: \${document.status}\`);`,
      query: `// Query your documents
const response = await client.query({
  question: 'What are the key findings?',
  mode: 'hybrid', // naive, local, global, hybrid, mix
  topK: 5
});

console.log(response.answer);
response.sources.forEach(source => {
  console.log(\`- \${source.title}: \${source.relevance}\`);
});`,
    },
    go: {
      init: `package main

import (
    "github.com/aidorag/go-sdk/aidorag"
)

func main() {
    // Initialize the client
    client := aidorag.NewClient("your-api-key")

    // Or use environment variable AIDORAG_API_KEY
    client := aidorag.NewClientFromEnv()
}`,
      upload: `// Upload a document
document, err := client.Documents.Upload(ctx, &aidorag.UploadParams{
    FilePath: "./document.pdf",
    Metadata: map[string]string{
        "title":    "My Document",
        "category": "reports",
    },
})

if err != nil {
    log.Fatal(err)
}

fmt.Printf("Document ID: %s\\n", document.ID)
fmt.Printf("Status: %s\\n", document.Status)`,
      query: `// Query your documents
response, err := client.Query(ctx, &aidorag.QueryParams{
    Question: "What are the key findings?",
    Mode:     "hybrid", // naive, local, global, hybrid, mix
    TopK:     5,
})

if err != nil {
    log.Fatal(err)
}

fmt.Println(response.Answer)
for _, source := range response.Sources {
    fmt.Printf("- %s: %.2f\\n", source.Title, source.Relevance)
}`,
    },
    ruby: {
      init: `require 'aidorag'

# Initialize the client
client = AIDORag::Client.new(api_key: 'your-api-key')

# Or use environment variable AIDORAG_API_KEY
client = AIDORag::Client.new`,
      upload: `# Upload a document
document = client.documents.upload(
  file_path: './document.pdf',
  metadata: {
    title: 'My Document',
    category: 'reports'
  }
)

puts "Document ID: #{document.id}"
puts "Status: #{document.status}"`,
      query: `# Query your documents
response = client.query(
  question: 'What are the key findings?',
  mode: 'hybrid', # naive, local, global, hybrid, mix
  top_k: 5
)

puts response.answer
response.sources.each do |source|
  puts "- #{source.title}: #{source.relevance}"
end`,
    },
  };

  const examples = codeExamples[sdkKey as SDKKey];

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Back Link */}
          <div className="max-w-4xl mx-auto mb-8">
            <Link
              href="/docs/sdks"
              className="inline-flex items-center gap-2 text-[var(--landing-text-muted)] hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {String(t('pages.sdkDetail.backToSdks'))}
            </Link>
          </div>

          {/* Hero */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className={`inline-flex w-20 h-20 rounded-2xl bg-gradient-to-r ${sdk.color} items-center justify-center text-4xl mb-6`}>
              {sdk.icon}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
              {sdk.name} SDK
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)] mb-6">
              {String(t(`pages.sdkDetail.${sdkKey}.description`))}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
                asChild
              >
                <a href={sdk.github} target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                asChild
              >
                <a href={sdk.docs} target="_blank" rel="noopener noreferrer">
                  <BookOpen className="mr-2 h-4 w-4" />
                  {String(t('pages.sdkDetail.packageDocs'))}
                </a>
              </Button>
            </div>
          </div>

          {/* Installation */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[var(--landing-primary)]/20 flex items-center justify-center">
                  <Terminal className="h-5 w-5 text-[var(--landing-cyan)]" />
                </div>
                <h2 className="text-2xl font-bold text-white">{String(t('pages.sdkDetail.installation'))}</h2>
              </div>
              <CodeBlock code={sdk.install} language="shell" />
              <p className="mt-4 text-sm text-[var(--landing-text-muted)]">
                {String(t('pages.sdkDetail.packageName'))}: <code className="text-[var(--landing-cyan)]">{sdk.package}</code>
              </p>
            </div>
          </div>

          {/* Quick Start */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[var(--landing-primary)]/20 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-[var(--landing-cyan)]" />
                </div>
                <h2 className="text-2xl font-bold text-white">{String(t('pages.sdkDetail.quickStart'))}</h2>
              </div>

              <div className="space-y-8">
                {/* Initialize */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">1. {String(t('pages.sdkDetail.initializeClient'))}</h3>
                  <CodeBlock code={examples.init} language={sdkKey} />
                </div>

                {/* Upload */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">2. {String(t('pages.sdkDetail.uploadDocument'))}</h3>
                  <CodeBlock code={examples.upload} language={sdkKey} />
                </div>

                {/* Query */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">3. {String(t('pages.sdkDetail.queryDocuments'))}</h3>
                  <CodeBlock code={examples.query} language={sdkKey} />
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center text-white">{String(t('pages.sdkDetail.features.title'))}</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50">
                <div className="flex items-center gap-3 mb-3">
                  <Code2 className="h-5 w-5 text-[var(--landing-cyan)]" />
                  <h3 className="font-semibold text-white">{String(t('pages.sdkDetail.features.typeSafe.title'))}</h3>
                </div>
                <p className="text-sm text-[var(--landing-text-secondary)]">
                  {String(t('pages.sdkDetail.features.typeSafe.description'))}
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50">
                <div className="flex items-center gap-3 mb-3">
                  <RefreshCw className="h-5 w-5 text-[var(--landing-cyan)]" />
                  <h3 className="font-semibold text-white">{String(t('pages.sdkDetail.features.autoRetry.title'))}</h3>
                </div>
                <p className="text-sm text-[var(--landing-text-secondary)]">
                  {String(t('pages.sdkDetail.features.autoRetry.description'))}
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="h-5 w-5 text-[var(--landing-cyan)]" />
                  <h3 className="font-semibold text-white">{String(t('pages.sdkDetail.features.streaming.title'))}</h3>
                </div>
                <p className="text-sm text-[var(--landing-text-secondary)]">
                  {String(t('pages.sdkDetail.features.streaming.description'))}
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="h-5 w-5 text-[var(--landing-cyan)]" />
                  <h3 className="font-semibold text-white">{String(t('pages.sdkDetail.features.errorHandling.title'))}</h3>
                </div>
                <p className="text-sm text-[var(--landing-text-secondary)]">
                  {String(t('pages.sdkDetail.features.errorHandling.description'))}
                </p>
              </div>
            </div>
          </div>

          {/* Query Modes */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="rounded-2xl border-2 border-[var(--landing-primary)] bg-gradient-to-br from-[var(--landing-primary)]/20 to-[var(--landing-purple)]/20 p-8">
              <h2 className="text-2xl font-bold mb-6 text-center text-white">{String(t('pages.sdkDetail.queryModes.title'))}</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-black/20 border border-[var(--landing-border)]">
                  <h3 className="font-semibold text-white mb-1">Naive</h3>
                  <p className="text-xs text-[var(--landing-text-secondary)]">{String(t('pages.sdkDetail.queryModes.naive'))}</p>
                </div>
                <div className="p-4 rounded-xl bg-black/20 border border-[var(--landing-border)]">
                  <h3 className="font-semibold text-white mb-1">Local</h3>
                  <p className="text-xs text-[var(--landing-text-secondary)]">{String(t('pages.sdkDetail.queryModes.local'))}</p>
                </div>
                <div className="p-4 rounded-xl bg-black/20 border border-[var(--landing-border)]">
                  <h3 className="font-semibold text-white mb-1">Global</h3>
                  <p className="text-xs text-[var(--landing-text-secondary)]">{String(t('pages.sdkDetail.queryModes.global'))}</p>
                </div>
                <div className="p-4 rounded-xl bg-black/20 border border-[var(--landing-border)]">
                  <h3 className="font-semibold text-white mb-1">Hybrid</h3>
                  <p className="text-xs text-[var(--landing-text-secondary)]">{String(t('pages.sdkDetail.queryModes.hybrid'))}</p>
                </div>
                <div className="p-4 rounded-xl bg-black/20 border border-[var(--landing-border)]">
                  <h3 className="font-semibold text-white mb-1">Mix</h3>
                  <p className="text-xs text-[var(--landing-text-secondary)]">{String(t('pages.sdkDetail.queryModes.mix'))}</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.sdkDetail.cta.title'))}</h2>
            <p className="text-[var(--landing-text-secondary)] mb-6">
              {String(t('pages.sdkDetail.cta.subtitle'))}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
                asChild
              >
                <Link href="/docs/api">{String(t('pages.apiReference.title'))}</Link>
              </Button>
              <Button
                variant="outline"
                className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                asChild
              >
                <Link href="/community">{String(t('common.joinCommunity'))}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
