"use client"
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Target, 
  Award, 
  Globe,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Heart,
  ArrowRight,
  Star,
  Mail
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { CaptchaTurnstile } from "@/components/shared/CaptchaTurnstile";
import { Background } from "@/components/shared/Background";

type Job = { id: string; title: string; company: string; location: string; type: string; description: string; applyUrl: string; featured?: boolean; tags?: string | null; compensationType?: string | null; salaryMin?: number | null; salaryMax?: number | null; currency?: string | null; remoteType?: string | null; experienceLevel?: string | null; allowSiteApply?: boolean }

export default function CareersClient() {
  const [abtechJobs, setAbtechJobs] = useState<Job[]>([])
  const [externalJobs, setExternalJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [postOpen, setPostOpen] = useState(false)
  const [applyOpen, setApplyOpen] = useState(false)
  const [applyingJob, setApplyingJob] = useState<Job | null>(null)
  const [postForm, setPostForm] = useState({
    title: '', company: '', location: '', type: 'FULL_TIME', description: '', applyUrl: '', contactEmail: '', tags: '', compensationType: 'SALARY', salaryMin: '', salaryMax: '', currency: 'USD', remoteType: 'REMOTE', experienceLevel: ''
  })
  const [applyForm, setApplyForm] = useState({
    name: '', email: '', phone: '', linkedin: '', portfolio: '', resumeUrl: '', coverLetter: ''
  })
  const [resumeUploading, setResumeUploading] = useState(false)
  const requireCaptcha = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
  const [captchaTokenPost, setCaptchaTokenPost] = useState<string | null>(null)
  const [captchaTokenApply, setCaptchaTokenApply] = useState<string | null>(null)
  const [hpPost, setHpPost] = useState("")
  const [hpApply, setHpApply] = useState("")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/jobs')
        const json = await res.json()
        if (!cancelled) {
          setAbtechJobs(json.abtech || [])
          setExternalJobs(json.external || [])
        }
      } catch (e) {
        console.error('Failed to load jobs', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const benefits = [
    {
      icon: DollarSign,
      title: "Competitive Compensation",
      description: "Market-leading salaries, equity packages, and performance bonuses."
    },
    {
      icon: Clock,
      title: "Flexible Work",
      description: "Remote-first culture with flexible hours and unlimited PTO."
    },
    {
      icon: Target,
      title: "Professional Growth",
      description: "Learning budget, conference opportunities, and career development programs."
    },
    {
      icon: Users,
      title: "Inclusive Culture",
      description: "Diverse and inclusive workplace where everyone belongs and thrives."
    }
  ];

  const values = [
    {
      title: "Innovation First",
      description: "We embrace new ideas and technologies to stay ahead in the fast-paced tech world."
    },
    {
      title: "Quality Content",
      description: "We are committed to delivering accurate, insightful, and engaging content to our readers."
    },
    {
      title: "Community Focus",
      description: "We build and nurture a community of tech enthusiasts and professionals."
    },
    {
      title: "Continuous Learning",
      description: "We encourage curiosity and provide opportunities for growth and development."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative">
        <Background>
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center"
            >
              <Badge variant="secondary" className="mb-4">
                Careers at AB TECH
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Build the future of tech media with us
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                We’re a team of makers, writers, and engineers shaping technology journalism with clarity and curiosity. Explore open roles at AB TECH and top opportunities from our network.
              </p>
              <div className="mt-4">
                <Button className="mr-4"  size="lg" asChild>
                  <a href="#openings">
                    View Open Positions
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Dialog open={postOpen} onOpenChange={setPostOpen}>
                  <DialogTrigger asChild>
                    <Button className="p-4" variant="outline">Post a Job</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Submit a Job Posting</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <Label className="mb-3" htmlFor="title">Job Title *</Label>
                          <Input id="title" value={postForm.title} onChange={(e)=> setPostForm(f=>({...f, title: e.target.value}))} />
                        </div>
                        <div>
                          <Label className="mb-3" htmlFor="company">Company *</Label>
                          <Input id="company" value={postForm.company} onChange={(e)=> setPostForm(f=>({...f, company: e.target.value}))} />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <Label className="mb-3" htmlFor="location">Location *</Label>
                          <Input id="location" value={postForm.location} onChange={(e)=> setPostForm(f=>({...f, location: e.target.value}))} />
                        </div>
                        <div>
                          <Label className="mb-3" htmlFor="type">Type *</Label>
                          <select id="type" className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={postForm.type} onChange={(e)=> setPostForm(f=>({...f, type: e.target.value}))}>
                            <option value="FULL_TIME">Full-time</option>
                            <option value="PART_TIME">Part-time</option>
                            <option value="CONTRACT">Contract</option>
                            <option value="INTERNSHIP">Internship</option>
                            <option value="FREELANCE">Freelance</option>
                            <option value="TEMPORARY">Temporary</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-3 gap-3">
                        <div>
                          <Label className="mb-3" htmlFor="comp">Compensation Type</Label>
                          <select id="comp" className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={postForm.compensationType} onChange={(e)=> setPostForm(f=>({...f, compensationType: e.target.value}))}>
                            <option value="SALARY">Salary</option>
                            <option value="HOURLY">Hourly</option>
                            <option value="STIPEND">Stipend</option>
                            <option value="UNPAID">Unpaid</option>
                          </select>
                        </div>
                        <div>
                          <Label className="mb-3" htmlFor="salaryMin">Salary Min</Label>
                          <Input id="salaryMin" type="number" value={postForm.salaryMin} onChange={(e)=> setPostForm(f=>({...f, salaryMin: e.target.value}))} />
                        </div>
                        <div>
                          <Label className="mb-3" htmlFor="salaryMax">Salary Max</Label>
                          <Input id="salaryMax" type="number" value={postForm.salaryMax} onChange={(e)=> setPostForm(f=>({...f, salaryMax: e.target.value}))} />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-3 gap-3">
                        <div>
                          <Label className="mb-3" htmlFor="currency">Currency</Label>
                          <Input id="currency" value={postForm.currency} onChange={(e)=> setPostForm(f=>({...f, currency: e.target.value}))} />
                        </div>
                        <div>
                          <Label className="mb-3" htmlFor="remoteType">Work Mode</Label>
                          <select id="remoteType" className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={postForm.remoteType} onChange={(e)=> setPostForm(f=>({...f, remoteType: e.target.value}))}>
                            <option value="REMOTE">Remote</option>
                            <option value="ONSITE">On-site</option>
                            <option value="HYBRID">Hybrid</option>
                          </select>
                        </div>
                        <div>
                          <Label className="mb-3" htmlFor="experienceLevel">Experience Level</Label>
                          <select id="experienceLevel" className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={postForm.experienceLevel} onChange={(e)=> setPostForm(f=>({...f, experienceLevel: e.target.value}))}>
                            <option value="">Select…</option>
                            <option value="INTERN">Intern</option>
                            <option value="JUNIOR">Junior</option>
                            <option value="MID">Mid</option>
                            <option value="SENIOR">Senior</option>
                            <option value="LEAD">Lead</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label className="mb-3" htmlFor="applyUrl">Apply URL *</Label>
                        <Input id="applyUrl" value={postForm.applyUrl} onChange={(e)=> setPostForm(f=>({...f, applyUrl: e.target.value}))} />
                      </div>
                      <div>
                        <Label className="mb-3" htmlFor="contactEmail">Contact Email *</Label>
                        <Input id="contactEmail" type="email" value={postForm.contactEmail} onChange={(e)=> setPostForm(f=>({...f, contactEmail: e.target.value}))} />
                      </div>
                      <div>
                        <Label className="mb-3" htmlFor="tags">Tags (comma separated)</Label>
                        <Input id="tags" value={postForm.tags} onChange={(e)=> setPostForm(f=>({...f, tags: e.target.value}))} />
                      </div>
                      <div>
                        <Label className="mb-3" htmlFor="desc">Description *</Label>
                        <Textarea id="desc" className="min-h-[120px]" value={postForm.description} onChange={(e)=> setPostForm(f=>({...f, description: e.target.value}))} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={()=> setPostOpen(false)}>Cancel</Button>
                      <Button disabled={requireCaptcha && !captchaTokenPost} onClick={async ()=>{
                        try {
                          const payload = { 
                            ...postForm,
                            tags: postForm.tags.trim() || undefined,
                            salaryMin: postForm.salaryMin ? Number(postForm.salaryMin) : undefined,
                            salaryMax: postForm.salaryMax ? Number(postForm.salaryMax) : undefined,
                            captchaToken: captchaTokenPost,
                            honeypot: hpPost,
                          }
                          const res = await fetch('/api/jobs/submit', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
                          if (!res.ok) {
                            const j = await res.json().catch(()=> ({}))
                            throw new Error(j.error || 'Failed to submit job')
                          }
                          toast({ title: 'Submitted', description: 'Your job was sent for review.' })
                          setPostOpen(false)
                          setPostForm({ title:'', company:'', location:'', type:'FULL_TIME', description:'', applyUrl:'', contactEmail:'', tags:'', compensationType:'SALARY', salaryMin:'', salaryMax:'', currency:'USD', remoteType:'REMOTE', experienceLevel:'' })
                          setCaptchaTokenPost(null)
                          setHpPost("")
                        } catch (e:any) {
                          toast({ title: 'Submission failed', description: e.message, variant: 'destructive' })
                        }
                      }}>Send Job Post</Button>
                    {/* Honeypot and Captcha for job post */}
                    <input type="text" value={hpPost} onChange={(e)=> setHpPost(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
                    {requireCaptcha && (
                      <div className="pt-2">
                        <CaptchaTurnstile onToken={setCaptchaTokenPost} />
                      </div>
                    )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </motion.div>
          </div>
        </Background>
      </section>

      {/* Company Values */}
      <section className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do at AB TECH.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Join AB TECH?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We offer competitive benefits and a supportive environment where you can thrive.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mx-auto max-w-4xl">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full text-center">
                  <CardHeader>
                    <div className="p-3 bg-primary/10 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Openings */}
      <section id="openings" className="py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Open Positions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">We're always looking for talented people to join our team.</p>
          </motion.div>

          {/* AB TECH roles */}
          <div className="max-w-4xl mx-auto mb-14">
            <h3 className="text-xl font-semibold mb-4">AB TECH Roles</h3>
            {loading && <p className="text-sm text-muted-foreground">Loading jobs…</p>}
            {(!loading && abtechJobs.length === 0) && <p className="text-sm text-muted-foreground">No open roles right now.</p>}
            <div className="space-y-8">
              {abtechJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-primary/30">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="mb-2 md:mb-0">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-2xl">{job.title}</CardTitle>
                          {job.featured && (
                            <Badge className="ml-1" variant="secondary"><Star className="h-3 w-3 mr-1" /> Featured</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="secondary">AB TECH</Badge>
                          <Badge variant="outline">{job.type.replace('_',' ')}</Badge>
                          <Badge variant="outline" className="gap-1"><MapPin className="h-3 w-3" /> {job.location}</Badge>
                          {job.remoteType && <Badge variant="outline">{job.remoteType.toLowerCase() === 'remote' ? 'Remote' : job.remoteType.toLowerCase() === 'onsite' ? 'On-site' : 'Hybrid'}</Badge>}
                          {job.experienceLevel && <Badge variant="outline">{job.experienceLevel[0] + job.experienceLevel.slice(1).toLowerCase()}</Badge>}
                          {job.compensationType && (
                            <Badge variant="outline" className="gap-1">
                              <DollarSign className="h-3 w-3" />
                              {job.compensationType}
                              {(job.salaryMin || job.salaryMax) && (
                                <span className="ml-1">
                                  {job.currency || ''} {job.salaryMin ?? ''}{job.salaryMax ? `–${job.salaryMax}` : ''}
                                </span>
                              )}
                            </Badge>
                          )}
                        </div>
                        {job.tags && (
                          <div className="flex flex-wrap gap-2">
                            {job.tags.split(',').map((t)=> t.trim()).filter(Boolean).slice(0,6).map((t)=> (
                              <Badge key={t} variant="outline">{t}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="flex gap-2">
                          {job.allowSiteApply !== false && (
                            <Button onClick={()=> { setApplyingJob(job); setApplyOpen(true) }}>
                              Apply on AB TECH <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="outline" asChild>
                            <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">External Apply</a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {job.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              ))}
            </div>
          </div>

          {/* External roles */}
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold mb-4">From Our Network</h3>
            {loading && <p className="text-sm text-muted-foreground">Loading jobs…</p>}
            {(!loading && externalJobs.length === 0) && <p className="text-sm text-muted-foreground">No external postings at the moment.</p>}
            <div className="space-y-8">
              {externalJobs.map((job, index) => (
                <motion.div
                  key={job.id || job.title + String(index)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-primary/30">
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="mb-2 md:mb-0">
                          <CardTitle className="text-2xl mb-2">{job.title}</CardTitle>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant="secondary">{job.company}</Badge>
                            <Badge variant="outline">{job.type.replace('_',' ')}</Badge>
                            <Badge variant="outline" className="gap-1"><MapPin className="h-3 w-3" /> {job.location}</Badge>
                            {job.remoteType && <Badge variant="outline">{job.remoteType.toLowerCase() === 'remote' ? 'Remote' : job.remoteType.toLowerCase() === 'onsite' ? 'On-site' : 'Hybrid'}</Badge>}
                            {job.experienceLevel && <Badge variant="outline">{job.experienceLevel[0] + job.experienceLevel.slice(1).toLowerCase()}</Badge>}
                            {job.compensationType && (
                              <Badge variant="outline" className="gap-1">
                                <DollarSign className="h-3 w-3" />
                                {job.compensationType}
                                {(job.salaryMin || job.salaryMax) && (
                                  <span className="ml-1">
                                    {job.currency || ''} {job.salaryMin ?? ''}{job.salaryMax ? `–${job.salaryMax}` : ''}
                                  </span>
                                )}
                              </Badge>
                            )}
                          </div>
                          {job.tags && (
                            <div className="flex flex-wrap gap-2">
                              {job.tags.split(',').map((t)=> t.trim()).filter(Boolean).slice(0,6).map((t)=> (
                                <Badge key={t} variant="outline">{t}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {job.allowSiteApply !== false && (
                            <Button onClick={()=> { setApplyingJob(job); setApplyOpen(true) }}>
                              Apply on AB TECH <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="outline" asChild>
                            <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">External Apply</a>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{job.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Apply Dialog */}
      <Dialog open={applyOpen} onOpenChange={(o)=> { if(!o) { setApplyOpen(false); setApplyingJob(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for {applyingJob?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label className="mb-3" htmlFor="name">Full Name *</Label>
                <Input id="name" value={applyForm.name} onChange={(e)=> setApplyForm(f=>({...f, name: e.target.value}))} />
              </div>
              <div>
                <Label className="mb-3" htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={applyForm.email} onChange={(e)=> setApplyForm(f=>({...f, email: e.target.value}))} />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label className="mb-3" htmlFor="phone">Phone</Label>
                <Input id="phone" value={applyForm.phone} onChange={(e)=> setApplyForm(f=>({...f, phone: e.target.value}))} />
              </div>
              <div>
                <Label className="mb-3" htmlFor="linkedin">LinkedIn</Label>
                <Input id="linkedin" value={applyForm.linkedin} onChange={(e)=> setApplyForm(f=>({...f, linkedin: e.target.value}))} />
              </div>
              <div>
                <Label className="mb-3" htmlFor="portfolio">Portfolio</Label>
                <Input id="portfolio" value={applyForm.portfolio} onChange={(e)=> setApplyForm(f=>({...f, portfolio: e.target.value}))} />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label className="mb-3" htmlFor="resumeUrl">Resume URL</Label>
                <Input id="resumeUrl" placeholder="https://..." value={applyForm.resumeUrl} onChange={(e)=> setApplyForm(f=>({...f, resumeUrl: e.target.value}))} />
                <div className="text-xs text-muted-foreground mt-1">Alternatively, upload a PDF below.</div>
              </div>
              <div>
                <Label className="mb-3 border-amber-300">Upload Resume (PDF)</Label>
                <div className="flex gap-2 items-center">
                  <input type="file" accept="application/pdf" onChange={async (e)=>{
                    const file = e.target.files?.[0]; if(!file) return;
                    try { setResumeUploading(true);
                      if (requireCaptcha && !captchaTokenApply) { throw new Error('Please complete the captcha first'); }
                      const fd = new FormData(); fd.append('file', file); fd.append('folder','applications'); fd.append('resourceType','raw');
                      if (captchaTokenApply) fd.append('captchaToken', captchaTokenApply);
                      fd.append('honeypot', hpApply);
                      const res = await fetch('/api/upload', { method:'POST', body: fd });
                      const j = await res.json();
                      if(!res.ok || !j?.data?.url) throw new Error(j.error || 'Upload failed');
                      setApplyForm(f=> ({...f, resumeUrl: j.data.url }));
                      toast({ title:'Resume uploaded', description:'Your PDF is attached.' })
                    } catch (err:any) {
                      toast({ title:'Upload failed', description: err.message || 'Please try again', variant:'destructive' })
                    } finally { setResumeUploading(false); }
                  }} />
                </div>
                {resumeUploading && <p className="text-xs text-muted-foreground mt-1">Uploading…</p>}
              </div>
            </div>
            <div>
              <Label className="mb-3" htmlFor="cover">Cover Letter</Label>
              <Textarea id="cover" className="min-h-[120px]" value={applyForm.coverLetter} onChange={(e)=> setApplyForm(f=>({...f, coverLetter: e.target.value}))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=> { setApplyOpen(false); setApplyingJob(null) }}>Cancel</Button>
            <Button disabled={requireCaptcha && !captchaTokenApply} onClick={async ()=>{
              try {
                if(!applyingJob) return;
                const payload = { ...applyForm, captchaToken: captchaTokenApply, honeypot: hpApply };
                const res = await fetch(`/api/jobs/${applyingJob.id}/apply`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
                const j = await res.json(); if(!res.ok) throw new Error(j.error || 'Failed to apply');
                toast({ title:'Application submitted', description:'We will get back to you soon.' })
                setApplyOpen(false); setApplyingJob(null);
                setApplyForm({ name:'', email:'', phone:'', linkedin:'', portfolio:'', resumeUrl:'', coverLetter:'' })
                setCaptchaTokenApply(null)
                setHpApply("")
              } catch (e:any) {
                toast({ title:'Apply failed', description: e.message, variant:'destructive' })
              }
            }}>Submit Application</Button>
          {/* Honeypot and Captcha for job apply */}
          <input type="text" value={hpApply} onChange={(e)=> setHpApply(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
          {requireCaptcha && (
            <div className="pt-2">
              <CaptchaTurnstile onToken={setCaptchaTokenApply} />
            </div>
          )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CTA Section */}
      <section className="pt-12 pb-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-12">
                <Briefcase className="h-16 w-16 text-primary mx-auto mb-6" />
                <h2 className="text-3xl font-bold mb-6">
                  Don't See Your Dream Role?
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  We're always looking for exceptional talent. Send us your resume 
                  and let us know how you can contribute to AB TECH's mission.
                </p>
                <Button size="lg" asChild>
                  <a href="/contact">
                    <Mail className="mr-2 h-4 w-4" />
                    Contact Us
                  </a>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}