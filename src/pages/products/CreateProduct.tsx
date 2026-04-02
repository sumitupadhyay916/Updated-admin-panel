import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  ArrowLeft, Plus, Trash2, ImageIcon, X, Package,
  Save, Rocket, ChevronRight, Upload, Star, Sparkles,
  Layers, Tag, DollarSign, Info, List,
} from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { productsApi, categoriesApi, sellersApi, subcategoriesApi } from '@/services/api';
import type { Subcategory } from '@/services/api';
import type { Category, Seller } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form, FormControl, FormField, FormItem, FormLabel,
  FormMessage, FormDescription,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ── Types ─────────────────────────────────────────────────────────────────────
interface VariantRow {
  attributes: Record<string, string>;
  price: number;
  mrp: number;
  stockQuantity: number;
  additionalInfo: { label: string; value: string }[];
}
interface ColorGroup {
  id: string;
  color: string;
  colorHex: string;
  hasColor: boolean;
  variantImage: string;       // single image for the variant
  productImages: string[];    // multiple images related to this variant
  variants: VariantRow[];
  description: string;        // per-color-group description
  variantImageUploading?: boolean;
  productImagesUploading?: boolean;
}
const makeColorGroup = (headers: string[] = ['Size', 'Quality']): ColorGroup => {
  const defaultAttributes: Record<string, string> = {};
  headers.forEach(h => defaultAttributes[h] = '');
  return {
    id: Math.random().toString(36).slice(2),
    color: '',
    colorHex: '#6366f1',
    hasColor: false,
    variantImage: '',
    productImages: [],
    description: '',
    variants: [{
      attributes: defaultAttributes,
      price: 0,
      mrp: 0,
      stockQuantity: 0,
      additionalInfo: [{ label: '', value: '' }]
    }],
  };
};

// ── Zod Schema ────────────────────────────────────────────────────────────────
const variantItemSchema = z.object({
  attributes: z.record(z.string(), z.string()).optional().default({}),
  color: z.string().optional().default(''),
  colorHex: z.string().optional().default(''),
  price: z.number().min(0).default(0),
  mrp: z.number().min(0).default(0),
  stockQuantity: z.number().min(0).default(0),
  images: z.array(z.string()).default([]),
});

const productFormSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().optional().default(''),
  categoryId: z.string().min(1, 'Category is required'),
  subcategoryId: z.string().optional(),
  sellerId: z.string().optional(),
  hasVariants: z.boolean().default(false),
  price: z.number().min(0).optional(),
  comparePrice: z.number().min(0).optional(),
  stock: z.enum(['available', 'unavailable']),
  stockQuantity: z.number().min(0).default(0),
  variants: z.array(variantItemSchema).optional().default([]),
  brand: z.string().optional(),
  care: z.string().optional(),
  materials: z.string().optional(),
  ageGroups: z.array(z.string()).optional().default([]),
  isNew: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  dimensions: z.object({
    h: z.number().optional().default(0),
    l: z.number().optional().default(0),
    w: z.number().optional().default(0),
  }).optional().default({ h: 0, l: 0, w: 0 }),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

// ── Helper Component for Status & Visibility ──────────────────────────────────
function StatusAndFlags({ form }: { form: UseFormReturn<ProductFormValues> }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Rocket className="h-4 w-4 text-indigo-500" />
        Product Status & Visibility
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="stock"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="available">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Active (Visible)
                    </span>
                  </SelectItem>
                  <SelectItem value="unavailable">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                      Draft (Hidden)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <div className="flex flex-col justify-end">
          <FormField control={form.control} name="isFeatured" render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-2.5 h-11">
              <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              <FormLabel className="font-normal cursor-pointer text-sm m-0 flex items-center gap-1.5 leading-none">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Featured Product
              </FormLabel>
            </FormItem>
          )} />
        </div>
      </div>
      <div className="flex gap-4">
        <FormField control={form.control} name="isNew" render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-2.5 flex-1 h-11">
            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            <FormLabel className="font-normal cursor-pointer text-sm m-0 leading-none">New Arrival</FormLabel>
          </FormItem>
        )} />
        <FormField control={form.control} name="isBestseller" render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-2.5 flex-1 h-11">
            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            <FormLabel className="font-normal cursor-pointer text-sm m-0 flex items-center gap-1.5 leading-none">
              <Star className="h-3.5 w-3.5 text-amber-500" />
              Bestseller
            </FormLabel>
          </FormItem>
        )} />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CreateProduct() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const isSeller = user?.role === 'seller';

  const backPath = location.pathname.replace('/create', '');

  const [categories, setCategories] = useState<Category[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isSubcategoriesLoading, setIsSubcategoriesLoading] = useState(false);

  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [hasVariants, setHasVariants] = useState(false);
  const [optionHeaders, setOptionHeaders] = useState<string[]>(['Size', 'Quality']);
  const [newHeaderName, setNewHeaderName] = useState('');
  const [isAddingHeader, setIsAddingHeader] = useState(false);
  const [colorGroups, setColorGroups] = useState<ColorGroup[]>([]);

  const [quickAddName, setQuickAddName] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<'draft' | 'publish'>('publish');
  const [editingVariant, setEditingVariant] = useState<{
    cgIdx: number;
    vIdx: number;
    color: string;
    attributes: Record<string, string>;
    additionalInfo: { label: string; value: string }[];
  } | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      categoryId: '',
      subcategoryId: '',
      sellerId: isSeller ? '' : '__my__',
      hasVariants: false,
      price: 0,
      comparePrice: 0,
      stock: 'available',
      stockQuantity: 0,
      variants: [],
      brand: '',
      care: '',
      materials: '',
      ageGroups: [],
      isNew: false,
      isBestseller: false,
      isFeatured: false,
      dimensions: { h: 0, l: 0, w: 0 },
    },
  });

  const loadCategories = useCallback(async () => {
    try {
      const res = await categoriesApi.getCategories({ page: 1, limit: 1000 });
      if (res.success && Array.isArray(res.data)) setCategories(res.data as Category[]);
    } catch { setCategories([]); }
  }, []);

  const loadSellers = useCallback(async () => {
    try {
      const res = await sellersApi.getSellers({ page: 1, limit: 1000 });
      if (res.success && Array.isArray(res.data)) setSellers(res.data as Seller[]);
    } catch { setSellers([]); }
  }, []);

  useEffect(() => {
    void loadCategories();
    if (!isSeller) void loadSellers();
  }, [loadCategories, loadSellers, isSeller]);

  const handleCategoryChange = async (val: string) => {
    form.setValue('categoryId', val);
    form.setValue('subcategoryId', '');
    setSubcategories([]);
    if (!val) return;
    setIsSubcategoriesLoading(true);
    try {
      const res = await subcategoriesApi.getByCategory(parseInt(val, 10));
      setSubcategories(res.success ? (res.data || []) : []);
    } catch { setSubcategories([]); }
    finally { setIsSubcategoriesLoading(false); }
  };

  const handleQuickAddSub = async () => {
    const catId = form.getValues('categoryId');
    if (!quickAddName || !catId) return;
    try {
      const slug = quickAddName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const res = await subcategoriesApi.create({ name: quickAddName, slug, categoryId: parseInt(catId, 10), description: '' });
      if (res.success && res.data) {
        const subRes = await subcategoriesApi.getByCategory(parseInt(catId, 10));
        if (subRes.success) {
          setSubcategories(subRes.data || []);
          form.setValue('subcategoryId', (res.data as Subcategory).id.toString());
        }
        toast.success('Subcategory created');
        setShowQuickAdd(false);
        setQuickAddName('');
      }
    } catch { toast.error('Failed to create subcategory'); }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setIsUploading(true);
    try {
      const results = await Promise.all(Array.from(files).map(f => productsApi.uploadImage(f)));
      const urls = results.filter(r => r.success && r.data?.url).map(r => r.data!.url);
      if (urls.length) { setUploadedImageUrls(prev => [...prev, ...urls]); toast.success(`${urls.length} image(s) uploaded`); }
      else toast.error('Failed to upload images');
    } catch { toast.error('Failed to upload images'); }
    finally { setIsUploading(false); }
  };

  const handleSubmit = async (values: ProductFormValues) => {
    if (hasVariants) {
      if (colorGroups.length === 0) { toast.error('Add at least one color group'); return; }
      for (const cg of colorGroups) {
        if (cg.variants.length === 0) { toast.error(`A variant group must have at least one variant set`); return; }
        for (const s of cg.variants) {
          if ((s.price ?? 0) <= 0) { toast.error(`Price must be > 0 for all variants`); return; }
          if ((s.mrp ?? 0) < (s.price ?? 0)) { toast.error(`MRP must be ≥ Price`); return; }
        }
      }
    }

    const flatVariants = hasVariants
      ? colorGroups.flatMap(cg => cg.variants.map(s => {
        const filteredInfo = s.additionalInfo
          .filter(item => item.label.trim() && item.value.trim())
          .map((item, idx) => ({
            label: item.label.trim(),
            value: item.value.trim(),
            sortOrder: idx
          }));

        return {
          color: cg.color,
          colorHex: cg.colorHex,
          attributes: s.attributes,
          price: s.price,
          mrp: s.mrp,
          stockQuantity: s.stockQuantity,
          specifications: filteredInfo,
          description: cg.description || '',
          images: [
            ...(cg.variantImage ? [cg.variantImage] : []),
            ...cg.productImages,
          ],
        };
      }))
      : [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      name: values.name,
      description: values.description,
      categoryId: parseInt(values.categoryId, 10),
      hasVariants,
      stock: submitMode === 'draft' ? 'unavailable' : values.stock,
      brand: values.brand,
      care: values.care,
      materials: values.materials,
      ageGroups: values.ageGroups,
      isNew: values.isNew,
      isBestseller: values.isBestseller,
      isFeatured: values.isFeatured,
      dimensions: values.dimensions,
    };

    if (values.subcategoryId && values.subcategoryId !== '__none__') {
      payload.subcategoryId = parseInt(values.subcategoryId, 10);
    }
    if (hasVariants) {
      payload.variants = flatVariants;
    } else {
      payload.price = values.price;
      payload.comparePrice = values.comparePrice;
      payload.stockQuantity = values.stockQuantity || 0;
      if (uploadedImageUrls.length > 0) payload.images = uploadedImageUrls;
    }
    if (!isSeller) {
      payload.sellerId = (!values.sellerId || values.sellerId === '__my__') ? user?.id : values.sellerId;
    }

    setIsSubmitting(true);
    try {
      const response = await productsApi.createProduct(payload);
      if (response.success && response.data) {
        toast.success(submitMode === 'draft' ? 'Product saved as draft!' : 'Product published successfully!');
        navigate(backPath);
      } else {
        toast.error(response.message || 'Failed to create product');
      }
    } catch (error: unknown) {
      const err = error as any;
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCg = (cgIdx: number, patch: Partial<ColorGroup>) =>
    setColorGroups(prev => prev.map((g, i) => i === cgIdx ? { ...g, ...patch } : g));
  const updateSize = (cgIdx: number, sIdx: number, patch: Partial<VariantRow>) =>
    setColorGroups(prev => prev.map((g, i) => i === cgIdx
      ? { ...g, variants: g.variants.map((s, si) => si === sIdx ? { ...s, ...patch } : s) } : g));

  // Upload single variant image (first uploader — always persists)
  const handleVariantImageUpload = async (cgIdx: number, files: FileList | null) => {
    if (!files || !files.length) return;
    updateCg(cgIdx, { variantImageUploading: true });
    try {
      const result = await productsApi.uploadImage(files[0]);
      if (result.success && result.data?.url) {
        updateCg(cgIdx, { variantImage: result.data!.url, variantImageUploading: false });
        toast.success('Variant image uploaded');
      } else { updateCg(cgIdx, { variantImageUploading: false }); toast.error('Upload failed'); }
    } catch { updateCg(cgIdx, { variantImageUploading: false }); toast.error('Upload failed'); }
  };

  // Upload multiple product images (second uploader — always persists)
  const handleProductImagesUpload = async (cgIdx: number, files: FileList | null) => {
    if (!files || !files.length) return;
    updateCg(cgIdx, { productImagesUploading: true });
    try {
      const results = await Promise.all(Array.from(files).map(f => productsApi.uploadImage(f)));
      const urls = results.filter(r => r.success && r.data?.url).map(r => r.data!.url);
      if (urls.length) {
        const current = colorGroups[cgIdx]?.productImages || [];
        updateCg(cgIdx, { productImages: [...current, ...urls], productImagesUploading: false });
        toast.success(`${urls.length} product image(s) uploaded`);
      } else { updateCg(cgIdx, { productImagesUploading: false }); toast.error('Upload failed'); }
    } catch { updateCg(cgIdx, { productImagesUploading: false }); toast.error('Upload failed'); }
  };

  const watchedCategoryId = form.watch('categoryId');

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* ── Sticky Header ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-gray-900/95 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => navigate(backPath)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">Add Product</span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button type="button" variant="outline" size="sm" disabled={isSubmitting} onClick={() => { setSubmitMode('draft'); form.handleSubmit(handleSubmit)(); }} className="gap-1.5">
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Save Draft</span>
            </Button>
            <Button type="button" size="sm" disabled={isSubmitting} onClick={() => { setSubmitMode('publish'); form.handleSubmit(handleSubmit)(); }} className="gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0">
              <Rocket className="h-4 w-4" />
              <span>{isSubmitting ? 'Publishing...' : 'Publish Product'}</span>
            </Button>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8 space-y-6">
            <div className="mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="h-6 w-6 text-indigo-600" />
                Add New Product
              </h1>
            </div>

            {/* 1. Basic Information section */}
            <Card className="shadow-sm border-0 ring-1 ring-gray-200 dark:ring-gray-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Info className="h-4 w-4 text-indigo-500" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl><Input placeholder="e.g. Premium Cotton T-Shirt" className="h-11 text-base" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea placeholder="Product features, materials, etc." rows={3} className="resize-none" {...field} /></FormControl>
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="categoryId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={handleCategoryChange} value={field.value}>
                        <FormControl><SelectTrigger className="h-11"><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                        <SelectContent>{categories.filter(c => c.status === 'active').map(cat => (<SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>))}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="subcategoryId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategory <span className="text-xs font-normal text-gray-400">(optional)</span></FormLabel>
                      <div className="flex gap-2">
                        <Select onValueChange={field.onChange} value={field.value || '__none__'} disabled={isSubcategoriesLoading || !watchedCategoryId}>
                          <FormControl><SelectTrigger className="flex-1 h-11"><SelectValue placeholder={isSubcategoriesLoading ? 'Loading...' : 'Select subcategory'} /></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="__none__">— None —</SelectItem>{subcategories.map(sub => (<SelectItem key={sub.id} value={sub.id.toString()}>{sub.name}</SelectItem>))}</SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="icon" onClick={() => setShowQuickAdd(v => !v)} disabled={!watchedCategoryId} className="h-11 w-11"><Plus className="h-4 w-4" /></Button>
                      </div>
                      {showQuickAdd && (
                        <div className="mt-2 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 space-y-2">
                          <Input placeholder="Subcategory name" value={quickAddName} onChange={e => setQuickAddName(e.target.value)} className="h-8 text-sm" />
                          <div className="flex gap-2">
                            <Button type="button" size="sm" className="h-7 text-xs" onClick={handleQuickAddSub} disabled={!quickAddName}>Add</Button>
                            <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowQuickAdd(false); setQuickAddName(''); }}>Cancel</Button>
                          </div>
                        </div>
                      )}
                    </FormItem>
                  )} />
                </div>

                {!isSeller && (
                  <FormField control={form.control} name="sellerId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seller</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="h-11"><SelectValue placeholder="Select seller" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="__my__">My Products (Self)</SelectItem>
                          {sellers.filter(s => s.status === 'active').map(s => (<SelectItem key={s.id} value={s.id}>{s.businessName} ({s.email})</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                )}
              </CardContent>
            </Card>

            {/* 2. Pricing & Inventory section */}
            <Card className="shadow-sm border-0 ring-1 ring-gray-200 dark:ring-gray-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-4 w-4 text-indigo-500" />
                  Pricing & Inventory
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">Product has variants</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Size/Colour variations</p>
                  </div>
                  <div className="flex rounded-lg border border-indigo-200 dark:border-indigo-800 overflow-hidden">
                    <button type="button" className={`px-4 py-1.5 text-sm font-medium transition-colors ${!hasVariants ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50'}`} onClick={() => setHasVariants(false)}>OFF</button>
                    <button type="button" className={`px-4 py-1.5 text-sm font-medium transition-colors ${hasVariants ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50'}`} onClick={() => setHasVariants(true)}>ON</button>
                  </div>
                </div>

                {hasVariants ? (
                  <div className="space-y-6">
                    {/* Variants UI */}
                    <div className="space-y-6">
                      {/* Configuration for Variant Fields */}
                      <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-4 shadow-sm">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Tag className="h-4 w-4 text-indigo-500" />
                            Variant Columns
                          </label>
                          <p className="text-xs text-gray-500">Define the attributes (like Size, Storage, Quality) for your variants.</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {optionHeaders.map((header, i) => (
                              <span key={i} className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium border border-indigo-100 dark:border-indigo-800">
                                {header}
                                {optionHeaders.length > 1 && (
                                  <button type="button" onClick={() => {
                                    setOptionHeaders(prev => prev.filter((_, idx) => idx !== i));
                                    setColorGroups(prev => prev.map(cg => ({
                                      ...cg,
                                      variants: cg.variants.map(v => {
                                        const newAttrs = { ...v.attributes };
                                        delete newAttrs[header];
                                        return { ...v, attributes: newAttrs };
                                      })
                                    })));
                                  }} className="ml-2 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
                                )}
                              </span>
                            ))}
                            {isAddingHeader ? (
                              <div className="flex items-center gap-1">
                                <Input autoFocus className="h-8 text-sm px-2 w-32" placeholder="e.g. Material" value={newHeaderName} onChange={e => setNewHeaderName(e.target.value)} onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const trimmed = newHeaderName.trim();
                                    if (trimmed && !optionHeaders.includes(trimmed)) {
                                      setOptionHeaders(prev => [...prev, trimmed]);
                                      setColorGroups(prev => prev.map(cg => ({
                                        ...cg,
                                        variants: cg.variants.map(v => ({
                                          ...v,
                                          attributes: { ...v.attributes, [trimmed]: '' }
                                        }))
                                      })));
                                      setNewHeaderName('');
                                      setIsAddingHeader(false);
                                    }
                                  }
                                }} />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const trimmed = newHeaderName.trim();
                                    if (trimmed && !optionHeaders.includes(trimmed)) {
                                      setOptionHeaders(prev => [...prev, trimmed]);
                                      setColorGroups(prev => prev.map(cg => ({
                                        ...cg,
                                        variants: cg.variants.map(v => ({
                                          ...v,
                                          attributes: { ...v.attributes, [trimmed]: '' }
                                        }))
                                      })));
                                      setNewHeaderName('');
                                      setIsAddingHeader(false);
                                    }
                                  }}
                                  className="text-indigo-600 hover:text-indigo-800 p-1 font-bold text-base"
                                  title="Confirm add"
                                >
                                  ✓
                                </button>
                                <button type="button" onClick={() => { setIsAddingHeader(false); setNewHeaderName(''); }} className="text-gray-400 hover:text-gray-600 p-1"><X className="h-4 w-4" /></button>
                              </div>
                            ) : (
                              <Button type="button" variant="outline" size="sm" className="h-8 text-xs border-dashed gap-1" onClick={() => setIsAddingHeader(true)}>
                                <Plus className="h-3.5 w-3.5" /> Add Column
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold flex items-center gap-2"><Layers className="h-4 w-4 text-indigo-500" />Color Variants</h3>
                          <Button type="button" variant="outline" size="sm" onClick={() => setColorGroups(prev => [...prev, makeColorGroup(optionHeaders)])} className="gap-1.5">
                            <Plus className="h-4 w-4" /> Add Variants
                          </Button>
                        </div>
                        <div className="space-y-4">
                          {colorGroups.map((cg, cgIdx) => (
                            <Card key={cg.id} className="border-2 border-indigo-100 dark:border-indigo-900 shadow-none">
                              <CardContent className="p-4 space-y-4">
                                <div className="flex items-center gap-3">
                                  {!cg.hasColor ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updateCg(cgIdx, { hasColor: true })}
                                      className="gap-1.5 h-10 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                    >
                                      <Plus className="h-4 w-4" /> Add Color
                                    </Button>
                                  ) : (
                                    <>
                                      <input
                                        type="color"
                                        className="h-10 w-10 rounded-lg border-2 cursor-pointer p-0.5 flex-shrink-0"
                                        value={cg.colorHex}
                                        onChange={e => updateCg(cgIdx, { colorHex: e.target.value })}
                                        title="Pick color hex"
                                      />
                                      <Input
                                        placeholder="Color name (e.g. Red)"
                                        className="h-10 flex-1"
                                        value={cg.color}
                                        onChange={e => updateCg(cgIdx, { color: e.target.value })}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateCg(cgIdx, { hasColor: false, color: '', colorHex: '#6366f1' })}
                                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg"
                                        title="Remove color info"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </>
                                  )}
                                  <div className="flex-1" />
                                  <button
                                    type="button"
                                    onClick={() => setColorGroups(prev => prev.filter((_, i) => i !== cgIdx))}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                                {/* Variant Image — single, uploader always persists */}
                                <div>
                                  <p className="text-xs font-medium text-gray-400 mb-1.5">Variant Image <span className="text-gray-300 font-normal">(1 image)</span></p>
                                  <div className="flex items-center gap-2">
                                    {cg.variantImage && (
                                      <div className="relative w-16 h-16 flex-shrink-0">
                                        <img src={cg.variantImage} className="w-full h-full rounded-lg object-cover border" />
                                        <button type="button" className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 text-white rounded-full shadow" onClick={() => updateCg(cgIdx, { variantImage: '' })}><X className="h-3 w-3" /></button>
                                      </div>
                                    )}
                                    <label className="flex items-center justify-center w-16 h-16 rounded-lg border-2 border-dashed cursor-pointer hover:border-indigo-400 flex-shrink-0">
                                      {cg.variantImageUploading ? <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full" /> : <ImageIcon className="h-5 w-5 text-gray-400" />}
                                      <input type="file" accept="image/*" className="hidden" disabled={cg.variantImageUploading} onChange={e => { handleVariantImageUpload(cgIdx, e.target.files); e.target.value = ''; }} />
                                    </label>
                                  </div>
                                </div>

                                {/* Product Images — multiple, uploader always persists */}
                                <div>
                                  <p className="text-xs font-medium text-gray-400 mb-1.5">Product Images <span className="text-gray-300 font-normal">(multiple)</span></p>
                                  <div className="flex flex-wrap gap-2">
                                    {cg.productImages.map((url, i) => (
                                      <div key={i} className="relative w-16 h-16"><img src={url} className="w-full h-full rounded-lg object-cover border" /><button type="button" className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 text-white rounded-full shadow" onClick={() => updateCg(cgIdx, { productImages: cg.productImages.filter((_, ii) => ii !== i) })}><X className="h-3 w-3" /></button></div>
                                    ))}
                                    <label className="flex items-center justify-center w-16 h-16 rounded-lg border-2 border-dashed cursor-pointer hover:border-indigo-400">
                                      {cg.productImagesUploading ? <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full" /> : <ImageIcon className="h-5 w-5 text-gray-400" />}
                                      <input type="file" accept="image/*" multiple className="hidden" disabled={cg.productImagesUploading} onChange={e => { handleProductImagesUpload(cgIdx, e.target.files); e.target.value = ''; }} />
                                    </label>
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-medium text-gray-400">Variant Pricing & Inventory</p>
                                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1 text-indigo-600" onClick={() => {
                                      const defaultAttributes: Record<string, string> = {};
                                      optionHeaders.forEach(h => defaultAttributes[h] = '');
                                      updateCg(cgIdx, {
                                        variants: [...cg.variants, {
                                          attributes: defaultAttributes,
                                          price: 0,
                                          mrp: 0,
                                          stockQuantity: 0,
                                          additionalInfo: [{ label: '', value: '' }]
                                        }]
                                      });
                                    }}><Plus className="h-3 w-3" /> Add Row</Button>
                                  </div>
                                  <div className="rounded-xl border overflow-x-auto">
                                    <table className="w-full text-xs min-w-[500px]">
                                      <thead className="bg-gray-50 dark:bg-gray-900">
                                        <tr>
                                          {optionHeaders.map((h, i) => (<th key={i} className="py-2.5 px-3 text-left font-semibold text-gray-500">{h}</th>))}
                                          <th className="py-2.5 px-3 text-left font-semibold text-gray-500">Price ₹</th>
                                          <th className="py-2.5 px-3 text-left font-semibold text-gray-500">MRP ₹</th>
                                          <th className="py-2.5 px-3 text-left font-semibold text-gray-500">Stock</th>
                                          <th className="py-2.5 px-3 text-left font-semibold text-gray-500">Specs</th>
                                          <th className="py-2.5 px-3 text-left font-semibold text-gray-500"></th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y">
                                        {cg.variants.map((vRow, vIdx) => (
                                          <tr key={vIdx}>
                                            {optionHeaders.map((h, i) => (
                                              <td key={i} className="p-1.5">
                                                <Input className="h-8 text-xs min-w-[80px]" placeholder={h} value={vRow.attributes[h] || ''} onChange={e => {
                                                  const newAttrs = { ...vRow.attributes, [h]: e.target.value };
                                                  updateSize(cgIdx, vIdx, { attributes: newAttrs });
                                                }} />
                                              </td>
                                            ))}
                                            <td className="p-1.5"><Input type="number" className="h-8 text-xs min-w-[70px]" value={vRow.price || ''} onChange={e => updateSize(cgIdx, vIdx, { price: parseFloat(e.target.value) || 0 })} /></td>
                                            <td className="p-1.5"><Input type="number" className="h-8 text-xs min-w-[70px]" value={vRow.mrp || ''} onChange={e => updateSize(cgIdx, vIdx, { mrp: parseFloat(e.target.value) || 0 })} /></td>
                                            <td className="p-1.5"><Input type="number" className="h-8 text-xs min-w-[60px]" value={vRow.stockQuantity || ''} onChange={e => updateSize(cgIdx, vIdx, { stockQuantity: parseInt(e.target.value, 10) || 0 })} /></td>
                                            <td className="p-1.5">
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-2 flex items-center gap-1.5 text-[11px]"
                                                onClick={() => setEditingVariant({
                                                  cgIdx,
                                                  vIdx,
                                                  color: cg.color,
                                                  attributes: vRow.attributes,
                                                  additionalInfo: [...vRow.additionalInfo]
                                                })}
                                              >
                                                <List className="h-3 w-3" />
                                                {vRow.additionalInfo.filter(i => i.label.trim()).length > 0 ? (
                                                  <span className="bg-primary/10 text-primary px-1 rounded-sm">
                                                    {vRow.additionalInfo.filter(i => i.label.trim()).length}
                                                  </span>
                                                ) : 'Add'}
                                              </Button>
                                            </td>
                                            <td className="p-1.5"><button type="button" onClick={() => updateCg(cgIdx, { variants: cg.variants.filter((_, vi) => vi !== vIdx) })} className="p-1 text-red-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button></td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* Per-color description */}
                                <div className="space-y-2 mt-4">
                                  <label className="text-sm font-medium">Description</label>
                                  <Textarea
                                    value={cg.description || ''}
                                    onChange={(e) => updateCg(cgIdx, { description: e.target.value })}
                                    placeholder="Enter description for this color variant"
                                    rows={3}
                                    className="resize-none"
                                  />
                                </div>

                                {/* Additional Information Section (Legacy per-color removed) */}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <StatusAndFlags form={form} />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="price" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Selling Price (₹) <span className="text-red-500">*</span></FormLabel>
                          <FormControl><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span><Input type="number" step="0.01" className="pl-7 h-11" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} value={field.value || 0} /></div></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="comparePrice" render={({ field }) => (
                        <FormItem>
                          <FormLabel>MRP (₹)</FormLabel>
                          <FormControl><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span><Input type="number" step="0.01" className="pl-7 h-11" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} value={field.value || 0} /></div></FormControl>
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="stockQuantity" render={({ field }) => (
                      <FormItem className="max-w-[calc(50%-8px)]">
                        <FormLabel>Initial Quantity</FormLabel>
                        <FormControl><Input type="number" min="0" step="1" className="h-11" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} value={field.value || 0} /></FormControl>
                        <FormDescription>Starting stock count</FormDescription>
                      </FormItem>
                    )} />

                    <Separator />
                    <StatusAndFlags form={form} />
                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2"><ImageIcon className="h-4 w-4 text-indigo-500" />Product Images</h3>
                      {uploadedImageUrls.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                          {uploadedImageUrls.map((url, idx) => (
                            <div key={idx} className="relative aspect-square group">
                              <img src={url} className="w-full h-full rounded-xl object-cover border-2 border-gray-100" />
                              <button type="button" onClick={() => setUploadedImageUrls(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 shadow-sm"><X className="h-3 w-3" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 group transition-all">
                        {isUploading ? <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" /> : <Upload className="h-5 w-5 text-indigo-400 group-hover:text-indigo-600" />}
                        <p className="text-xs font-medium text-gray-500 mt-2">Upload images</p>
                        <input type="file" multiple className="hidden" disabled={isUploading} onChange={e => { handleImageUpload(e.target.files); e.target.value = ''; }} />
                      </label>
                    </div>
                  </div>
                )}


                {/* Shared Product Details Section */}
                <div className="space-y-6 pt-6 border-t border-gray-200">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Tag className="h-4 w-4 text-indigo-500" />
                      Extended Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="brand" render={({ field }) => (
                        <FormItem><FormLabel>Brand</FormLabel><FormControl><Input placeholder="Brand name" {...field} value={field.value || ''} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="materials" render={({ field }) => (
                        <FormItem><FormLabel>Materials</FormLabel><FormControl><Input placeholder="e.g. Cotton" {...field} value={field.value || ''} /></FormControl></FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="care" render={({ field }) => (
                      <FormItem><FormLabel>Care Instructions</FormLabel><FormControl><Input placeholder="Care guidelines" {...field} value={field.value || ''} /></FormControl></FormItem>
                    )} />
                    <div className="grid grid-cols-3 gap-3">
                      <FormField control={form.control} name="dimensions.l" render={({ field }) => (<FormItem><FormLabel className="text-xs">Len (cm)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="dimensions.w" render={({ field }) => (<FormItem><FormLabel className="text-xs">Wid (cm)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="dimensions.h" render={({ field }) => (<FormItem><FormLabel className="text-xs">Hei (cm)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl></FormItem>)} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="pt-6 flex items-center justify-end gap-3 pb-20">
              <Button type="button" variant="ghost" onClick={() => navigate(backPath)} className="text-gray-500">Cancel</Button>
              <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => { setSubmitMode('draft'); form.handleSubmit(handleSubmit)(); }} className="gap-2">
                <Save className="h-4 w-4" /> Save as Draft
              </Button>
              <Button type="button" disabled={isSubmitting} onClick={() => { setSubmitMode('publish'); form.handleSubmit(handleSubmit)(); }} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 px-8">
                <Rocket className="h-4 w-4" /> Publish Product
              </Button>
            </div>
          </div>
        </form>
      </Form>
      {editingVariant && (
        <Dialog open={!!editingVariant} onOpenChange={(open) => !open && setEditingVariant(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
            <div className="p-6 border-b">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <List className="h-5 w-5 text-primary" />
                  Variant Specifications
                  <span className="text-xs font-normal text-muted-foreground ml-2">
                    {editingVariant.color || 'Variant'} / {Object.values(editingVariant.attributes).filter(Boolean).join(' - ') || 'Default'}
                  </span>
                </DialogTitle>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pt-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground italic">
                    Add custom labels and values specifically for this SKU.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() => {
                      const newInfo = [...editingVariant.additionalInfo, { label: '', value: '' }];
                      setEditingVariant({ ...editingVariant, additionalInfo: newInfo });
                      updateSize(editingVariant.cgIdx, editingVariant.vIdx, { additionalInfo: newInfo });
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add Row
                  </Button>
                </div>

                <div className="grid gap-3">
                  {editingVariant.additionalInfo.map((info, idx) => (
                    <div key={idx} className="flex gap-3 items-start group">
                      <div className="flex-1">
                        <Input
                          placeholder="Label (e.g. Material)"
                          value={info.label}
                          onChange={(e) => {
                            const newInfo = [...editingVariant.additionalInfo];
                            newInfo[idx] = { ...newInfo[idx], label: e.target.value };
                            setEditingVariant({ ...editingVariant, additionalInfo: newInfo });
                            updateSize(editingVariant.cgIdx, editingVariant.vIdx, { additionalInfo: newInfo });
                          }}
                          className="h-10"
                        />
                      </div>
                      <div className="flex-[1.5]">
                        <Input
                          placeholder="Value (e.g. 100% Leather)"
                          value={info.value}
                          onChange={(e) => {
                            const newInfo = [...editingVariant.additionalInfo];
                            newInfo[idx] = { ...newInfo[idx], value: e.target.value };
                            setEditingVariant({ ...editingVariant, additionalInfo: newInfo });
                            updateSize(editingVariant.cgIdx, editingVariant.vIdx, { additionalInfo: newInfo });
                          }}
                          className="h-10"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          const newInfo = editingVariant.additionalInfo.filter((_, i) => i !== idx);
                          const finalInfo = newInfo.length > 0 ? newInfo : [{ label: '', value: '' }];
                          setEditingVariant({ ...editingVariant, additionalInfo: finalInfo });
                          updateSize(editingVariant.cgIdx, editingVariant.vIdx, { additionalInfo: finalInfo });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 dark:bg-gray-900/50 flex justify-end">
              <Button type="button" onClick={() => setEditingVariant(null)} className="h-9 px-8">
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
