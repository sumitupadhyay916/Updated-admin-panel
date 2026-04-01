import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft, Save, Loader2, X, Upload, ChevronRight, Package, Info, DollarSign,
  ImageIcon, Layers, Rocket, Sparkles, Star, Plus, Trash2, Tag, List,
} from 'lucide-react';

import { productsApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  hasColor: boolean;      // NEW: flag for optional color
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

interface Product {
  id: number;
  pid: string;
  name: string;
  description?: string;
  deity?: string;
  material?: string;
  height?: number;
  weight?: number;
  categoryId: number;
  categoryName: string;
  subcategoryId?: number;
  price: number;
  comparePrice?: number;
  stock: 'available' | 'unavailable';
  stockQuantity: number;
  lowStockThreshold: number;
  images: string[];
  sellerId: string;
  sellerName: string;
  hasVariants?: boolean;
  variants?: any[];
  isFeatured: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function EditProduct() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const backPath = location.pathname.replace(`/${id}/edit`, '');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingVariant, setEditingVariant] = useState<{
    cgIdx: number;
    vIdx: number;
    color: string;
    attributes: Record<string, string>;
    additionalInfo: { label: string; value: string }[];
  } | null>(null);
  const [product, setProduct] = useState<Product | null>(null);

  // Toggle state for hasVariants
  const [hasVariants, setHasVariants] = useState(false);
  const [optionHeaders, setOptionHeaders] = useState<string[]>(['Size', 'Quality']);
  const [newHeaderName, setNewHeaderName] = useState('');
  const [isAddingHeader, setIsAddingHeader] = useState(false);

  // Non-variant data (preserved when toggling)
  const [nonVariantData, setNonVariantData] = useState({
    price: '',
    comparePrice: '',
    stockQuantity: '',
    images: [] as string[],
  });

  // Variant data (preserved when toggling)
  const [colorGroups, setColorGroups] = useState<ColorGroup[]>([]);

  // Common form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    stock: 'available' as 'available' | 'unavailable',
    deity: '',
    material: '',
    height: '',
    weight: '',
    lowStockThreshold: '',
    isFeatured: false,
    isNew: false,
    isBestseller: false,
  });

  const [additionalInfo, setAdditionalInfo] = useState<{ label: string; value: string }[]>([{ label: '', value: '' }]);

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const response = await productsApi.getProductById(id);
        if (response.success && response.data) {
          const prod = response.data as Product;
          setProduct(prod);

          // Set hasVariants toggle
          setHasVariants(prod.hasVariants || false);

          // Set common form data
          setFormData({
            name: prod.name || '',
            description: prod.description || '',
            stock: prod.stock || 'available',
            deity: prod.deity || '',
            material: prod.material || '',
            height: prod.height?.toString() || '',
            weight: prod.weight?.toString() || '',
            lowStockThreshold: prod.lowStockThreshold?.toString() || '5',
            isFeatured: prod.isFeatured || false,
            isNew: prod.isNew || false,
            isBestseller: prod.isBestseller || false,
          });

          // Load additionalInfo from metadata
          const meta = (prod as any).metadata || {};
          if (meta.additionalInfo && Array.isArray(meta.additionalInfo)) {
            setAdditionalInfo(meta.additionalInfo.length > 0
              ? meta.additionalInfo
              : [{ label: '', value: '' }]
            );
          }

          // Set non-variant data
          setNonVariantData({
            price: prod.price?.toString() || '',
            comparePrice: prod.comparePrice?.toString() || '',
            stockQuantity: prod.stockQuantity?.toString() || '0',
            images: Array.isArray(prod.images) ? prod.images.map((img: any) => typeof img === 'string' ? img : img.url) : [],
          });

          // Set variant data if exists
          if (prod.hasVariants && prod.variants && prod.variants.length > 0) {
            // Group variants by color
            const colorMap = new Map<string, ColorGroup>();
            const extractedHeaders = new Set<string>();


            prod.variants.forEach((v: any) => {
              const colorKey = v.color || 'default';
              if (!colorMap.has(colorKey)) {
                colorMap.set(colorKey, {
                  id: Math.random().toString(36).slice(2),
                  color: v.color || '',
                  colorHex: v.colorHex || '#6366f1',
                  hasColor: !!(v.color || v.colorHex),
                  variantImage: '',
                  productImages: [],
                  variants: [],
                  images: [], // Temporary storage for aggregation
                } as any);
              }

              const group = colorMap.get(colorKey)! as any;

              // Collect images for this color group if not already set
              if (v.images && Array.isArray(v.images) && group.images.length === 0) {
                group.images = v.images.map((img: any) => typeof img === 'string' ? img : img.url);
              }

              const attrs: Record<string, string> = v.attributes || {};
              if (Object.keys(attrs).length === 0) {
                if (v.size) attrs['Size'] = v.size;
                if (v.quality) attrs['Quality'] = v.quality;
              }
              Object.keys(attrs).forEach(k => extractedHeaders.add(k));

              group.variants.push({
                attributes: attrs,
                price: v.price || 0,
                mrp: v.mrp || v.comparePrice || 0,
                stockQuantity: v.stockQuantity || 0,
                additionalInfo: (v.specifications && v.specifications.length > 0)
                  ? v.specifications.map((s: any) => ({ label: s.label, value: s.value }))
                  : [{ label: '', value: '' }],
              });
              // Set description from first variant in the group
              if (!group.description && v.description) {
                group.description = v.description;
              }
            });

            if (extractedHeaders.size > 0) {
              setOptionHeaders(Array.from(extractedHeaders));
            }

            // Map legacy images array: first image → variantImage, rest → productImages
            setColorGroups(Array.from(colorMap.values()).map(g => {
              const allImgs: string[] = (g as any).images || [];
              const { images, ...rest } = g as any;
              return {
                ...rest,
                variantImage: allImgs[0] || '',
                productImages: allImgs.slice(1),
              };
            }));
          } else {
            // Initialize with one empty color group if no variants
            setColorGroups([makeColorGroup(['Size', 'Quality'])]);
          }
        } else {
          toast.error('Product not found');
          navigate(backPath);
        }
      } catch (error) {
        toast.error('Failed to load product');
        navigate(backPath);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, navigate, backPath]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const largeFiles = files.filter(f => f.size > 10 * 1024 * 1024);
    if (largeFiles.length > 0) {
      toast.error('Some images exceed the 10MB limit');
    }

    const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024);
    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = validFiles.map(file => productsApi.uploadImage(file));
      const results = await Promise.all(uploadPromises);

      const successfulUrls = results
        .filter(r => r.success && r.data?.url)
        .map(r => r.data!.url);

      if (successfulUrls.length > 0) {
        setNonVariantData(prev => ({
          ...prev,
          images: [...prev.images, ...successfulUrls],
        }));
        toast.success(`${successfulUrls.length} image(s) uploaded successfully`);
      }
    } catch (error) {
      toast.error('Failed to upload image(s)');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setNonVariantData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Upload single variant image (first uploader — always persists)
  const handleVariantImageUpload = async (cgIdx: number, files: FileList | null) => {
    if (!files || !files.length) return;
    setColorGroups(prev => prev.map((g, i) => i === cgIdx ? { ...g, variantImageUploading: true } : g));
    try {
      const result = await productsApi.uploadImage(files[0]);
      if (result.success && result.data?.url) {
        setColorGroups(prev => prev.map((g, i) =>
          i === cgIdx ? { ...g, variantImage: result.data!.url, variantImageUploading: false } : g
        ));
        toast.success('Variant image uploaded');
      } else {
        setColorGroups(prev => prev.map((g, i) => i === cgIdx ? { ...g, variantImageUploading: false } : g));
        toast.error('Upload failed');
      }
    } catch {
      setColorGroups(prev => prev.map((g, i) => i === cgIdx ? { ...g, variantImageUploading: false } : g));
      toast.error('Upload failed');
    }
  };

  // Upload multiple product images (second uploader — always persists)
  const handleProductImagesUpload = async (cgIdx: number, files: FileList | null) => {
    if (!files || !files.length) return;
    setColorGroups(prev => prev.map((g, i) => i === cgIdx ? { ...g, productImagesUploading: true } : g));
    try {
      const results = await Promise.all(Array.from(files).map(f => productsApi.uploadImage(f)));
      const urls = results.filter(r => r.success && r.data?.url).map(r => r.data!.url);
      if (urls.length) {
        setColorGroups(prev => prev.map((g, i) =>
          i === cgIdx ? { ...g, productImages: [...g.productImages, ...urls], productImagesUploading: false } : g
        ));
        toast.success(`${urls.length} product image(s) uploaded`);
      } else {
        setColorGroups(prev => prev.map((g, i) => i === cgIdx ? { ...g, productImagesUploading: false } : g));
        toast.error('Upload failed');
      }
    } catch {
      setColorGroups(prev => prev.map((g, i) => i === cgIdx ? { ...g, productImagesUploading: false } : g));
      toast.error('Upload failed');
    }
  };

  const updateCg = (cgIdx: number, patch: Partial<ColorGroup>) =>
    setColorGroups(prev => prev.map((g, i) => i === cgIdx ? { ...g, ...patch } : g));

  const updateSize = (cgIdx: number, sIdx: number, patch: Partial<VariantRow>) =>
    setColorGroups(prev => prev.map((g, i) => i === cgIdx
      ? { ...g, variants: g.variants.map((s, si) => si === sIdx ? { ...s, ...patch } : s) } : g));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    // Validate based on hasVariants
    if (hasVariants) {
      if (colorGroups.length === 0) {
        toast.error('Add at least one variant group');
        return;
      }
      for (const cg of colorGroups) {
        if (cg.variants.length === 0) {
          toast.error(`A variant group must have at least one variant set`);
          return;
        }
        for (const s of cg.variants) {
          if ((s.price ?? 0) <= 0) {
            toast.error(`Price must be > 0 for all variants`);
            return;
          }
          if ((s.mrp ?? 0) < (s.price ?? 0)) {
            toast.error(`MRP must be ≥ Price`);
            return;
          }
        }
      }
    } else {
      if (!nonVariantData.price || parseFloat(nonVariantData.price) <= 0) {
        toast.error('Valid price is required');
        return;
      }
    }

    setSaving(true);
    try {
      const updateData: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        stock: formData.stock,
        deity: formData.deity || undefined,
        material: formData.material || undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        lowStockThreshold: formData.lowStockThreshold ? parseInt(formData.lowStockThreshold, 10) : 5,
        isFeatured: formData.isFeatured,
        isNew: formData.isNew,
        isBestseller: formData.isBestseller,
        hasVariants,
        additionalInfo: additionalInfo.filter(item => item.label.trim() && item.value.trim()),
      };

      if (hasVariants) {
        // Build flat variants array
        const flatVariants = colorGroups.flatMap(cg => cg.variants.map(s => {
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
        }));

        updateData.variants = flatVariants;
      } else {
        updateData.price = parseFloat(nonVariantData.price);
        updateData.comparePrice = nonVariantData.comparePrice ? parseFloat(nonVariantData.comparePrice) : undefined;
        updateData.stockQuantity = nonVariantData.stockQuantity ? parseInt(nonVariantData.stockQuantity, 10) : 0;
        updateData.images = nonVariantData.images;
      }

      const response = await productsApi.updateProduct(product.id, updateData);
      if (response.success) {
        toast.success('Product updated successfully');
        navigate(backPath);
      }
    } catch (error) {
      toast.error('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <div className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-gray-900/95 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => navigate(backPath)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">Edit Product</span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={() => navigate(backPath)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" size="sm" disabled={saving} onClick={handleSubmit} className="gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8 space-y-6">
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="h-6 w-6 text-indigo-600" />
              Edit Product
            </h1>
            <p className="text-sm text-gray-500 mt-1">Product ID: {product.pid}</p>
          </div>

          {/* Basic Information */}
          <Card className="shadow-sm border-0 ring-1 ring-gray-200 dark:ring-gray-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4 text-indigo-500" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter product name"
                  className="h-11"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={product.categoryName} disabled className="bg-gray-50 h-11" />
                </div>

                <div className="space-y-2">
                  <Label>Subcategory</Label>
                  <Input value={product.subcategoryId ? (product as any).subcategoryName || 'No subcategory' : 'None'} disabled className="bg-gray-50 h-11" />
                </div>

                <div className="space-y-2">
                  <Label>Seller</Label>
                  <Input value={product.sellerName} disabled className="bg-gray-50 h-11" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Inventory */}
          <Card className="shadow-sm border-0 ring-1 ring-gray-200 dark:ring-gray-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4 text-indigo-500" />
                Pricing & Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Has Variants Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900">
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">Product has variants</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Size/Colour variations</p>
                </div>
                <div className="flex rounded-lg border border-indigo-200 dark:border-indigo-800 overflow-hidden">
                  <button
                    type="button"
                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${!hasVariants ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50'}`}
                    onClick={() => setHasVariants(false)}
                  >
                    OFF
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${hasVariants ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50'}`}
                    onClick={() => setHasVariants(true)}
                  >
                    ON
                  </button>
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
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <Layers className="h-4 w-4 text-indigo-500" />
                          Color Variants
                        </h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setColorGroups(prev => [...prev, makeColorGroup(optionHeaders)])}
                          className="gap-1.5"
                        >
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
                                <p className="text-xs font-medium text-gray-400 mb-1.5">Variant Image <span className="text-gray-300 font-normal"></span></p>
                                <div className="flex items-center gap-2">
                                  {cg.variantImage && (
                                    <div className="relative w-16 h-16 flex-shrink-0">
                                      <img src={cg.variantImage} className="w-full h-full rounded-lg object-cover border" />
                                      <button
                                        type="button"
                                        className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 text-white rounded-full shadow"
                                        onClick={() => updateCg(cgIdx, { variantImage: '' })}
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                  <label className="flex items-center justify-center w-16 h-16 rounded-lg border-2 border-dashed cursor-pointer hover:border-indigo-400 flex-shrink-0">
                                    {cg.variantImageUploading ? (
                                      <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
                                    ) : (
                                      <ImageIcon className="h-5 w-5 text-gray-400" />
                                    )}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      disabled={cg.variantImageUploading}
                                      onChange={e => { handleVariantImageUpload(cgIdx, e.target.files); e.target.value = ''; }}
                                    />
                                  </label>
                                </div>
                              </div>

                              {/* Product Images — multiple, uploader always persists */}
                              <div>
                                <p className="text-xs font-medium text-gray-400 mb-1.5">Product Images <span className="text-gray-300 font-normal">(multiple product images)</span></p>
                                <div className="flex flex-wrap gap-2">
                                  {cg.productImages.map((url, i) => (
                                    <div key={i} className="relative w-16 h-16">
                                      <img src={url} className="w-full h-full rounded-lg object-cover border" />
                                      <button
                                        type="button"
                                        className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 text-white rounded-full shadow"
                                        onClick={() => updateCg(cgIdx, { productImages: cg.productImages.filter((_, ii) => ii !== i) })}
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                  <label className="flex items-center justify-center w-16 h-16 rounded-lg border-2 border-dashed cursor-pointer hover:border-indigo-400">
                                    {cg.productImagesUploading ? (
                                      <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
                                    ) : (
                                      <ImageIcon className="h-5 w-5 text-gray-400" />
                                    )}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      className="hidden"
                                      disabled={cg.productImagesUploading}
                                      onChange={e => { handleProductImagesUpload(cgIdx, e.target.files); e.target.value = ''; }}
                                    />
                                  </label>
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-medium text-gray-400">Variant Pricing & Inventory</p>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs gap-1 text-indigo-600"
                                    onClick={() => {
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
                                    }}
                                  >
                                    <Plus className="h-3 w-3" /> Add Row
                                  </Button>
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
                                              ) : 'Add More Specs'}
                                            </Button>
                                          </td>
                                          <td className="p-1.5"><button type="button" onClick={() => updateCg(cgIdx, { variants: cg.variants.filter((_, vi) => vi !== vIdx) })} className="p-1 text-red-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button></td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
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
                              </div>

                              {/* Additional Information Section (Legacy per-color removed) */}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Rocket className="h-4 w-4 text-indigo-500" />
                      <h3 className="text-sm font-semibold">Product Status & Visibility</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={formData.stock} onValueChange={(v: any) => setFormData(p => ({ ...p, stock: v }))}>
                          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500" />Active (Visible)</span></SelectItem>
                            <SelectItem value="unavailable"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-400" />Draft (Hidden)</span></SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col justify-end">
                        <div className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-2.5 h-11">
                          <Checkbox checked={formData.isFeatured} onCheckedChange={(v) => setFormData(p => ({ ...p, isFeatured: !!v }))} />
                          <Label className="font-normal cursor-pointer text-sm m-0 flex items-center gap-1.5 leading-none"><Sparkles className="h-3.5 w-3.5 text-amber-500" />Featured Product</Label>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-2.5 flex-1 h-11">
                        <Checkbox checked={formData.isNew} onCheckedChange={(v) => setFormData(p => ({ ...p, isNew: !!v }))} />
                        <Label className="font-normal cursor-pointer text-sm m-0 leading-none">New Arrival</Label>
                      </div>
                      <div className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-2.5 flex-1 h-11">
                        <Checkbox checked={formData.isBestseller} onCheckedChange={(v) => setFormData(p => ({ ...p, isBestseller: !!v }))} />
                        <Label className="font-normal cursor-pointer text-sm m-0 flex items-center gap-1.5 leading-none"><Star className="h-3.5 w-3.5 text-amber-500" />Bestseller</Label>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Product Images for non-variant */}
                  <div className="space-y-2">
                    <Label>Product Images</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {nonVariantData.images.map((url, index) => (
                        <div key={index} className="relative group aspect-square">
                          <img
                            src={url}
                            alt={`Product ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg border-2 border-gray-100"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 group transition-all">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                        {uploading ? (
                          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        ) : (
                          <>
                            <Upload className="h-5 w-5 text-indigo-400 group-hover:text-indigo-600" />
                            <span className="text-xs text-gray-500 mt-1">Upload</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₹) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={nonVariantData.price}
                        onChange={(e) => setNonVariantData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="0.00"
                        className="h-11"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="comparePrice">Compare Price (₹)</Label>
                      <Input
                        id="comparePrice"
                        type="number"
                        step="0.01"
                        value={nonVariantData.comparePrice}
                        onChange={(e) => setNonVariantData(prev => ({ ...prev, comparePrice: e.target.value }))}
                        placeholder="0.00"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stockQuantity">Stock Quantity</Label>
                      <Input
                        id="stockQuantity"
                        type="number"
                        value={nonVariantData.stockQuantity}
                        onChange={(e) => setNonVariantData(prev => ({ ...prev, stockQuantity: e.target.value }))}
                        placeholder="0"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                      <Input
                        id="lowStockThreshold"
                        type="number"
                        value={formData.lowStockThreshold}
                        onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
                        placeholder="5"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Rocket className="h-4 w-4 text-indigo-500" />
                      <h3 className="text-sm font-semibold">Product Status & Visibility</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={formData.stock} onValueChange={(v: any) => setFormData(p => ({ ...p, stock: v }))}>
                          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500" />Active (Visible)</span></SelectItem>
                            <SelectItem value="unavailable"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-400" />Draft (Hidden)</span></SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col justify-end">
                        <div className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-2.5 h-11">
                          <Checkbox checked={formData.isFeatured} onCheckedChange={(v) => setFormData(p => ({ ...p, isFeatured: !!v }))} />
                          <Label className="font-normal cursor-pointer text-sm m-0 flex items-center gap-1.5 leading-none"><Sparkles className="h-3.5 w-3.5 text-amber-500" />Featured Product</Label>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-2.5 flex-1 h-11">
                        <Checkbox checked={formData.isNew} onCheckedChange={(v) => setFormData(p => ({ ...p, isNew: !!v }))} />
                        <Label className="font-normal cursor-pointer text-sm m-0 leading-none">New Arrival</Label>
                      </div>
                      <div className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-2.5 flex-1 h-11">
                        <Checkbox checked={formData.isBestseller} onCheckedChange={(v) => setFormData(p => ({ ...p, isBestseller: !!v }))} />
                        <Label className="font-normal cursor-pointer text-sm m-0 flex items-center gap-1.5 leading-none"><Star className="h-3.5 w-3.5 text-amber-500" />Bestseller</Label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Shared Product Details Section */}

              <div className="space-y-6 pt-6 border-t border-gray-200">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-500" />
                    <h3 className="text-sm font-semibold">Extended Details</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deity">Deity</Label>
                      <Input id="deity" value={formData.deity} onChange={e => setFormData(p => ({ ...p, deity: e.target.value }))} placeholder="e.g. Ganesh" className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material">Material</Label>
                      <Input id="material" value={formData.material} onChange={e => setFormData(p => ({ ...p, material: e.target.value }))} placeholder="e.g. Brass" className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input id="height" type="number" step="0.1" value={formData.height} onChange={e => setFormData(p => ({ ...p, height: e.target.value }))} placeholder="0.0" className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (g)</Label>
                      <Input id="weight" type="number" step="0.1" value={formData.weight} onChange={e => setFormData(p => ({ ...p, weight: e.target.value }))} placeholder="0.0" className="h-11" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

          </Card>

          <div className="pt-6 flex items-center justify-end gap-3 pb-20">
            <Button type="button" variant="ghost" onClick={() => navigate(backPath)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 px-8">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
      {editingVariant && (
        <Dialog open={!!editingVariant} onOpenChange={(open) => !open && setEditingVariant(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
            <div className="p-6 border-b">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <List className="h-5 w-5 text-primary" />
                  Variant Specifications
                  {/* <span className="text-xs font-normal text-muted-foreground ml-2">
                    {editingVariant.color || 'Variant'} / {Object.values(editingVariant.attributes).filter(Boolean).join(' - ') || 'Default'}
                  </span> */}
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
