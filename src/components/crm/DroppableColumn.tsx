 /**
  * DroppableColumn.tsx
  * عمود قابل للإفلات باستخدام react-dnd
  */
 
 import React, { useRef } from 'react';
 import { useDrop, useDrag } from 'react-dnd';
 import { ItemTypes, DragItem } from './DraggableCard';
 
 interface ColumnDragItem {
   id: string;
   index: number;
   type: string;
 }
 
 interface DroppableColumnProps {
   id: string;
   index: number;
   children: React.ReactNode;
   onDropCard: (cardId: string, sourceColumnId: string, targetColumnId: string, targetIndex: number) => void;
   onMoveColumn?: (dragIndex: number, hoverIndex: number) => void;
   cardsCount: number;
   className?: string;
   headerClassName?: string;
   header?: React.ReactNode;
   canDragColumn?: boolean;
 }
 
 export const DroppableColumn: React.FC<DroppableColumnProps> = ({
   id,
   index,
   children,
   onDropCard,
   onMoveColumn,
   cardsCount,
   className = '',
   headerClassName = '',
   header,
   canDragColumn = true,
 }) => {
   const columnRef = useRef<HTMLDivElement>(null);
   const headerRef = useRef<HTMLDivElement>(null);
 
   // إعداد سحب العمود
   const [{ isDraggingColumn }, dragColumnRef] = useDrag({
     type: ItemTypes.COLUMN,
     item: (): ColumnDragItem => ({
       id,
       index,
       type: ItemTypes.COLUMN,
     }),
     canDrag: () => canDragColumn && !!onMoveColumn,
     collect: (monitor) => ({
       isDraggingColumn: monitor.isDragging(),
     }),
   });
 
   // إعداد إفلات العمود (لإعادة ترتيب الأعمدة)
   const [{ isOverColumn }, dropColumnRef] = useDrop({
     accept: ItemTypes.COLUMN,
     hover: (item: ColumnDragItem, monitor) => {
       if (!columnRef.current) return;
       
       const dragIndex = item.index;
       const hoverIndex = index;
       
       if (dragIndex === hoverIndex) return;
       
       const hoverBoundingRect = columnRef.current.getBoundingClientRect();
       const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
       const clientOffset = monitor.getClientOffset();
       
       if (!clientOffset) return;
       
       const hoverClientX = clientOffset.x - hoverBoundingRect.left;
       
       // RTL: عكس المنطق
       if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) return;
       if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) return;
       
       if (onMoveColumn) {
         onMoveColumn(dragIndex, hoverIndex);
         item.index = hoverIndex;
       }
     },
     collect: (monitor) => ({
       isOverColumn: monitor.isOver({ shallow: true }),
     }),
   });
 
   // إعداد إفلات البطاقات على العمود
   const [{ isOver, canDrop }, dropCardRef] = useDrop({
     accept: ItemTypes.CARD,
     drop: (item: DragItem, monitor) => {
       // فقط إذا تم الإفلات مباشرة على العمود (ليس على بطاقة)
       if (monitor.didDrop()) return;
       
       // إضافة البطاقة في نهاية العمود
       onDropCard(item.id, item.columnId, id, cardsCount);
     },
     collect: (monitor) => ({
       isOver: monitor.isOver({ shallow: true }),
       canDrop: monitor.canDrop(),
     }),
   });
 
   // دمج refs
   dragColumnRef(headerRef);
   dropColumnRef(dropCardRef(columnRef));
 
   return (
     <div
       ref={columnRef}
       data-column-id={id}
       className={`
         transition-all duration-200 ease-in-out
         ${isDraggingColumn ? 'opacity-50 scale-95 rotate-1' : ''}
         ${isOverColumn ? 'ring-2 ring-purple-500 ring-opacity-50' : ''}
         ${isOver && canDrop ? 'bg-green-50 dark:bg-green-900/20' : ''}
         ${className}
       `}
     >
       {/* رأس العمود - منطقة السحب */}
       {header && (
         <div
           ref={headerRef}
           className={`
             ${canDragColumn ? 'cursor-grab active:cursor-grabbing' : ''}
             ${headerClassName}
           `}
         >
           {header}
         </div>
       )}
       
       {/* محتوى العمود */}
       {children}
       
       {/* مؤشر الإفلات */}
       {isOver && canDrop && (
         <div className="mx-2 mb-2 h-16 border-2 border-dashed border-[#D4AF37] rounded-lg bg-[#D4AF37]/10 flex items-center justify-center animate-pulse">
           <span className="text-[#01411C] text-sm font-medium">أفلت هنا</span>
         </div>
       )}
     </div>
   );
 };
 
 export default DroppableColumn;