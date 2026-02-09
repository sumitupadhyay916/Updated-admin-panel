import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supportApi } from '@/services/api';
import type { SupportPage, FAQ } from '@/types';
import { 
  BookOpen,
  Save,
  HelpCircle,
  Shield,
  FileText,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';
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

export default function SupportPagesManagement() {
  const [supportPages, setSupportPages] = useState<SupportPage[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit states
  const [editingPage, setEditingPage] = useState<SupportPage | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  
  // FAQ edit states
  const [isFAQDialogOpen, setIsFAQDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState('');

  useEffect(() => {
    void loadSupportPages();
    void loadFaqs();
  }, []);

  const loadSupportPages = async () => {
    setIsLoading(true);
    try {
      const response = await supportApi.getSupportPages();
      if (response.success && Array.isArray(response.data)) {
        setSupportPages(response.data as SupportPage[]);
      } else {
        setSupportPages([]);
      }
    } catch (error) {
      console.error('Failed to load support pages', error);
      setSupportPages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFaqs = async () => {
    try {
      const response = await supportApi.getFAQs();
      if (response.success && Array.isArray(response.data)) {
        setFaqs(response.data as FAQ[]);
      } else {
        setFaqs([]);
      }
    } catch (error) {
      console.error('Failed to load FAQs', error);
      setFaqs([]);
    }
  };

  const handleEditPage = (page: SupportPage) => {
    setEditingPage(page);
    setEditedTitle(page.title);
    setEditedContent(page.content);
  };

  const handleSavePage = async () => {
    if (!editingPage) return;

    setIsSaving(true);
    try {
      const response = await supportApi.updateSupportPage(editingPage.slug, {
        title: editedTitle,
        content: editedContent,
      });

      if (response.success && response.data) {
        const updated = response.data as SupportPage;
        setSupportPages((pages) =>
          pages.map((p) => (p.slug === updated.slug ? updated : p)),
        );
      } else {
        // Fallback optimistic update if API did not return data
        setSupportPages((pages) =>
          pages.map((p) =>
            p.slug === editingPage.slug
              ? {
                  ...p,
                  content: editedContent,
                  title: editedTitle,
                  lastUpdated: new Date().toISOString().split('T')[0],
                }
              : p,
          ),
        );
      }

      setEditingPage(null);
    } catch (error) {
      console.error('Failed to save support page', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddFAQ = () => {
    setEditingFAQ(null);
    setFaqQuestion('');
    setFaqAnswer('');
    setFaqCategory('General');
    setIsFAQDialogOpen(true);
  };

  const handleEditFAQ = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFaqQuestion(faq.question);
    setFaqAnswer(faq.answer);
    setFaqCategory(faq.category);
    setIsFAQDialogOpen(true);
  };

  const handleSaveFAQ = async () => {
    try {
      if (editingFAQ) {
        await supportApi.updateFAQ(editingFAQ.id, {
          question: faqQuestion,
          answer: faqAnswer,
          category: faqCategory,
          order: editingFAQ.order,
        });
      } else {
        await supportApi.createFAQ({
          question: faqQuestion,
          answer: faqAnswer,
          category: faqCategory,
          order: faqs.length + 1,
        });
      }

      await loadFaqs();
      setIsFAQDialogOpen(false);
    } catch (error) {
      console.error('Failed to save FAQ', error);
    }
  };

  const handleDeleteFAQ = async (faqId: string) => {
    try {
      await supportApi.deleteFAQ(faqId);
      await loadFaqs();
    } catch (error) {
      console.error('Failed to delete FAQ', error);
    }
  };

  const getPageIcon = (slug: string) => {
    switch (slug) {
      case 'help-center': return HelpCircle;
      case 'faqs': return BookOpen;
      case 'privacy-policy': return Shield;
      case 'terms-conditions': return FileText;
      default: return FileText;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Pages"
        description="Manage help center, FAQs, privacy policy, and terms"
        icon={BookOpen}
      />

      <Tabs defaultValue="pages" className="w-full">
        <TabsList className="dark:bg-gray-800">
          <TabsTrigger value="pages" className="dark:data-[state=active]:bg-gray-700">Static Pages</TabsTrigger>
          <TabsTrigger value="faqs" className="dark:data-[state=active]:bg-gray-700">FAQs</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-4">
          {editingPage ? (
            <Card className="dark:border-gray-700 dark:bg-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="dark:text-white">Edit {editingPage.title}</CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      Last updated: {editingPage.lastUpdated}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditingPage(null)}
                      className="dark:border-gray-700 dark:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSavePage}
                      disabled={isSaving}
                      className="bg-gradient-to-r from-orange-500 to-amber-500"
                    >
                      {isSaving ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="dark:text-gray-300">Page Title</Label>
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <Label className="dark:text-gray-300">Content (Markdown supported)</Label>
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={20}
                    className="font-mono text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {supportPages.map((page) => {
                const Icon = getPageIcon(page.slug);
                return (
                  <Card key={page.id} className="dark:border-gray-700 dark:bg-gray-800">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                            <Icon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div>
                            <CardTitle className="text-lg dark:text-white">{page.title}</CardTitle>
                            <CardDescription className="dark:text-gray-400">
                              Last updated: {page.lastUpdated}
                            </CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPage(page)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                        {page.content.substring(0, 150)}...
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-400">
                          /{page.slug}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPage(page)}
                          className="dark:border-gray-700 dark:text-white"
                        >
                          Edit Page
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="faqs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Frequently Asked Questions
            </h3>
            <Button 
              onClick={handleAddFAQ}
              className="bg-gradient-to-r from-orange-500 to-amber-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add FAQ
            </Button>
          </div>

          <div className="space-y-4">
            {Array.from(new Set(faqs.map(f => f.category))).map((category) => (
              <Card key={category} className="dark:border-gray-700 dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg dark:text-white">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.filter(f => f.category === category).map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id} className="dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <AccordionTrigger className="flex-1 text-left dark:text-white hover:no-underline">
                            {faq.question}
                          </AccordionTrigger>
                          <div className="flex gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditFAQ(faq);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFAQ(faq.id);
                              }}
                              className="text-red-600"
                            >
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
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* FAQ Edit Dialog */}
      <Dialog open={isFAQDialogOpen} onOpenChange={setIsFAQDialogOpen}>
        <DialogContent className="sm:max-w-[500px] dark:border-gray-700 dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="dark:text-gray-300">Category</Label>
              <Input
                value={faqCategory}
                onChange={(e) => setFaqCategory(e.target.value)}
                placeholder="e.g., General, Orders, Payment"
                className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <Label className="dark:text-gray-300">Question</Label>
              <Input
                value={faqQuestion}
                onChange={(e) => setFaqQuestion(e.target.value)}
                placeholder="Enter the question"
                className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <Label className="dark:text-gray-300">Answer</Label>
              <Textarea
                value={faqAnswer}
                onChange={(e) => setFaqAnswer(e.target.value)}
                placeholder="Enter the answer"
                rows={5}
                className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFAQDialogOpen(false)}
              className="dark:border-gray-700 dark:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveFAQ}
              className="bg-gradient-to-r from-orange-500 to-amber-500"
            >
              {editingFAQ ? 'Save Changes' : 'Add FAQ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
