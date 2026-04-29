import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, ImagePlus } from 'lucide-react';
import { ShoppingBag, Wrench, Home, Briefcase } from 'lucide-react';

const CATEGORIES = [
  { id: 'products', label: 'Products',          description: 'Buy & sell items',      icon: ShoppingBag },
  { id: 'services', label: 'Services & Skills', description: 'Hire or offer expertise', icon: Wrench },
  { id: 'rentals',  label: 'Rentals',           description: 'Homes, rooms & spaces',  icon: Home },
  { id: 'business', label: 'Business & Brands', description: 'Promote your business',  icon: Briefcase },
];
import { toast } from 'sonner';

const PRICE_TYPES = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'negotiable', label: 'Negotiable' },
  { value: 'free', label: 'Free' },
  { value: 'per_month', label: 'Per Month' },
  { value: 'per_hour', label: 'Per Hour' },
];

export default function PostListing() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    price: '',
    priceType: 'fixed',
    location: '',
    contactEmail: '',
    contactPhone: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const step1Valid = form.title && form.category;
  const step2Valid = form.description && form.location && form.contactEmail;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
    toast.success('Your listing has been submitted!');
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md text-center">
        <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h1 className="text-2xl font-bold mb-2">Listing Submitted!</h1>
        <p className="text-muted-foreground mb-6">
          Your ad has been received and will go live shortly. We'll notify you by email.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate('/browse')}>Browse Listings</Button>
          <Button variant="outline" onClick={() => { setSubmitted(false); setStep(1); setForm({ title: '', category: '', description: '', price: '', priceType: 'fixed', location: '', contactEmail: '', contactPhone: '' }); }}>
            Post Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Post an Ad</h1>
        <p className="text-muted-foreground text-sm mt-1">Reach thousands of potential buyers, clients, and renters.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {s}
            </div>
            <span className={`text-sm ${step === s ? 'font-medium' : 'text-muted-foreground'}`}>
              {s === 1 ? 'Details' : s === 2 ? 'Description' : 'Media & Contact'}
            </span>
            {s < 3 && <div className={`h-px w-8 ${step > s ? 'bg-primary' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <Label htmlFor="title">Listing Title *</Label>
              <Input id="title" placeholder="e.g. iPhone 14 Pro Max 256GB for sale" value={form.title} onChange={e => set('title', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Category *</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {CATEGORIES.map(cat => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => set('category', cat.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${form.category === cat.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}
                  >
                    <cat.icon className="w-6 h-6 text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{cat.label}</p>
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priceType">Price Type</Label>
                <select
                  id="priceType"
                  value={form.priceType}
                  onChange={e => set('priceType', e.target.value)}
                  className="mt-1 w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {PRICE_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              {form.priceType !== 'free' && (
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input id="price" type="number" placeholder="e.g. 250" value={form.price} onChange={e => set('price', e.target.value)} className="mt-1" />
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button type="button" disabled={!step1Valid} onClick={() => setStep(2)}>Continue</Button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <Label htmlFor="desc">Description *</Label>
              <Textarea
                id="desc"
                placeholder="Describe your listing in detail — condition, features, requirements, etc."
                value={form.description}
                onChange={e => set('description', e.target.value)}
                className="mt-1 min-h-[140px]"
              />
              <p className="text-xs text-muted-foreground mt-1">{form.description.length} characters</p>
            </div>
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input id="location" placeholder="e.g. Lagos, Nigeria or Remote" value={form.location} onChange={e => set('location', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="email">Contact Email *</Label>
              <Input id="email" type="email" placeholder="your@email.com" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="phone">Contact Phone</Label>
              <Input id="phone" type="tel" placeholder="+234 800 000 0000" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} className="mt-1" />
            </div>
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button type="button" disabled={!step2Valid} onClick={() => setStep(3)}>Continue</Button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <Label>Upload Images / Videos</Label>
              <div className="mt-2 border-2 border-dashed border-border rounded-xl p-10 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <ImagePlus className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Drop files here or click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, MP4 — up to 10 files</p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-xl p-4 border border-border">
              <h3 className="font-semibold text-sm mb-3">Review your listing</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Title</span><span className="font-medium truncate max-w-[200px]">{form.title}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{CATEGORIES.find(c => c.id === form.category)?.label}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span>{form.priceType === 'free' ? 'Free' : form.price ? `$${form.price}` : '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{form.location}</span></div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Listing'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
