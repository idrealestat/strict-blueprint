 import { cn } from '@/lib/utils';
 
 interface StepsHeaderProps {
   currentStep: number;
 }
 
 const steps = [
   { number: 1, title: 'تحميل الفيديو' },
   { number: 2, title: 'استخراج الصوت' },
   { number: 3, title: 'تحويل إلى نص' },
   { number: 4, title: 'تحرير وترجمة' },
   { number: 5, title: 'تصدير' }
 ];
 
 const StepsHeader = ({ currentStep }: StepsHeaderProps) => {
   return (
     <div className="flex justify-between items-center p-4 bg-muted/50 border-b overflow-x-auto">
       {steps.map((step, index) => (
         <div
           key={step.number}
           className={cn(
             "flex flex-col items-center flex-1 relative transition-opacity",
             currentStep >= step.number ? "opacity-100" : "opacity-50"
           )}
         >
           {/* Connector line */}
           {index < steps.length - 1 && (
             <div
               className={cn(
                 "absolute top-6 right-1/2 w-full h-0.5 -z-10",
                 currentStep > step.number ? "bg-primary" : "bg-muted-foreground/30"
               )}
             />
           )}
           
           {/* Step number */}
           <div
             className={cn(
               "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-2 transition-all z-10",
               currentStep >= step.number
                 ? "bg-primary text-primary-foreground scale-110"
                 : "bg-muted-foreground/30 text-muted-foreground"
             )}
           >
             {step.number}
           </div>
           
           {/* Step title */}
           <span className="text-sm font-medium text-center whitespace-nowrap">
             {step.title}
           </span>
         </div>
       ))}
     </div>
   );
 };
 
 export default StepsHeader;