# PHASE A4: LANDING PAGE & POLISH

## Thời gian: Day 14-17
## Mục tiêu: Tạo landing page chuyên nghiệp và polish UI/UX

---

## TỔNG QUAN PHASE A4

```
Day 14: Landing Page - Hero & Features
Day 15: Landing Page - Pricing & CTA
Day 16: UI Polish & Loading States
Day 17: SEO & Analytics Setup
```

---

## DAY 14: LANDING PAGE - HERO & FEATURES

### PROMPT 14.1 - Analyze Current Design System

```
Trước khi tạo landing page, phân tích design system hiện tại:

1. Kiểm tra các file styling:
   - tailwind.config.js/ts
   - globals.css
   - Các component styles

2. Xác định:
   - Color palette (primary, secondary, accent)
   - Typography (fonts, sizes)
   - Spacing system
   - Border radius
   - Shadow system
   - Animation/transition

3. Kiểm tra UI components đã có:
   - Button variants
   - Card components
   - Form elements
   - Modal/Dialog
   - Navigation

4. Tạo báo cáo design tokens để sử dụng consistent trong landing page

Lưu vào file: `docs/DESIGN_SYSTEM.md`
```

### PROMPT 14.2 - Create Landing Page Structure

```
Tạo landing page tại `src/app/page.tsx` (hoặc `src/app/(marketing)/page.tsx`):

Structure:
```typescript
// src/app/(marketing)/layout.tsx
export default function MarketingLayout({ children }) {
  return (
    <div className="min-h-screen">
      <MarketingNav />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
```

Landing page sections (scroll order):
1. Hero Section
2. Logos/Social Proof
3. Features Overview
4. How It Works
5. Demo/Screenshot
6. Testimonials
7. Pricing (link or embedded)
8. FAQ
9. CTA Section
10. Footer

Tạo file structure:
```
src/app/(marketing)/
├── layout.tsx
├── page.tsx
└── components/
    ├── MarketingNav.tsx
    ├── Hero.tsx
    ├── LogoCloud.tsx
    ├── Features.tsx
    ├── HowItWorks.tsx
    ├── Demo.tsx
    ├── Testimonials.tsx
    ├── FAQ.tsx
    ├── CTASection.tsx
    └── Footer.tsx
```
```

### PROMPT 14.3 - Create Hero Section

```
Tạo Hero Section component:

File: `src/components/marketing/Hero.tsx`

Requirements:
1. Headline compelling (value proposition)
   - Main: "Turn Your Documents Into Intelligent Conversations"
   - Sub: "MegaRAG uses advanced AI to let you chat with your PDFs, docs, and files. Get instant answers with accurate citations."

2. CTA Buttons:
   - Primary: "Start Free" → /signup
   - Secondary: "View Demo" → scroll to demo section hoặc /demo

3. Visual:
   - Hero image hoặc animated illustration
   - Hoặc live demo preview
   - Background gradient/pattern

4. Social proof snippet:
   - "Trusted by X+ teams" hoặc
   - Star rating hoặc
   - Key metric

5. Responsive:
   - Desktop: text left, visual right
   - Mobile: stacked

Code structure:
```typescript
export function Hero() {
  return (
    <section className="relative py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-6">
            <Badge>🚀 Now in Public Beta</Badge>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
              Turn Your Documents Into{' '}
              <span className="text-primary">Intelligent Conversations</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              MegaRAG uses advanced AI to let you chat with your PDFs, 
              docs, and files. Get instant answers with accurate citations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">Start Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#demo">View Demo</Link>
              </Button>
            </div>
            <SocialProof />
          </div>
          
          {/* Visual */}
          <div className="relative">
            <HeroImage />
          </div>
        </div>
      </div>
    </section>
  )
}
```
```

### PROMPT 14.4 - Create Features Section

```
Tạo Features Section:

File: `src/components/marketing/Features.tsx`

Features to highlight:
1. 5 Query Modes
   - Naive, Local, Global, Hybrid, Mix
   - Icon: Layers hoặc Grid

2. Knowledge Graph
   - Entity extraction, relations
   - Icon: Network hoặc Share2

3. Multi-Modal Support
   - PDF, DOCX, PPTX, images
   - Icon: FileText hoặc Files

4. Accurate Citations
   - Source references, page numbers
   - Icon: Quote hoặc BookOpen

5. Secure & Private
   - Data encryption, access control
   - Icon: Shield hoặc Lock

6. Team Collaboration
   - Share, collaborate, permissions
   - Icon: Users hoặc UserPlus

Design options:
A. Grid layout (2x3 cards)
B. Bento grid (mixed sizes)
C. Alternating sections (text + visual)

```typescript
const FEATURES = [
  {
    icon: Layers,
    title: '5 Query Modes',
    description: 'From simple search to complex reasoning. Choose the mode that fits your question.',
  },
  {
    icon: Network,
    title: 'Knowledge Graph',
    description: 'Automatically extracts entities and relationships for deeper understanding.',
  },
  // ... more features
]

export function Features() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <SectionHeader
          badge="Features"
          title="Everything You Need for Document Intelligence"
          description="Powerful features that make working with documents effortless"
        />
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  )
}
```
```

### PROMPT 14.5 - Create How It Works Section

```
Tạo How It Works section:

File: `src/components/marketing/HowItWorks.tsx`

Steps:
1. Upload Documents
   - "Drop your PDFs, Word docs, or presentations"
   - Visual: Upload animation hoặc icon

2. AI Processes
   - "Our AI extracts text, creates embeddings, and builds knowledge graph"
   - Visual: Processing animation

3. Ask Questions
   - "Chat naturally with your documents"
   - Visual: Chat interface preview

4. Get Answers
   - "Receive accurate answers with source citations"
   - Visual: Answer with citations

Design:
- Timeline/stepper layout
- Numbered steps
- Connecting lines/arrows

```typescript
const STEPS = [
  {
    step: 1,
    title: 'Upload Documents',
    description: 'Drop your PDFs, Word docs, or presentations',
    icon: Upload,
  },
  // ... more steps
]

export function HowItWorks() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <SectionHeader
          badge="How It Works"
          title="From Documents to Answers in Minutes"
          description="Simple, fast, and accurate"
        />
        
        <div className="relative mt-12">
          {/* Connection line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border hidden lg:block" />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, index) => (
              <StepCard key={step.step} {...step} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
```
```

---

## DAY 15: LANDING PAGE - PRICING & CTA

### PROMPT 15.1 - Embed Pricing Section

```
Integrate Pricing vào landing page:

Option A: Link to separate pricing page
```typescript
<Button asChild>
  <Link href="/pricing">View Pricing</Link>
</Button>
```

Option B: Embed pricing table in landing page
```typescript
import { PricingTable } from '@/components/pricing/PricingTable'

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <SectionHeader
          badge="Pricing"
          title="Simple, Transparent Pricing"
          description="Start free, upgrade when you need more"
        />
        <PricingTable />
      </div>
    </section>
  )
}
```

Recommend: Option B for better conversion (less clicks)
```

### PROMPT 15.2 - Create Testimonials Section

```
Tạo Testimonials section:

File: `src/components/marketing/Testimonials.tsx`

Nếu chưa có testimonials thật, tạo placeholder:

```typescript
const TESTIMONIALS = [
  {
    quote: "MegaRAG transformed how our team handles documentation. We find answers in seconds instead of hours.",
    author: "Sarah Chen",
    role: "Product Manager",
    company: "TechCorp",
    avatar: "/avatars/sarah.jpg", // hoặc placeholder
  },
  {
    quote: "The knowledge graph feature is incredible. It understands context better than any tool we've tried.",
    author: "Michael Park",
    role: "Research Lead",
    company: "DataLabs",
    avatar: "/avatars/michael.jpg",
  },
  {
    quote: "Finally, an AI that gives accurate citations. Essential for our legal research workflow.",
    author: "Emily Rodriguez",
    role: "Legal Counsel",
    company: "LawFirm LLP",
    avatar: "/avatars/emily.jpg",
  },
]

export function Testimonials() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <SectionHeader
          badge="Testimonials"
          title="Loved by Teams Worldwide"
        />
        
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {TESTIMONIALS.map((testimonial) => (
            <TestimonialCard key={testimonial.author} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialCard({ quote, author, role, company, avatar }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Quote className="h-8 w-8 text-primary/20 mb-4" />
        <p className="text-muted-foreground mb-6">{quote}</p>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={avatar} />
            <AvatarFallback>{author[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{author}</p>
            <p className="text-sm text-muted-foreground">{role} at {company}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

Note: Replace với real testimonials khi có
```

### PROMPT 15.3 - Create FAQ Section

```
Tạo FAQ section:

File: `src/components/marketing/FAQ.tsx`

```typescript
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const FAQS = [
  {
    question: "What file types does MegaRAG support?",
    answer: "MegaRAG supports PDF, DOCX, PPTX, TXT, and Markdown files. We're constantly adding support for more formats including images with OCR."
  },
  {
    question: "How secure is my data?",
    answer: "Your documents are encrypted at rest and in transit. We use enterprise-grade security with SOC2 compliance. Your data is never used to train AI models."
  },
  {
    question: "What are the different query modes?",
    answer: "We offer 5 modes: Naive (fast keyword search), Local (context-aware), Global (document-wide understanding), Hybrid (combines local and global), and Mix (intelligently selects the best approach)."
  },
  {
    question: "Can I use MegaRAG with my team?",
    answer: "Yes! Our Business plan supports up to 10 team members with shared workspaces, permissions, and collaborative features."
  },
  {
    question: "Is there an API available?",
    answer: "Yes, our Pro and Business plans include full API access. You can integrate MegaRAG into your existing workflows and applications."
  },
  {
    question: "What happens when I reach my usage limit?",
    answer: "You'll receive a notification when approaching your limit. Once reached, you can upgrade your plan or wait for the next billing cycle to reset."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Absolutely. You can cancel your subscription at any time. You'll continue to have access until the end of your billing period."
  },
  {
    question: "Do you offer enterprise solutions?",
    answer: "Yes! Contact our sales team for custom pricing, dedicated infrastructure, on-premise deployment, and enterprise features."
  },
]

export function FAQ() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4 max-w-3xl">
        <SectionHeader
          badge="FAQ"
          title="Frequently Asked Questions"
          description="Everything you need to know about MegaRAG"
        />
        
        <Accordion type="single" collapsible className="mt-12">
          {FAQS.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent>
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
```
```

### PROMPT 15.4 - Create Final CTA Section

```
Tạo CTA section cuối trang:

File: `src/components/marketing/CTASection.tsx`

```typescript
export function CTASection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="relative rounded-3xl bg-gradient-to-r from-primary to-primary/80 p-12 lg:p-20 text-center text-white overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Ready to Transform Your Document Workflow?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Join thousands of teams using MegaRAG to work smarter with their documents.
              Start free today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/signup">Get Started Free</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
            <p className="text-sm text-white/60 mt-6">
              No credit card required • Free forever plan available
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
```
```

### PROMPT 15.5 - Create Footer

```
Tạo Footer component:

File: `src/components/marketing/Footer.tsx`

```typescript
const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'API Docs', href: '/docs' },
    { label: 'Changelog', href: '/changelog' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
  ],
  Resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'Help Center', href: '/help' },
    { label: 'Community', href: '/community' },
    { label: 'Status', href: '/status' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'GDPR', href: '/gdpr' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Logo className="h-8 w-8" />
              <span className="font-bold text-xl">MegaRAG</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              AI-powered document intelligence for modern teams.
            </p>
            <div className="flex gap-4">
              <SocialLink href="https://twitter.com" icon={Twitter} />
              <SocialLink href="https://github.com" icon={Github} />
              <SocialLink href="https://linkedin.com" icon={Linkedin} />
            </div>
          </div>
          
          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} MegaRAG. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Made with ❤️ in Vietnam</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
```
```

---

## DAY 16: UI POLISH & LOADING STATES

### PROMPT 16.1 - Add Loading States

```
Add loading states cho tất cả async operations:

1. Page loading skeleton:

File: `src/components/ui/skeleton-page.tsx`
```typescript
export function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded w-1/4" />
      <div className="h-4 bg-muted rounded w-1/2" />
      <div className="grid grid-cols-3 gap-4 mt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted rounded" />
        ))}
      </div>
    </div>
  )
}
```

2. Button loading state:
```typescript
<Button disabled={loading}>
  {loading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Processing...
    </>
  ) : (
    'Submit'
  )}
</Button>
```

3. Card loading skeleton:
```typescript
export function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-1/3" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  )
}
```

4. Table loading skeleton

5. Chat message loading (typing indicator)

Tìm tất cả các component có async operations và add loading states.
```

### PROMPT 16.2 - Improve Error Handling UI

```
Improve error handling UI:

1. Error Boundary:

File: `src/components/error-boundary.tsx`
```typescript
'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4 text-center max-w-md">
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          <Button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
```

2. Toast notifications:
- Success: Green với checkmark
- Error: Red với X
- Warning: Yellow với alert
- Info: Blue với info icon

3. Form validation errors:
- Inline errors below inputs
- Summary at top of form
- Focus first error field

4. API error messages:
- User-friendly messages
- Retry option
- Contact support link for persistent errors
```

### PROMPT 16.3 - Mobile Responsiveness Check

```
Kiểm tra và fix mobile responsiveness:

1. Test tất cả pages trên các breakpoints:
   - Mobile: 375px (iPhone SE)
   - Mobile large: 428px (iPhone 14)
   - Tablet: 768px (iPad)
   - Desktop: 1024px+

2. Common issues to fix:
   - Navigation menu (hamburger menu on mobile)
   - Tables (horizontal scroll or card view)
   - Forms (full width inputs)
   - Images (responsive sizes)
   - Padding/margins (smaller on mobile)
   - Font sizes (readable on small screens)

3. Test touch interactions:
   - Buttons large enough (min 44px)
   - Adequate spacing between clickables
   - Swipe gestures where appropriate

4. Navigation on mobile:

File: `src/components/marketing/MobileNav.tsx`
```typescript
'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px]">
        <nav className="flex flex-col gap-4 mt-8">
          {/* Navigation links */}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
```

Run through all pages and fix issues.
```

### PROMPT 16.4 - Animations & Micro-interactions

```
Add subtle animations để improve UX:

1. Page transitions:
```typescript
// Use framer-motion or CSS transitions
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {children}
</motion.div>
```

2. Button hover effects:
```css
.button {
  transition: transform 0.2s, box-shadow 0.2s;
}
.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
```

3. Card hover effects:
```css
.card {
  transition: transform 0.2s, box-shadow 0.2s;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}
```

4. Loading animations:
- Skeleton pulse
- Spinner
- Progress bar

5. Success animations:
- Checkmark animation
- Confetti (for major actions)

6. Scroll animations:
- Fade in on scroll
- Parallax effects (subtle)

Install framer-motion nếu cần:
```bash
npm install framer-motion
```
```

---

## DAY 17: SEO & ANALYTICS SETUP

### PROMPT 17.1 - SEO Setup

```
Setup SEO cho MegaRAG:

1. Metadata:

File: `src/app/layout.tsx`
```typescript
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'MegaRAG - AI-Powered Document Intelligence',
    template: '%s | MegaRAG',
  },
  description: 'Transform your documents into intelligent conversations. Upload PDFs, docs, and files to get instant AI-powered answers with accurate citations.',
  keywords: ['RAG', 'AI', 'document intelligence', 'PDF chat', 'knowledge management'],
  authors: [{ name: 'MegaRAG Team' }],
  creator: 'MegaRAG',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://megarag.io',
    title: 'MegaRAG - AI-Powered Document Intelligence',
    description: 'Transform your documents into intelligent conversations.',
    siteName: 'MegaRAG',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MegaRAG',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MegaRAG - AI-Powered Document Intelligence',
    description: 'Transform your documents into intelligent conversations.',
    images: ['/og-image.png'],
    creator: '@megarag',
  },
  robots: {
    index: true,
    follow: true,
  },
}
```

2. Per-page metadata:
```typescript
// src/app/pricing/page.tsx
export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for MegaRAG. Start free, upgrade when you need more.',
}
```

3. Sitemap:

File: `src/app/sitemap.ts`
```typescript
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://megarag.io',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://megarag.io/pricing',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://megarag.io/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Add more URLs
  ]
}
```

4. Robots.txt:

File: `src/app/robots.ts`
```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/settings/'],
    },
    sitemap: 'https://megarag.io/sitemap.xml',
  }
}
```

5. Structured data (JSON-LD):
```typescript
// Add to layout or specific pages
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'MegaRAG',
      applicationCategory: 'BusinessApplication',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    }),
  }}
/>
```
```

### PROMPT 17.2 - Analytics Setup

```
Setup analytics:

1. Google Analytics 4:

File: `src/components/analytics/GoogleAnalytics.tsx`
```typescript
import Script from 'next/script'

export function GoogleAnalytics() {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID

  if (!GA_ID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  )
}
```

2. Event tracking:

File: `src/lib/analytics.ts`
```typescript
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, properties)
  }
}

// Usage examples
export const analytics = {
  signUp: () => trackEvent('sign_up'),
  login: () => trackEvent('login'),
  startCheckout: (plan: string) => trackEvent('begin_checkout', { plan }),
  completeCheckout: (plan: string, value: number) => 
    trackEvent('purchase', { plan, value }),
  uploadDocument: () => trackEvent('upload_document'),
  sendQuery: (mode: string) => trackEvent('send_query', { mode }),
  viewPricing: () => trackEvent('view_pricing'),
}
```

3. Conversion tracking:
- Signup completion
- Checkout completion
- Key feature usage

4. Add to layout:
```typescript
// src/app/layout.tsx
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  )
}
```

5. Environment variables:
```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```
```

### PROMPT 17.3 - Performance Optimization

```
Optimize performance:

1. Image optimization:
```typescript
import Image from 'next/image'

<Image
  src="/hero-image.png"
  alt="MegaRAG Dashboard"
  width={800}
  height={600}
  priority // for above-the-fold images
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

2. Font optimization:
```typescript
// src/app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})
```

3. Code splitting:
```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false,
})
```

4. Bundle analysis:
```bash
npm install @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
module.exports = withBundleAnalyzer({})

# Run
ANALYZE=true npm run build
```

5. Core Web Vitals:
- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1

Test với:
- Lighthouse in Chrome DevTools
- PageSpeed Insights
- WebPageTest
```

---

## FILES CẦN TẠO/UPDATE TRONG PHASE A4

```
src/
├── app/
│   ├── (marketing)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── about/
│   │   ├── contact/
│   │   └── components/
│   ├── sitemap.ts
│   ├── robots.ts
│   └── layout.tsx (update metadata)
├── components/
│   ├── marketing/
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── Testimonials.tsx
│   │   ├── FAQ.tsx
│   │   ├── CTASection.tsx
│   │   ├── Footer.tsx
│   │   ├── MarketingNav.tsx
│   │   └── MobileNav.tsx
│   ├── ui/
│   │   └── skeleton-page.tsx
│   ├── error-boundary.tsx
│   └── analytics/
│       └── GoogleAnalytics.tsx
└── lib/
    └── analytics.ts

public/
├── og-image.png
├── favicon.ico
└── images/
    └── ... (marketing images)
```

---

## TESTING CHECKLIST PHASE A4

```
### Landing Page
- [ ] Hero displays correctly on all devices
- [ ] Features section readable
- [ ] How it works steps clear
- [ ] Testimonials display properly
- [ ] FAQ accordion works
- [ ] CTA buttons work
- [ ] Footer links work
- [ ] Navigation responsive

### Polish
- [ ] All loading states implemented
- [ ] Error messages user-friendly
- [ ] Mobile navigation works
- [ ] Touch targets adequate
- [ ] Animations smooth

### SEO
- [ ] Meta tags correct
- [ ] OG image displays
- [ ] Sitemap accessible
- [ ] Robots.txt correct
- [ ] Structured data valid

### Analytics
- [ ] GA tracking code installed
- [ ] Events firing correctly
- [ ] Conversion tracking works

### Performance
- [ ] Lighthouse score > 90
- [ ] Images optimized
- [ ] Fonts loading properly
- [ ] No layout shifts
```

---

## TIẾP THEO

Sau khi hoàn thành Phase A4:
→ **Phase A5: Deploy & Launch**
