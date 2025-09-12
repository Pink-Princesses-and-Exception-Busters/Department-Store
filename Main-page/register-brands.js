import { createClient } from '@supabase/supabase-js';

// Supabase 설정
const supabaseUrl = 'https://zyqbuuovliissozugjfq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5cWJ1dW92bGlpc3NvenVnamZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MzQ4MTgsImV4cCI6MjA3MDIxMDgxOH0.TYj-kGTlsGlznZCYX4M1yIilu0z1iNZ6tcWg5iLIaHE';
const supabase = createClient(supabaseUrl, supabaseKey);

// 58개 브랜드 데이터 (상품 수 기준 정렬)
const brands = [
  { name: 'Cook&Joy', email: 'cooknjoy@cooknjoy.com', business_number: '123-45-67890', phone: '02-1234-5678' },
  { name: 'Fresh Farm', email: 'freshfarm@freshfarm.com', business_number: '234-56-78901', phone: '02-2345-6789' },
  { name: 'Sports Trends', email: 'sportstrends@sportstrends.com', business_number: '345-67-89012', phone: '02-3456-7890' },
  { name: 'Comfort Trends', email: 'comforttrends@comforttrends.com', business_number: '456-78-90123', phone: '02-4567-8901' },
  { name: 'Rolex', email: 'rolex@rolex.com', business_number: '567-89-01234', phone: '02-5678-9012' },
  { name: 'Fashion Shades', email: 'fashionshades@fashionshades.com', business_number: '678-90-12345', phone: '02-6789-0123' },
  { name: 'Dodge', email: 'dodge@dodge.com', business_number: '789-01-23456', phone: '02-7890-1234' },
  { name: 'Oppo', email: 'oppo@oppo.com', business_number: '890-12-34567', phone: '02-8901-2345' },
  { name: 'Realme', email: 'realme@realme.com', business_number: '901-23-45678', phone: '02-9012-3456' },
  { name: 'Vivo', email: 'vivo@vivo.com', business_number: '012-34-56789', phone: '02-0123-4567' },
  { name: 'Chrysler', email: 'chrysler@chrysler.com', business_number: '123-45-67801', phone: '02-1234-5679' },
  { name: 'Nike', email: 'nike@nike.com', business_number: '234-56-78902', phone: '02-2345-6780' },
  { name: 'Off White', email: 'offwhite@offwhite.com', business_number: '345-67-89013', phone: '02-3456-7891' },
  { name: 'Urban Chic', email: 'urbanchic@urbanchic.com', business_number: '456-78-90124', phone: '02-4567-8902' },
  { name: '리빙데코', email: 'livingdeco@livingdeco.com', business_number: '567-89-01235', phone: '02-5678-9013' },
  { name: '플랜테리어', email: 'planterior@planterior.com', business_number: '678-90-12346', phone: '02-6789-0124' },
  { name: 'Amazon', email: 'amazon@amazon.com', business_number: '789-01-23457', phone: '02-7890-1235' },
  { name: 'Asus', email: 'asus@asus.com', business_number: '890-12-34568', phone: '02-8901-2346' },
  { name: 'Attitude', email: 'attitude@attitude.com', business_number: '901-23-45679', phone: '02-9012-3457' },
  { name: 'BATHKOREA', email: 'bathkorea@bathkorea.com', business_number: '012-34-56780', phone: '02-0123-4568' },
  { name: 'Beats', email: 'beats@beats.com', business_number: '123-45-67802', phone: '02-1234-5680' },
  { name: 'Casual Comfort', email: 'casualcomfort@casualcomfort.com', business_number: '234-56-78903', phone: '02-2345-6781' },
  { name: 'Chic Cosmetics', email: 'chiccosmetics@chiccosmetics.com', business_number: '345-67-89014', phone: '02-3456-7892' },
  { name: 'Classic Wear', email: 'classicwear@classicwear.com', business_number: '456-78-90125', phone: '02-4567-8903' },
  { name: 'Dell', email: 'dell@dell.com', business_number: '567-89-01236', phone: '02-5678-9014' },
  { name: 'Elegance Collection', email: 'elegancecollection@elegancecollection.com', business_number: '678-90-12347', phone: '02-6789-0125' },
  { name: 'Fashion Co.', email: 'fashionco@fashionco.com', business_number: '789-01-23458', phone: '02-7890-1236' },
  { name: 'Fashion Diva', email: 'fashiondiva@fashiondiva.com', business_number: '890-12-34569', phone: '02-8901-2347' },
  { name: 'Fashion Express', email: 'fashionexpress@fashionexpress.com', business_number: '901-23-45680', phone: '02-9012-3458' },
  { name: 'Fashion Fun', email: 'fashionfun@fashionfun.com', business_number: '012-34-56781', phone: '02-0123-4569' },
  { name: 'Fashion Gold', email: 'fashiongold@fashiongold.com', business_number: '123-45-67803', phone: '02-1234-5681' },
  { name: 'Fashion Timepieces', email: 'fashiontimepieces@fashiontimepieces.com', business_number: '234-56-78904', phone: '02-2345-6782' },
  { name: 'Fashion Trends', email: 'fashiontrends@fashiontrends.com', business_number: '345-67-89015', phone: '02-3456-7893' },
  { name: 'Fashionista', email: 'fashionista@fashionista.com', business_number: '456-78-90126', phone: '02-4567-8904' },
  { name: 'GadgetMaster', email: 'gadgetmaster@gadgetmaster.com', business_number: '567-89-01237', phone: '02-5678-9015' },
  { name: 'Generic Motors', email: 'genericmotors@genericmotors.com', business_number: '678-90-12348', phone: '02-6789-0126' },
  { name: 'Gigabyte', email: 'gigabyte@gigabyte.com', business_number: '789-01-23459', phone: '02-7890-1237' },
  { name: 'Glamour Beauty', email: 'glamourbeauty@glamourbeauty.com', business_number: '890-12-34570', phone: '02-8901-2348' },
  { name: 'Heshe', email: 'heshe@heshe.com', business_number: '901-23-45681', phone: '02-9012-3459' },
  { name: 'Huawei', email: 'huawei@huawei.com', business_number: '012-34-56782', phone: '02-0123-4570' },
  { name: 'IWC', email: 'iwc@iwc.com', business_number: '123-45-67804', phone: '02-1234-5682' },
  { name: 'Kawasaki', email: 'kawasaki@kawasaki.com', business_number: '234-56-78905', phone: '02-2345-6783' },
  { name: 'Lenovo', email: 'lenovo@lenovo.com', business_number: '345-67-89016', phone: '02-3456-7894' },
  { name: 'Longines', email: 'longines@longines.com', business_number: '456-78-90127', phone: '02-4567-8905' },
  { name: 'MotoGP', email: 'motogp@motogp.com', business_number: '567-89-01238', phone: '02-5678-9016' },
  { name: 'My Protein', email: 'myprotein@myprotein.com', business_number: '678-90-12349', phone: '02-6789-0127' },
  { name: 'Nail Couture', email: 'nailcouture@nailcouture.com', business_number: '789-01-23460', phone: '02-7890-1238' },
  { name: 'Olay', email: 'olay@olay.com', business_number: '890-12-34571', phone: '02-8901-2349' },
  { name: 'Pampi', email: 'pampi@pampi.com', business_number: '901-23-45682', phone: '02-9012-3460' },
  { name: 'Prada', email: 'prada@prada.com', business_number: '012-34-56783', phone: '02-0123-4571' },
  { name: 'ProVision', email: 'provision@provision.com', business_number: '123-45-67805', phone: '02-1234-5683' },
  { name: 'Puma', email: 'puma@puma.com', business_number: '234-56-78906', phone: '02-2345-6784' },
  { name: 'ScootMaster', email: 'scootmaster@scootmaster.com', business_number: '345-67-89017', phone: '02-3456-7895' },
  { name: 'SnapTech', email: 'snaptech@snaptech.com', business_number: '456-78-90128', phone: '02-4567-8906' },
  { name: 'SpeedMaster', email: 'speedmaster@speedmaster.com', business_number: '567-89-01239', phone: '02-5678-9017' },
  { name: 'TechGear', email: 'techgear@techgear.com', business_number: '678-90-12350', phone: '02-6789-0128' },
  { name: 'Vaseline', email: 'vaseline@vaseline.com', business_number: '789-01-23461', phone: '02-7890-1239' },
  { name: 'Velvet Touch', email: 'velvettouch@velvettouch.com', business_number: '890-12-34572', phone: '02-8901-2350' },
  { name: '깨끗한나라', email: 'cleancountry@cleancountry.com', business_number: '901-23-45683', phone: '02-9012-3461' },
  { name: '라이팅하우스', email: 'lightinghouse@lightinghouse.com', business_number: '012-34-56784', phone: '02-0123-4572' }
];

async function registerBrand(brand) {
  try {
    console.log(`등록 중: ${brand.name}`);
    
    // 1. Auth에 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: brand.email,
      password: '123123',
      options: {
        data: { 
          name: brand.name, 
          role: 'merchant' 
        }
      }
    });

    if (authError) {
      throw new Error(`Auth 생성 실패: ${authError.message}`);
    }

    // 2. brand_admins 테이블에 정보 저장
    const { data: brandData, error: brandError } = await supabase
      .from('brand_admins')
      .insert({
        name: brand.name,
        business_number: brand.business_number,
        email: brand.email,
        phone: brand.phone,
        address: `${brand.name} 사무소`,
        grade: 1,
        status: 'active'
      });

    if (brandError) {
      throw new Error(`브랜드 정보 저장 실패: ${brandError.message}`);
    }

    console.log(`✅ 성공: ${brand.name}`);
    return { success: true, brand: brand.name };

  } catch (error) {
    console.error(`❌ 실패: ${brand.name} - ${error.message}`);
    return { success: false, brand: brand.name, error: error.message };
  }
}

async function registerAllBrands() {
  console.log('58개 브랜드 등록을 시작합니다...\n');
  
  const results = [];
  
  for (let i = 0; i < brands.length; i++) {
    const result = await registerBrand(brands[i]);
    results.push(result);
    
    // API 호출 간격 (너무 빠르게 호출하지 않도록)
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 결과 요약
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('\n=== 등록 완료 ===');
  console.log(`성공: ${successful}개`);
  console.log(`실패: ${failed}개`);
  
  if (failed > 0) {
    console.log('\n실패한 브랜드들:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`- ${r.brand}: ${r.error}`);
    });
  }
}

// 실행
registerAllBrands().catch(console.error);
