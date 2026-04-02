import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  message: string | ReactNode;
}

export function SuccessModal({ isOpen, onOpenChange, message }: SuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] flex flex-col items-center justify-center p-12 text-center dark:border-gray-700 dark:bg-gray-800">
        <DialogHeader className="flex flex-col items-center justify-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Success!
          </DialogTitle>
        </DialogHeader>
        <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
          {message}
        </p>
        <DialogFooter className="w-full sm:justify-center">
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-32 bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-lg uppercase tracking-wide"
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
