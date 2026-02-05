 /**
  * KanbanDndProvider.tsx
  * مزود السحب والإفلات مع دعم اللمس
  */
 
 import React, { useMemo } from 'react';
 import { DndProvider } from 'react-dnd';
 import { HTML5Backend } from 'react-dnd-html5-backend';
 import { TouchBackend } from 'react-dnd-touch-backend';
 
 interface KanbanDndProviderProps {
   children: React.ReactNode;
 }
 
 // اختيار Backend بناءً على الجهاز
 const isTouchDevice = () => {
   if (typeof window === 'undefined') return false;
   return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
 };
 
 // خيارات Touch Backend
 const touchBackendOptions = {
   enableMouseEvents: true,
   delayTouchStart: 200, // تأخير قبل بدء السحب (لتمييز اللمس من التمرير)
   ignoreContextMenu: true,
   enableHoverOutsideTarget: true,
 };
 
 export const KanbanDndProvider: React.FC<KanbanDndProviderProps> = ({ children }) => {
   const backend = useMemo(() => {
     return isTouchDevice() ? TouchBackend : HTML5Backend;
   }, []);
 
   const options = useMemo(() => {
     return isTouchDevice() ? touchBackendOptions : undefined;
   }, []);
 
   return (
     <DndProvider backend={backend} options={options}>
       {children}
     </DndProvider>
   );
 };
 
 export default KanbanDndProvider;