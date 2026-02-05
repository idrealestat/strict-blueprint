 /**
  * DraggableCard.tsx
  * بطاقة قابلة للسحب باستخدام react-dnd
  */
 
import React, { useMemo, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
 import { GripVertical } from 'lucide-react';
 
 export const ItemTypes = {
   CARD: 'card',
   COLUMN: 'column',
 };
 
 export interface DragItem {
   id: string;
   columnId: string;
   index: number;
   type: string;
 }
 
 interface DraggableCardProps {
   id: string;
   columnId: string;
   index: number;
   children: React.ReactNode;
   onMoveCard: (dragId: string, dragColumnId: string, hoverColumnId: string, hoverIndex: number) => void;
   onReorderInColumn?: (columnId: string, dragIndex: number, hoverIndex: number) => void;
   className?: string;
   disabled?: boolean;
 }
 
 export const DraggableCard: React.FC<DraggableCardProps> = ({
   id,
   columnId,
   index,
   children,
   onMoveCard,
   onReorderInColumn,
   className = '',
   disabled = false,
 }) => {
   const cardRef = useRef<HTMLDivElement>(null);
   const dragHandleRef = useRef<HTMLDivElement>(null);

  const isTouch = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);
 
   // إعداد السحب (Drag)
  const [{ isDragging }, dragRef] = useDrag({
     type: ItemTypes.CARD,
     item: (): DragItem => ({
       id,
       columnId,
       index,
       type: ItemTypes.CARD,
     }),
     canDrag: () => !disabled,
     collect: (monitor) => ({
       isDragging: monitor.isDragging(),
     }),
   });
 
   // إعداد الإفلات (Drop) - للترتيب داخل نفس العمود أو بين الأعمدة
   const [{ isOver, canDrop }, dropRef] = useDrop({
     accept: ItemTypes.CARD,
     hover: (item: DragItem, monitor) => {
       if (!cardRef.current) return;
       
       const dragId = item.id;
       const hoverId = id;
       
       // لا تفعل شيء إذا كانت نفس البطاقة
       if (dragId === hoverId) return;
       
       // الحصول على أبعاد العنصر
       const hoverBoundingRect = cardRef.current.getBoundingClientRect();
       const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
       const clientOffset = monitor.getClientOffset();
       
       if (!clientOffset) return;
       
       const hoverClientY = clientOffset.y - hoverBoundingRect.top;
       
       // إذا كانت البطاقة في نفس العمود
       if (item.columnId === columnId) {
         // فقط نقل إذا تجاوزنا نصف العنصر
         if (item.index < index && hoverClientY < hoverMiddleY) return;
         if (item.index > index && hoverClientY > hoverMiddleY) return;
         
         if (onReorderInColumn) {
           onReorderInColumn(columnId, item.index, index);
           item.index = index;
         }
       }
     },
     drop: (item: DragItem) => {
       // إذا كانت البطاقة في عمود مختلف
       if (item.columnId !== columnId) {
         onMoveCard(item.id, item.columnId, columnId, index);
         item.columnId = columnId;
         item.index = index;
       }
     },
     collect: (monitor) => ({
       isOver: monitor.isOver(),
       canDrop: monitor.canDrop(),
     }),
   });
 
  // تطبيق refs
  // على الجوال: السحب من كامل البطاقة (ضغط مطوّل)
  // على الديسكتوب: السحب من المقبض فقط لتجنب تعارض النقر داخل البطاقة
  if (isTouch) {
    dragRef(cardRef);
  } else {
    dragRef(dragHandleRef);
  }
  dropRef(cardRef);
 
   return (
     <div
       ref={cardRef}
       data-card-id={id}
       className={`
         transition-all duration-200 ease-in-out relative
         ${isDragging ? 'opacity-40 scale-95 shadow-2xl z-50' : ''}
         ${isOver && canDrop ? 'transform -translate-y-1 shadow-lg ring-2 ring-[#D4AF37]' : ''}
         ${className}
       `}
     >
       {/* مقبض السحب - يظهر دائماً في الجانب */}
       <div
         ref={dragHandleRef}
         className={`
           absolute right-1 top-1/2 -translate-y-1/2 z-10
           w-6 h-12 flex items-center justify-center
           bg-gradient-to-l from-muted/90 to-transparent
           rounded-l-lg
          ${disabled ? 'cursor-not-allowed opacity-30' : 'cursor-grab active:cursor-grabbing hover:bg-muted/90'}
           touch-none
         `}
         style={{ touchAction: 'none' }}
       >
         <GripVertical className="w-4 h-4 text-muted-foreground" />
       </div>
       
       {/* محتوى البطاقة */}
       {children}
     </div>
   );
 };
 
 export default DraggableCard;