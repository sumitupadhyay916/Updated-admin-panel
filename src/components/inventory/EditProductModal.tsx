import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { productsApi } from '@/services/api';
import { Loader2, X, Upload } from 'lucide-react';

interface Product {
  id: number;
  pid: string;
  name: string;
  description?: string;
  deity?: string;
  material?: string;
  height?: number;
  weight?: number;
  handcrafted?: boolean;
  occasion?: string[];
  religionCategory?: string;
  packagingType?: string;
  fragile?: boolean;
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
  isFeatured: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface EditProductModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProductModal({ product, open, onClose, onSuccess }: EditProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    stock: 'available' as 'available' | 'unavailable',
    stockQuantity: '',
    images: [] as string[],
    deity: '',
    material: '',
    height: '',
    weight: '',
    lowStockThreshold: '',
  });
  const [stockAdjustment, setStockAdjustment] = useState<string>('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        comparePrice: product.comparePrice?.toString() || '',
        stock: product.stock || 'available',
        stockQuantity: product.stockQuantity?.toString() || '0',
        images: product.images || [],
        deity: product.deity || '',
        material: product.material || '',
        height: product.height?.toString() || '',
        weight: product.weight?.toString() || '',
        lowStockThreshold: product.lowStockThreshold?.toString() || '5',
      });
      setStockAdjustment('');
    }
  }, [product]);

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
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...successfulUrls],
        }));
        toast.success(`${successfulUrls.length} image(s) uploaded successfully`);
      }
    } catch (error) {
      toast.error('Failed to upload image(s)');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleStockAdjustment = async () => {
    if (!product || !stockAdjustment) return;

    const adjustment = parseInt(stockAdjustment, 10);
    if (isNaN(adjustment) || adjustment === 0) {
      toast.error('Please enter a valid adjustment value');
      return;
    }

    try {
      await productsApi.adjustProductStock(product.id, adjustment);
      toast.success(`Stock adjusted by ${adjustment > 0 ? '+' : ''}${adjustment}`);
      setStockAdjustment('');
      onSuccess();
    } catch (error) {
      toast.error('Failed to adjust stock');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Valid price is required');
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : undefined,
        stock: formData.stock,
        stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity, 10) : 0,
        images: formData.images,
        deity: formData.deity || undefined,
        material: formData.material || undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        lowStockThreshold: formData.lowStockThreshold ? parseInt(formData.lowStockThreshold, 10) : 5,
      };

      const response = await productsApi.updateProduct(product.id, updateData);
      if (response.success) {
        toast.success('Product updated successfully');
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast.error('Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Images */}
          <div className="space-y-2">
            <Label>Product Images</Label>
            <div className="grid grid-cols-4 gap-4">
              {formData.images.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Product ${index + 1}`}
                    className="w-full h-24 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded cursor-pointer hover:border-orange-500 transition-colors">
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
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="text-xs text-gray-500 mt-1">Upload</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter product description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comparePrice">Compare Price (₹)</Label>
              <Input
                id="comparePrice"
                type="number"
                step="0.01"
                value={formData.comparePrice}
                onChange={(e) => setFormData(prev => ({ ...prev, comparePrice: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock Status</Label>
              <Select
                value={formData.stock}
                onValueChange={(value: 'available' | 'unavailable') =>
                  setFormData(prev => ({ ...prev, stock: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockQuantity">Stock Quantity</Label>
              <Input
                id="stockQuantity"
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: e.target.value }))}
                placeholder="0"
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
              />
            </div>
          </div>

          {/* Stock Adjustment */}
          <div className="border-t pt-4">
            <Label className="text-base font-semibold mb-3 block">Quick Stock Adjustment</Label>
            <div className="flex items-center gap-2">
              <Select value={stockAdjustment} onValueChange={setStockAdjustment}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select adjustment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">+5</SelectItem>
                  <SelectItem value="10">+10</SelectItem>
                  <SelectItem value="20">+20</SelectItem>
                  <SelectItem value="-5">-5</SelectItem>
                  <SelectItem value="-10">-10</SelectItem>
                  <SelectItem value="-20">-20</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              {stockAdjustment === 'custom' && (
                <Input
                  type="number"
                  placeholder="Enter value"
                  className="w-32"
                  onChange={(e) => setStockAdjustment(e.target.value)}
                />
              )}

              <Button
                type="button"
                onClick={handleStockAdjustment}
                disabled={!stockAdjustment || stockAdjustment === 'custom'}
                variant="outline"
              >
                Apply Adjustment
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Adjust stock levels. Positive values increase stock, negative values decrease it.
            </p>
          </div>

          {/* Additional Details */}
          <div className="border-t pt-4">
            <Label className="text-base font-semibold mb-3 block">Additional Details</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deity">Deity</Label>
                <Input
                  id="deity"
                  value={formData.deity}
                  onChange={(e) => setFormData(prev => ({ ...prev, deity: e.target.value }))}
                  placeholder="e.g., Ganesh"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  value={formData.material}
                  onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
                  placeholder="e.g., Brass"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={formData.height}
                  onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                  placeholder="0.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (g)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                  placeholder="0.0"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
