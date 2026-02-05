 /**
  * DraggableCard.tsx
  * بطاقة قابلة للسحب باستخدام react-dnd
  */
 
 import React, { useRef } from 'react';
 import { useDrag, useDrop } from 'react-dnd';
 
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
   const ref = useRef<HTMLDivElement>(null);
 
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
       if (!ref.current) return;
       
       const dragId = item.id;
       const hoverId = id;
       
       // لا تفعل شيء إذا كانت نفس البطاقة
       if (dragId === hoverId) return;
       
       // الحصول على أبعاد العنصر
       const hoverBoundingRect = ref.current.getBoundingClientRect();
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
 
   // دمج refs
   dragRef(dropRef(ref));
 
   return (
     <div
       ref={ref}
       className={`
         transition-all duration-200 ease-in-out
         ${isDragging ? 'opacity-40 scale-95 shadow-2xl z-50' : ''}
         ${isOver && canDrop ? 'transform -translate-y-1 shadow-lg ring-2 ring-[#D4AF37]' : ''}
         ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
         ${className}
       `}
       style={{
         touchAction: 'none',
       }}
     >
       {children}
     </div>
   );
 };
 
 export default DraggableCard;