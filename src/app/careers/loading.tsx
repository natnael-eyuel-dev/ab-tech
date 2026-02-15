export default function CareersLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section Loading */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-primary/5 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Badge skeleton */}
            <div className="flex justify-center">
              <div className="h-8 w-36 bg-muted animate-pulse rounded-full" />
            </div>
            
            {/* Title skeleton */}
            <div className="space-y-3">
              <div className="h-12 w-80 bg-muted animate-pulse rounded mx-auto" />
              <div className="h-12 w-64 bg-muted animate-pulse rounded mx-auto" />
            </div>
            
            {/* Description skeleton */}
            <div className="space-y-2 max-w-2xl mx-auto">
              <div className="h-6 bg-muted animate-pulse rounded w-full" />
              <div className="h-6 bg-muted animate-pulse rounded w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions Loading */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <div className="h-10 w-56 bg-muted animate-pulse rounded mx-auto" />
            <div className="h-6 w-64 bg-muted animate-pulse rounded mx-auto" />
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border rounded-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div className="space-y-2">
                    <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-10 w-24 bg-muted animate-pulse rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-full" />
                  <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-6 w-16 bg-muted animate-pulse rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section Loading */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <div className="h-10 w-48 bg-muted animate-pulse rounded mx-auto" />
            <div className="h-6 w-64 bg-muted animate-pulse rounded mx-auto" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card border rounded-lg p-6 text-center h-full">
                <div className="p-3 bg-primary/10 rounded-lg w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <div className="h-6 w-6 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-6 w-32 bg-muted animate-pulse rounded mx-auto mb-2" />
                <div className="h-4 bg-muted animate-pulse rounded w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Culture Section Loading */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <div className="h-10 w-40 bg-muted animate-pulse rounded mx-auto" />
              <div className="h-6 w-80 bg-muted animate-pulse rounded mx-auto" />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card border rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <div className="h-6 w-6 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="h-6 w-40 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-full" />
                    <div className="h-4 bg-muted animate-pulse rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}