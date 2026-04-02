import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, ShoppingCart, Truck, CheckCircle } from 'lucide-react';

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

interface ViewProductModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
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

export function ViewProductModal({ product, open, onClose }: ViewProductModalProps) {
  if (!product) return null;

  const stockCfg = product.stock === 'available'
    ? { label: 'Available', variant: 'default' as const }
    : { label: 'Out of Stock', variant: 'destructive' as const };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Product Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Images */}
          {product.images.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`${product.name} ${index + 1}`}
                  className="w-full h-32 object-cover rounded border"
                />
              ))}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Product Name</h3>
              <p className="text-lg font-semibold">{product.name}</p>
            </div>


            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Category</h3>
              <p>{product.categoryName}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Stock Status</h3>
              <Badge variant={stockCfg.variant}>{stockCfg.label}</Badge>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Stock</h3>
              <p className="font-medium text-blue-600">{(product.stockQuantity || 0)} pcs</p>
            </div>
          </div>

          {/* Price Section */}
          <div className="border-t pt-4">
            <h3 className="text-base font-semibold mb-3">Pricing & Variant Details</h3>
            {product.hasVariants && product.variants && product.variants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-2 border font-medium">SKU (Color-Size)</th>
                      <th className="p-2 border font-medium">Actual Price</th>
                      <th className="p-2 border font-medium">MRP</th>
                      <th className="p-2 border font-medium">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((v) => {
                      const color = v.color || v.optionValues?.find(o => o.optionName.toLowerCase() === 'color')?.value || '';
                      const size = v.size || v.optionValues?.find(o => o.optionName.toLowerCase() === 'size')?.value || '';
                      const sku = `${color}${color && size ? '-' : ''}${size}`;
                      
                      return (
                        <tr key={v.id}>
                          <td className="p-2 border font-medium">
                            {sku || 'N/A'}
                          </td>
                          <td className="p-2 border font-semibold">{fmt(v.price)}</td>
                          <td className="p-2 border text-muted-foreground">
                            {fmt(v.mrp || v.comparePrice || v.price)}
                          </td>
                          <td className="p-2 border">
                            {(v.stockQuantity ?? v.stock ?? 0)} pcs
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Selling Price</h4>
                  <p className="text-lg font-semibold">{fmt(product.price)}</p>
                </div>
                {(product.comparePrice || 0) > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">MRP</h4>
                    <p className="text-lg text-muted-foreground line-through">{fmt(product.comparePrice || 0)}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
              <p className="text-sm">{product.description}</p>
            </div>
          )}

          {/* Inventory Stats */}
          <div className="border-t pt-4">
            <h3 className="text-base font-semibold mb-3">Inventory Statistics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                  <p className="text-xl font-semibold">{product.deliveredQuantity || 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">In Cart</p>
                  <p className="text-xl font-semibold">{product.reservedQuantity || 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <Truck className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Shipping</p>
                  <p className="text-xl font-semibold">{product.shippingQuantity || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          {(product.deity || product.material || product.height || product.weight) && (
            <div className="border-t pt-4">
              <h3 className="text-base font-semibold mb-3">Additional Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {product.deity && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Deity</h4>
                    <p>{product.deity}</p>
                  </div>
                )}
                {product.material && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Material</h4>
                    <p>{product.material}</p>
                  </div>
                )}
                {product.height && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Height</h4>
                    <p>{product.height} cm</p>
                  </div>
                )}
                {product.weight && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Weight</h4>
                    <p>{product.weight} g</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <Calendar className="inline h-4 w-4 mr-1" />
              Created: {fmtDate(product.createdAt)}
            </div>
            <div>
              <Calendar className="inline h-4 w-4 mr-1" />
              Updated: {fmtDate(product.updatedAt)}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
