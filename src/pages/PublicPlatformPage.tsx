/**
 * PublicPlatformPage.tsx
 * صفحة المنصة العامة - تظهر للعملاء والجمهور
 * يمكن الوصول إليها عبر الدومين المخصص: Apptitle-usertitle.com
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import MyPublicPlatformContent from '@/components/platform/MyPublicPlatformContent';

const PublicPlatformPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  
  // بيانات المستخدم من localStorage
  const [userData, setUserData] = React.useState<any>(null);
  
  // استخدام 'default' دائماً لأن البيانات مخزنة تحت هذا المفتاح
  const actualUserId = 'default';
  
  React.useEffect(() => {
    // تحميل بيانات البطاقة من localStorage - دائماً من default
    const storageKey = `business_card_${actualUserId}`;
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setUserData({
          name: data.userName,
          title: 'وسيط عقاري معتمد',
          rating: 4.8,
          badge: 'ماسي',
          totalDeals: data.achievements?.totalDeals || 0
        });
      } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
      }
    }
  }, [userId]);

  const pageTitle = userData?.name ? `منصة ${userData.name} العقارية` : 'المنصة العقارية';
  const pageDescription = userData?.name 
    ? `تصفح العروض العقارية المميزة من ${userData.name} - وسيط عقاري معتمد`
    : 'منصة عقارية متكاملة لعرض العقارات والخدمات العقارية';

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Helmet>
      
      <MyPublicPlatformContent 
        currentUser={userData}
        userId={actualUserId}
      />
    </>
  );
};

export default PublicPlatformPage;
