import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { sellerPoliciesApi } from '@/services/api';
import { toast } from 'sonner';
import { HelpCircle, Shield, FileText, Plus, Edit2, Trash2, Save, BookOpen } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

interface Policy {
  privacyPolicy: string;
  termsConditions: string;
}

export default function SellerSupportPages() {
  const { slug } = useParams<{ slug?: string }>();
  const location = useLocation();

  // Detect active tab from both :slug param (/seller/support-pages/:slug)
  // and full pathname (/seller/settings/faqs, /seller/settings/privacy-policy, etc.)
  const getDefaultTab = () => {
    const path = location.pathname;
    if (path.endsWith('privacy-policy')) return 'privacy';
    if (path.endsWith('terms-conditions')) return 'terms';
    if (slug === 'privacy-policy') return 'privacy';
    if (slug === 'terms-conditions') return 'terms';
    return 'faqs';
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [policy, setPolicy] = useState<Policy>({ privacyPolicy: '', termsConditions: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // FAQ dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState('General');

  useEffect(() => {
    void loadAll();
  }, []);

  // Update active tab when navigating to a different sub-route while component stays mounted
  useEffect(() => {
    setActiveTab(getDefaultTab());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [policyRes, faqRes] = await Promise.all([
        sellerPoliciesApi.getMyPolicies(),
        sellerPoliciesApi.getMyFAQs(),
      ]);
      if (policyRes.success && policyRes.data) {
        const p = policyRes.data as Policy;
        setPolicy({ privacyPolicy: p.privacyPolicy || '', termsConditions: p.termsConditions || '' });
      }
      if (faqRes.success && Array.isArray(faqRes.data)) {
        setFaqs(faqRes.data as FAQ[]);
      }
    } catch (err) {
      console.error('Load error:', err);
      toast.error('Failed to load policies');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Policy save ────────────────────────────────────────────────────────────
  const handleSavePolicy = async () => {
    setIsSaving(true);
    try {
      const res = await sellerPoliciesApi.updateMyPolicies(policy);
      if (res.success) toast.success('Saved successfully!');
      else toast.error('Failed to save');
    } catch {
      toast.error('Error saving policies');
    } finally {
      setIsSaving(false);
    }
  };

  // ── FAQ handlers ───────────────────────────────────────────────────────────
  const openAddFAQ = () => {
    setEditingFAQ(null);
    setFaqQuestion('');
    setFaqAnswer('');
    setFaqCategory('General');
    setDialogOpen(true);
  };

  const openEditFAQ = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFaqQuestion(faq.question);
    setFaqAnswer(faq.answer);
    setFaqCategory(faq.category);
    setDialogOpen(true);
  };

  const handleSaveFAQ = async () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      toast.error('Question and answer are required');
      return;
    }
    try {
      if (editingFAQ) {
        const res = await sellerPoliciesApi.updateFAQ(editingFAQ.id, {
          question: faqQuestion, answer: faqAnswer, category: faqCategory,
        });
        if (res.success) {
          setFaqs(prev => prev.map(f => f.id === editingFAQ.id ? (res.data as FAQ) : f));
          toast.success('FAQ updated');
        }
      } else {
        const res = await sellerPoliciesApi.createFAQ({
          question: faqQuestion, answer: faqAnswer, category: faqCategory, order: faqs.length,
        });
        if (res.success && res.data) {
          setFaqs(prev => [...prev, res.data as FAQ]);
          toast.success('FAQ added');
        }
      }
      setDialogOpen(false);
    } catch {
      toast.error('Failed to save FAQ');
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    try {
      const res = await sellerPoliciesApi.deleteFAQ(id);
      if (res.success) {
        setFaqs(prev => prev.filter(f => f.id !== id));
        toast.success('FAQ deleted');
      }
    } catch {
      toast.error('Failed to delete FAQ');
    }
  };

  const categories = Array.from(new Set(faqs.map(f => f.category)));

  if (isLoading) {
    return <div className="flex justify-center p-8 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store Policies"
        description="Manage your store's FAQs, Privacy Policy, and Terms & Conditions"
        icon={BookOpen}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="dark:bg-gray-800 mb-6">
          <TabsTrigger value="faqs" className="gap-2 dark:data-[state=active]:bg-gray-700">
            <HelpCircle className="h-4 w-4" /> FAQs
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2 dark:data-[state=active]:bg-gray-700">
            <Shield className="h-4 w-4" /> Privacy Policy
          </TabsTrigger>
          <TabsTrigger value="terms" className="gap-2 dark:data-[state=active]:bg-gray-700">
            <FileText className="h-4 w-4" /> Terms &amp; Conditions
          </TabsTrigger>
        </TabsList>

        {/* ── FAQs Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="faqs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Frequently Asked Questions
            </h3>
            <Button onClick={openAddFAQ} className="bg-gradient-to-r from-orange-500 to-amber-500 gap-2">
              <Plus className="h-4 w-4" /> Add FAQ
            </Button>
          </div>

          {faqs.length === 0 ? (
            <Card className="dark:border-gray-700 dark:bg-gray-800">
              <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
                <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No FAQs yet. Add your first FAQ!</p>
              </CardContent>
            </Card>
          ) : (
            categories.map(cat => (
              <Card key={cat} className="dark:border-gray-700 dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-base dark:text-white">{cat}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.filter(f => f.category === cat).map(faq => (
                      <AccordionItem key={faq.id} value={faq.id} className="dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <AccordionTrigger className="flex-1 text-left dark:text-white hover:no-underline pr-2">
                            {faq.question}
                          </AccordionTrigger>
                          <div className="flex gap-1 shrink-0 ml-2">
                            <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); openEditFAQ(faq); }}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700"
                              onClick={e => { e.stopPropagation(); void handleDeleteFAQ(faq.id); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <AccordionContent className="text-gray-600 dark:text-gray-400">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ── Privacy Policy Tab ────────────────────────────────────────── */}
        <TabsContent value="privacy" className="space-y-4">
          <Card className="dark:border-gray-700 dark:bg-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="dark:text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-500" /> Privacy Policy
                </CardTitle>
                <Button onClick={handleSavePolicy} disabled={isSaving}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 gap-2">
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Write your store's privacy policy below. This will be shown to consumers visiting your store pages.
              </p>
              <Textarea
                value={policy.privacyPolicy}
                onChange={e => setPolicy(p => ({ ...p, privacyPolicy: e.target.value }))}
                placeholder={`1. Introduction\nWe are committed to protecting your privacy...\n\n2. Information We Collect\n...`}
                rows={20}
                className="font-mono text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Terms & Conditions Tab ────────────────────────────────────── */}
        <TabsContent value="terms" className="space-y-4">
          <Card className="dark:border-gray-700 dark:bg-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="dark:text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-500" /> Terms &amp; Conditions
                </CardTitle>
                <Button onClick={handleSavePolicy} disabled={isSaving}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 gap-2">
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Write your store's terms and conditions below. This will be shown to consumers visiting your store pages.
              </p>
              <Textarea
                value={policy.termsConditions}
                onChange={e => setPolicy(p => ({ ...p, termsConditions: e.target.value }))}
                placeholder={`1. Acceptance of Terms\nBy purchasing from our store, you agree...\n\n2. Products\n...`}
                rows={20}
                className="font-mono text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── FAQ Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px] dark:border-gray-700 dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="dark:text-gray-300">Category</Label>
              <Input value={faqCategory} onChange={e => setFaqCategory(e.target.value)}
                placeholder="e.g. General, Orders, Shipping"
                className="dark:border-gray-700 dark:bg-gray-900 dark:text-white mt-1" />
            </div>
            <div>
              <Label className="dark:text-gray-300">Question</Label>
              <Input value={faqQuestion} onChange={e => setFaqQuestion(e.target.value)}
                placeholder="Enter the question"
                className="dark:border-gray-700 dark:bg-gray-900 dark:text-white mt-1" />
            </div>
            <div>
              <Label className="dark:text-gray-300">Answer</Label>
              <Textarea value={faqAnswer} onChange={e => setFaqAnswer(e.target.value)}
                placeholder="Enter the answer"
                rows={5}
                className="dark:border-gray-700 dark:bg-gray-900 dark:text-white mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}
              className="dark:border-gray-700 dark:text-white">
              Cancel
            </Button>
            <Button onClick={() => void handleSaveFAQ()}
              className="bg-gradient-to-r from-orange-500 to-amber-500">
              {editingFAQ ? 'Save Changes' : 'Add FAQ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
