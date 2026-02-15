export default function ContactLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section Loading */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-primary/5 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Badge skeleton */}
            <div className="flex justify-center">
              <div className="h-8 w-32 bg-muted animate-pulse rounded-full" />
            </div>
            
            {/* Title skeleton */}
            <div className="space-y-3">
              <div className="h-12 w-64 bg-muted animate-pulse rounded mx-auto" />
              <div className="h-12 w-48 bg-muted animate-pulse rounded mx-auto" />
            </div>
            
            {/* Description skeleton */}
            <div className="space-y-2 max-w-2xl mx-auto">
              <div className="h-6 bg-muted animate-pulse rounded w-full" />
              <div className="h-6 bg-muted animate-pulse rounded w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info Section Loading */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border rounded-lg p-6 text-center h-full">
                {/* Icon skeleton */}
                <div className="p-3 bg-primary/10 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <div className="h-6 w-6 bg-muted animate-pulse rounded" />
                </div>
                
                {/* Title skeleton */}
                <div className="h-6 w-24 bg-muted animate-pulse rounded mx-auto mb-3" />
                
                {/* Description skeleton */}
                <div className="h-4 w-40 bg-muted animate-pulse rounded mx-auto mb-3" />
                
                {/* Details skeleton */}
                <div className="space-y-1">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded mx-auto" />
                  <div className="h-4 w-36 bg-muted animate-pulse rounded mx-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section Loading */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Form Loading */}
              <div className="bg-card border rounded-lg p-6">
                <div className="space-y-6 mb-6">
                  <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-64 bg-muted animate-pulse rounded" />
                </div>
                
                {/* Success message skeleton */}
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="h-5 w-5 bg-green-600 animate-pulse rounded" />
                    <div className="h-5 w-40 bg-green-800 animate-pulse rounded" />
                  </div>
                  <div className="h-4 w-32 bg-green-700 animate-pulse rounded mt-1" />
                </div>
                
                {/* Form fields skeleton */}
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                      <div className="h-10 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                      <div className="h-10 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                    <div className="h-10 bg-muted animate-pulse rounded" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                    <div className="h-32 bg-muted animate-pulse rounded" />
                  </div>
                  
                  <div className="h-10 w-full bg-muted animate-pulse rounded" />
                </div>
              </div>

              {/* FAQ Loading */}
              <div>
                <div className="h-8 w-64 bg-muted animate-pulse rounded mb-6" />
                <div className="space-y-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-card border rounded-lg p-6">
                      <div className="space-y-3">
                        <div className="h-5 w-48 bg-muted animate-pulse rounded" />
                        <div className="space-y-1">
                          <div className="h-4 bg-muted animate-pulse rounded w-full" />
                          <div className="h-4 bg-muted animate-pulse rounded w-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Help card skeleton */}
                <div className="mt-8 p-6 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="h-5 w-40 bg-muted animate-pulse rounded mb-2" />
                  <div className="space-y-1 mb-4">
                    <div className="h-4 bg-muted animate-pulse rounded w-full" />
                    <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
                  </div>
                  <div className="h-10 w-24 bg-muted animate-pulse rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section Loading */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 space-y-4">
              <div className="h-10 w-32 bg-muted animate-pulse rounded mx-auto" />
              <div className="h-6 w-80 bg-muted animate-pulse rounded mx-auto" />
            </div>
            
            <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="h-12 w-12 bg-muted animate-pulse rounded mx-auto" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded mx-auto" />
                <div className="h-3 w-64 bg-muted animate-pulse rounded mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}