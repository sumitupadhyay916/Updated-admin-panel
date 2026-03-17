import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { couponsApi } from '@/services/api';
import { Ticket, Save, ArrowLeft } from 'lucide-react';

// All fields kept as strings to avoid react-hook-form/zod transform type conflicts
// Conversion to numbers/arrays is done in onSubmit
const couponSchema = z.object({
  // General
  title: z.string().min(3, 'Title must be at least 3 characters'),
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Only uppercase letters, numbers, underscores or hyphens'),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.string().min(1, 'Discount value is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isFreeShipping: z.boolean().default(false),
  isActive: z.boolean().default(true),
  // Restriction
  minOrderAmount: z.string().optional(),
  maxDiscountAmount: z.string().optional(),
  maxSpend: z.string().optional(),
  productIds: z.string().optional(),   // comma-separated product IDs
  categoryIds: z.string().optional(),  // comma-separated category IDs
  // Usage
  usageLimit: z.string().optional(),   // global total limit
  limitPerUser: z.string().optional(), // per-customer limit
});

type CouponFormValues = z.infer<typeof couponSchema>;

export default function CreateCoupon() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');

  const form = useForm<any>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      title: '',
      code: '',
      discountType: 'percentage',
      discountValue: '',
      startDate: '',
      endDate: '',
      isFreeShipping: false,
      isActive: true,
      minOrderAmount: '',
      maxDiscountAmount: '',
      maxSpend: '',
      productIds: '',
      categoryIds: '',
      usageLimit: '',
      limitPerUser: '',
    },
  });

  const toNumberOrNull = (val?: string) =>
    val && val.trim() !== '' ? parseFloat(val) : null;

  const toIntOrNull = (val?: string) =>
    val && val.trim() !== '' ? parseInt(val, 10) : null;

  const toStringArray = (val?: string) =>
    val ? val.split(',').map((s) => s.trim()).filter(Boolean) : [];

  const toIntArray = (val?: string) =>
    val
      ? val
          .split(',')
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n))
      : [];

  async function onSubmit(values: CouponFormValues) {
    try {
      const payload = {
        title: values.title,
        code: values.code,
        description: values.title,
        discountType: values.discountType,
        discountValue: parseFloat(values.discountValue),
        startDate: values.startDate,
        endDate: values.endDate,
        isFreeShipping: values.isFreeShipping,
        isActive: values.isActive,
        minOrderAmount: toNumberOrNull(values.minOrderAmount),
        maxDiscountAmount: toNumberOrNull(values.maxDiscountAmount),
        maxSpend: toNumberOrNull(values.maxSpend),
        usageLimit: toIntOrNull(values.usageLimit),
        limitPerUser: toIntOrNull(values.limitPerUser),
        productIds: toStringArray(values.productIds),
        categoryIds: toIntArray(values.categoryIds),
        sellerIds: [],
        applicableTo: 'all',
      };

      await couponsApi.createCoupon(payload as any);
      toast.success('Coupon created successfully!');
      navigate('/seller/coupons');
    } catch (error: any) {
      console.error(error);
      const message =
        error?.response?.data?.message || 'Failed to create coupon. Please try again.';
      toast.error(message);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Coupon"
        description="Create a new discount coupon for your customers"
        icon={Ticket}
        actions={
          <Button variant="outline" onClick={() => navigate('/seller/coupons')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:w-[420px]">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="restriction">Restriction</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
            </TabsList>

            {/* ── GENERAL TAB ── */}
            <TabsContent value="general" className="space-y-4 pt-4">
              <Card>
                <CardContent className="space-y-4 pt-6">

                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coupon Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Summer Sale" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Code */}
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coupon Code *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. SUMMER2024"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value.toUpperCase())
                            }
                          />
                        </FormControl>
                        <FormDescription>Uppercase letters, numbers, _ or -</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Discount Type + Value */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="discountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage (%)</SelectItem>
                              <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="discountValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Value *</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Start / End Date */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Free Shipping */}
                  <FormField
                    control={form.control}
                    name="isFreeShipping"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Free Shipping</FormLabel>
                          <FormDescription>
                            Enable free shipping when this coupon is applied.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Active</FormLabel>
                          <FormDescription>
                            Make this coupon available immediately.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── RESTRICTION TAB ── */}
            <TabsContent value="restriction" className="space-y-4 pt-4">
              <Card>
                <CardContent className="space-y-4 pt-6">

                  {/* Min / Max Spend */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="minOrderAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Order Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="e.g. 500"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum cart total to apply this coupon.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxSpend"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Spend Allowed</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="e.g. 5000"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Coupon won't apply if cart exceeds this amount.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Max Discount Cap */}
                  <FormField
                    control={form.control}
                    name="maxDiscountAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Discount Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="e.g. 200"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Cap the maximum discount value (useful for % coupons).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Product IDs */}
                  <FormField
                    control={form.control}
                    name="productIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Restrict to Product IDs</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. clxyz123,clabc456 (comma-separated)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave empty to apply to all products.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Category IDs */}
                  <FormField
                    control={form.control}
                    name="categoryIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Restrict to Category IDs</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. 1,3,7 (comma-separated)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave empty to apply to all categories.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── USAGE TAB ── */}
            <TabsContent value="usage" className="space-y-4 pt-4">
              <Card>
                <CardContent className="space-y-4 pt-6">

                  {/* Global Usage Limit */}
                  <FormField
                    control={form.control}
                    name="usageLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Usage Limit</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="e.g. 100 (leave blank for unlimited)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum total number of times this coupon can be used across all customers.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Per-User Limit */}
                  <FormField
                    control={form.control}
                    name="limitPerUser"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usage Limit Per Customer</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="e.g. 1 (leave blank for unlimited)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of times a single customer can use this coupon.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {form.formState.isSubmitting ? 'Saving...' : 'Save Coupon'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/seller/coupons')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
