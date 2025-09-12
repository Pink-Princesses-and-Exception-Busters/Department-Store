import { createClient } from '@supabase/supabase-js';

// Supabase 설정
const supabaseUrl = 'https://zyqbuuovliissozugjfq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5cWJ1dW92bGlpc3NvenVnamZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MzQ4MTgsImV4cCI6MjA3MDIxMDgxOH0.TYj-kGTlsGlznZCYX4M1yIilu0z1iNZ6tcWg5iLIaHE';
const supabase = createClient(supabaseUrl, supabaseKey);

// 실패한 브랜드들 (Auth는 이미 등록되어 있으므로 brand_admins 테이블에만 추가)
const failedBrands = [
  { name: 'Cook&Joy', email: 'cooknjoy@cooknjoy.com', business_number: '999-99-99999', phone: '02-1234-5678' },
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

async function addBrandToTable(brand) {
  try {
    console.log(`brand_admins 테이블에 추가 중: ${brand.name}`);
    
    // brand_admins 테이블에만 정보 저장 (Auth는 이미 등록되어 있음)
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

async function addAllBrandsToTable() {
  console.log(`${failedBrands.length}개 브랜드를 brand_admins 테이블에 추가합니다...\n`);
  
  const results = [];
  
  for (let i = 0; i < failedBrands.length; i++) {
    const result = await addBrandToTable(failedBrands[i]);
    results.push(result);
    
    // 짧은 대기 시간 (테이블 INSERT는 빠름)
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // 결과 요약
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('\n=== brand_admins 테이블 추가 완료 ===');
  console.log(`성공: ${successful}개`);
  console.log(`실패: ${failed}개`);
  
  if (failed > 0) {
    console.log('\n실패한 브랜드들:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`- ${r.brand}: ${r.error}`);
    });
  }
  
  if (successful > 0) {
    console.log('\n성공한 브랜드들:');
    results.filter(r => r.success).forEach(r => {
      console.log(`- ${r.brand}`);
    });
  }
}

// 실행
addAllBrandsToTable().catch(console.error);
