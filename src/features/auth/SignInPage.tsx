import { SignIn } from '@clerk/clerk-react';

export function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-main p-4">
      <div className="flex w-full max-w-[1000px] overflow-hidden rounded-2xl border border-border bg-bg-popover shadow-2xl">
        {/* Left Side: Enterprise Branding */}
        <div className="hidden w-1/2 flex-col justify-center bg-primary p-12 text-primary-foreground lg:flex relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent opacity-50" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Enterprise Console</h1>
          </div>
          
          <div className="relative z-10 mt-12 space-y-6">
            <h2 className="text-3xl font-bold leading-tight truncate-words">
              Identity-driven resource management.
            </h2>
            <p className="text-sm font-medium text-primary-foreground/80">
              Secure, scalable, identity-driven resource provisioning platform built for high-performance enterprise workloads.
            </p>
            
            <ul className="mt-8 space-y-4 text-sm font-semibold text-primary-foreground/90">
              <li className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/20 text-success">✓</div>
                Automated RBAC Synchronization
              </li>
              <li className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/20 text-success">✓</div>
                Upstash Redis Rate Limiting
              </li>
              <li className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/20 text-success">✓</div>
                Zero-Trust Data Protection
              </li>
            </ul>
          </div>
        </div>
        
        {/* Right Side: Clerk Auth UI */}
        <div className="flex w-full flex-col justify-center items-center bg-bg-popover p-8 lg:w-1/2">
          {/* Clerk <SignIn /> will automatically render Google OAuth and Email modes */}
          <SignIn 
            routing="hash"
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "bg-transparent shadow-none border-0 w-full p-0",
                headerTitle: "text-2xl font-bold text-text-primary tracking-tight",
                headerSubtitle: "text-text-muted mt-1 text-sm",
                socialButtonsBlockButton: "border-border hover:bg-bg-muted transition-colors text-text-primary h-11 border bg-transparent",
                dividerLine: "bg-border",
                dividerText: "text-text-muted text-xs uppercase tracking-wider",
                formFieldLabel: "text-text-secondary text-sm font-medium",
                formFieldInput: "bg-bg-main border-border text-text-primary h-11 px-4 text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary",
                formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground h-11 text-sm font-semibold rounded-lg transition-colors",
                footerActionText: "text-text-secondary",
                footerActionLink: "text-primary hover:text-primary/80 font-semibold",
                identityPreviewText: "text-text-primary",
                identityPreviewEditButton: "text-primary",
                formFieldWarningText: "text-warning",
                formFieldErrorText: "text-destructive",
                alertText: "text-text-primary",
                alert: "bg-destructive/10 border-destructive border text-destructive",
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
