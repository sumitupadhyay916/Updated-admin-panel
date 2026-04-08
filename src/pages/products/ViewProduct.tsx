import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft, ChevronRight, Package, Calendar, ShoppingCart, Truck, CheckCircle, Loader2,
  Info, DollarSign, ImageIcon, Tag,
} from 'lucide-react';

import { productsApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VariantOptionValueMapping {
  optionId: string;
  optionName: string;
  valueId: string;
  value: string;
}

interface ProductVariant {
  id: string;
  sku?: string;
  size?: string;
  color?: string;
  price: number;
  comparePrice?: number;
  mrp?: number;
  stock: number;
  stockQuantity?: number;
  additionalInfo?: { label: string; value: string }[];
  optionValues: VariantOptionValueMapping[];
}

interface Product {
  id: number;
  pid: string;
  name: string;
  description?: string;
  deity?: string;
  material?: string;
  height?: number;
  weight?: number;
  categoryName: string;
  price: number;
  comparePrice?: number;
  stock: 'available' | 'unavailable';
  stockQuantity: number;
  totalStock?: number;       // variant-aware sum from getProductInventoryDetails
  availableStock?: number;   // totalStock - cart reservations
  currentStock?: number;     // raw shelf stock (current remaining after orders)
  lowStockThreshold: number;
  images: string[];
  sellerName: string;
  isFeatured: boolean;
  tags: string[];
  hasVariants?: boolean;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
  deliveredQuantity?: number;
  reservedQuantity?: number;
  shippingQuantity?: number;
}

function fmt(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ViewProduct() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  
  const backPath = location.pathname.replace(`/${id}/view`, '');

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Use getProductInventoryDetails so we get variant-aware totalStock,
        // availableStock, shippingQuantity, deliveredQuantity in one call.
        const response = await productsApi.getProductInventoryDetails(Number(id));
        if (response.success && response.data) {
          setProduct(response.data as Product);
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

  if (!product) {
    return null;
  }

  const stockCfg = product.stock === 'available'
    ? { label: 'Available', variant: 'default' as const }
    : { label: 'Out of Stock', variant: 'destructive' as const };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-gray-900/95 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => navigate(backPath)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">Product Details</span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button type="button" size="sm" onClick={() => navigate(backPath)} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8 space-y-6">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-indigo-600" />
            {product.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Product ID: {product.pid}</p>
        </div>

        {/* Product Images */}
        {product.images.length > 0 && (
          <Card className="shadow-sm border-0 ring-1 ring-gray-200 dark:ring-gray-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="h-4 w-4 text-indigo-500" />
                Product Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {product.images.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-40 object-cover rounded-lg border"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Basic Information */}
        <Card className="shadow-sm border-0 ring-1 ring-gray-200 dark:ring-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4 text-indigo-500" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Product Name</h3>
                <p className="text-lg font-semibold">{product.name}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Category</h3>
                <p className="text-base">{product.categoryName}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Seller</h3>
                <p className="text-base">{product.sellerName}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Stock Status</h3>
                <Badge variant={stockCfg.variant}>{stockCfg.label}</Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Stock</h3>
                {/* totalStock = original stock (current + delivered + in-shipping) */}
                <p className="font-medium text-blue-600 text-lg">
                  {(product.totalStock ?? product.stockQuantity ?? 0)} pcs
                </p>
                {/* Show remaining on shelf if different from total */}
                {product.totalStock != null && product.currentStock != null && product.totalStock !== product.currentStock && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {product.currentStock} pcs remaining on shelf
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Low Stock Threshold</h3>
                <p className="text-base">{product.lowStockThreshold} pcs</p>
              </div>
            </div>

            {product.description && (
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing & Variants */}
        <Card className="shadow-sm border-0 ring-1 ring-gray-200 dark:ring-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-indigo-500" />
              Pricing & Variant Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Show variant table if product HAS variants in DB (regardless of hasVariants flag) */}
            {product.variants && product.variants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900">
                      <th className="p-3 border text-left font-semibold">SKU (Color-Size)</th>
                      <th className="p-3 border text-left font-semibold">Actual Price</th>
                      <th className="p-3 border text-left font-semibold">MRP</th>
                      <th className="p-3 border text-left font-semibold">Stock</th>
                      <th className="p-3 border text-left font-semibold">Specs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((v) => {
                      const color = v.color || v.optionValues?.find(o => o.optionName.toLowerCase() === 'color')?.value || '';
                      const size = v.size || v.optionValues?.find(o => o.optionName.toLowerCase() === 'size')?.value || '';
                      const sku = `${color}${color && size ? '-' : ''}${size}`;
                      
                      return (
                        <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                          <td className="p-3 border font-medium">
                            {sku || 'N/A'}
                          </td>
                          <td className="p-3 border font-semibold text-green-600">{fmt(v.price)}</td>
                          <td className="p-3 border text-muted-foreground">
                            {fmt(v.mrp || v.comparePrice || v.price)}
                          </td>
                          <td className="p-3 border">
                            {(v.stockQuantity ?? v.stock ?? 0)} pcs
                          </td>
                          <td className="p-3 border">
                            {v.additionalInfo && v.additionalInfo.filter(i => i.label.trim()).length > 0 ? (
                              <div className="space-y-1">
                                {v.additionalInfo.filter(i => i.label.trim()).map((info, idx) => (
                                  <div key={idx} className="text-[11px]">
                                    <span className="font-semibold text-gray-500">{info.label}:</span> {info.value}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-[11px]">No specs</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center gap-8">
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Selling Price</h4>
                  <p className="text-2xl font-bold text-green-600">{fmt(product.price)}</p>
                </div>
                {(product.comparePrice || 0) > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">MRP</h4>
                    <p className="text-xl text-muted-foreground line-through">{fmt(product.comparePrice || 0)}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory Statistics */}
        <Card className="shadow-sm border-0 ring-1 ring-gray-200 dark:ring-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-indigo-500" />
              Inventory Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-100 dark:border-green-900">
                <CheckCircle className="h-10 w-10 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                  <p className="text-2xl font-bold">{product.deliveredQuantity || 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                <ShoppingCart className="h-10 w-10 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">In Cart</p>
                  <p className="text-2xl font-bold">{product.reservedQuantity || 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-100 dark:border-orange-900">
                <Truck className="h-10 w-10 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Shipping</p>
                  <p className="text-2xl font-bold">{product.shippingQuantity || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        {(product.deity || product.material || product.height || product.weight) && (
          <Card className="shadow-sm border-0 ring-1 ring-gray-200 dark:ring-gray-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4 text-indigo-500" />
                Additional Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {product.deity && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Deity</h4>
                    <p className="text-base">{product.deity}</p>
                  </div>
                )}
                {product.material && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Material</h4>
                    <p className="text-base">{product.material}</p>
                  </div>
                )}
                {product.height && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Height</h4>
                    <p className="text-base">{product.height} cm</p>
                  </div>
                )}
                {product.weight && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Weight</h4>
                    <p className="text-base">{product.weight} g</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        {product.tags.length > 0 && (
          <Card className="shadow-sm border-0 ring-1 ring-gray-200 dark:ring-gray-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag className="h-4 w-4 text-indigo-500" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card className="shadow-sm border-0 ring-1 ring-gray-200 dark:ring-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-indigo-500" />
              Metadata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="text-muted-foreground mb-1">Created</h4>
                <p className="font-medium">{fmtDate(product.createdAt)}</p>
              </div>
              <div>
                <h4 className="text-muted-foreground mb-1">Last Updated</h4>
                <p className="font-medium">{fmtDate(product.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="pt-6 flex items-center justify-end gap-3 pb-20">
          <Button type="button" onClick={() => navigate(backPath)}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
