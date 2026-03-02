import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ShoppingCart, Users, Package } from 'lucide-react';
import { productsApi } from '@/services/api';
import { toast } from 'sonner';

interface CartItem {
  productId: number;
  productPid: string;
  productName: string;
  productImage: string | null;
  productPrice: number;
  reservedQuantity: number;
  numberOfCarts: number;
  carts: Array<{
    cartId: string;
    userId: string;
    quantity: number;
    addedAt: string;
    updatedAt: string;
  }>;
}

interface CartDetailsModalProps {
  open: boolean;
  onClose: () => void;
}

export function CartDetailsModal({ open, onClose }: CartDetailsModalProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadCartDetails();
    }
  }, [open]);

  const loadCartDetails = async () => {
    setIsLoading(true);
    try {
      const response = await productsApi.getCartDetails();
      if (response.success && response.data) {
        setCartItems(response.data);
      } else {
        toast.error('Failed to load cart details');
      }
    } catch (error) {
      console.error('Error loading cart details:', error);
      toast.error('Failed to load cart details');
    } finally {
      setIsLoading(false);
    }
  };

  const totalReserved = cartItems.reduce((sum, item) => sum + item.reservedQuantity, 0);
  const totalProducts = cartItems.length;
  const totalCarts = cartItems.reduce((sum, item) => sum + item.numberOfCarts, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Reserved Items in Carts
          </DialogTitle>
          <DialogDescription>
            Products currently reserved in abandoned shopping carts
          </DialogDescription>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
              <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Products</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{totalProducts}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Reserved</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{totalReserved}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Carts</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{totalCarts}</p>
            </div>
          </div>
        </div>

        {/* Cart Items Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingCart className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">No items in carts</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              There are currently no products reserved in abandoned carts
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-4 p-4 rounded-lg border bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
              >
                {item.productImage && (
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {item.productName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Reserved: <span className="font-semibold text-orange-600">{item.reservedQuantity}</span> items
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
