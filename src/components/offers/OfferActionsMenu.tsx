/**
 * OfferActionsMenu.tsx
 * قائمة النقاط الثلاث للتعديل والحذف على المدن والأحياء والعروض
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Share2,
  Copy,
} from 'lucide-react';

interface OfferActionsMenuProps {
  type: 'city' | 'district' | 'offer';
  id: string;
  title: string;
  isHidden?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleVisibility?: () => void;
  onShare?: () => void;
  onCopyLink?: () => void;
  className?: string;
}

export default function OfferActionsMenu({
  type,
  id,
  title,
  isHidden = false,
  onEdit,
  onDelete,
  onToggleVisibility,
  onShare,
  onCopyLink,
  className = '',
}: OfferActionsMenuProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getTypeLabel = () => {
    switch (type) {
      case 'city': return 'المدينة';
      case 'district': return 'الحي';
      case 'offer': return 'العرض';
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onDelete?.();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 hover:bg-gray-100 ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {onEdit && (
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Edit className="w-4 h-4 text-blue-600" />
              <span>تعديل</span>
            </DropdownMenuItem>
          )}
          
          {onToggleVisibility && (
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
              className="flex items-center gap-2 cursor-pointer"
            >
              {isHidden ? (
                <>
                  <Eye className="w-4 h-4 text-green-600" />
                  <span>إظهار على المنصة</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 text-orange-600" />
                  <span>إخفاء من المنصة</span>
                </>
              )}
            </DropdownMenuItem>
          )}

          {onCopyLink && (
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onCopyLink(); }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Copy className="w-4 h-4 text-gray-600" />
              <span>نسخ الرابط</span>
            </DropdownMenuItem>
          )}

          {onShare && (
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onShare(); }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-green-600" />
              <span>مشاركة</span>
            </DropdownMenuItem>
          )}

          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* تأكيد الحذف */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              تأكيد حذف {getTypeLabel()}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              <p>هل أنت متأكد من حذف "{title}"؟</p>
              <p className="mt-2 text-sm text-gray-500">
                يمكنك استعادة {getTypeLabel()} من سلة المحذوفات لاحقاً.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              نعم، احذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
