import type { Product } from "@workspace/brew-catalog";
import { products, bundles } from "./catalog-defaults";

// Used once to initialize an empty catalog. Runtime reads never fall back to this data.
const arabic: Record<string, { description: string; why: string }> = {
  xbloom: { description: 'نظام تقطير متكامل، مضبوط على وصفتك.', why: 'يطحن ويزن ويصب وفق وصفة مبرمجة، لتكون لكل متغيرات التحضير قيمة محددة.' },
  'fellow-aiden': { description: 'تحضير دقيق، بسهولة ضغطة صباحية.', why: 'يتحكم بدرجة حرارة الماء وتوقيت كل مرحلة، ليمنحك قهوة متوازنة كل مرة.' },
  moccamaster: { description: 'كلاسيكية مدروسة لفناجين تُشارك حول الطاولة.', why: 'يحافظ عنصر التسخين النحاسي على درجة حرارة التحضير لقهوة متوازنة.' },
  'eureka-filtro': { description: 'مطحنة مخصصة للقهوة المقطرة بمحرك هادئ وفعّال.', why: 'تنتج الشفرات الفولاذية المسطحة حبوباً متجانسة تساعد على استخلاص واضح ومتوازن.' },
  'stagg-ekg': { description: 'صب دقيق، ودرجة حرارة بين يديك.', why: 'يحافظ متحكم PID على درجة الحرارة المحددة، وفوهة الصب المتوازنة تجعل التحكم طبيعياً.' },
  'hario-scale': { description: 'قياسان مفيدان، في أداة واحدة.', why: 'يزن القهوة والماء بينما يتابع المؤقت المدمج مدة كل صبّة.' },
  konga: { description: '٢٥٠ غرام · تحميص Brew في الكويت', why: 'قهوة إثيوبية معبّرة، محمصة محلياً لإبراز نكهتها الحيوية ومتعددة الطبقات.' },
  webanchi: { description: '٢٥٠ غرام · تحميص Brew في الكويت', why: 'قهوة إثيوبية محمصة بعناية، بفنجان عطري مشرق ونهاية حلوة طويلة.' },
  'caramel-candy': { description: '٢٥٠ غرام · تحميص Brew في الكويت', why: 'خلطة يومية مريحة بحلاوة متوازنة تناسب طرق التحضير المختلفة.' },
  'brazil-samba': { description: '٢٥٠ غرام · تحميص Brew في الكويت', why: 'قهوة برازيلية سلسة، محمصة لفنجان حلو وموثوق كل صباح.' },
};

const details: Record<string, { en: string; ar: string }> = {
  xbloom: { en: 'xBloom Studio brings grinding, weighing, and pouring together in one pour-over system. It follows a programmed recipe through those steps. Each part of the brew has a defined place in the process.', ar: 'يجمع xBloom Studio الطحن والوزن والصب في نظام واحد للتحضير بالتقطير. يتبع وصفة مبرمجة خلال هذه الخطوات. وهكذا يكون لكل مرحلة من التحضير موضع واضح.' },
  'fellow-aiden': { en: 'Fellow Aiden controls water temperature and timing at each brew stage. These controls help make batch brewing more repeatable. Its ready-to-use routine brings precision into everyday coffee making.', ar: 'يتحكم Fellow Aiden بدرجة حرارة الماء وتوقيت كل مرحلة من مراحل التحضير. تساعد هذه الإعدادات على تكرار النتيجة عند تحضير دفعات القهوة. ويجعل روتينه الجاهز الدقة جزءاً من تحضير القهوة اليومي.' },
  moccamaster: { en: 'A copper heating element maintains the brew temperature. This supports a steady extraction from one brew to the next. Its straightforward design makes it easy to prepare coffee to share.', ar: 'يحافظ عنصر التسخين النحاسي على درجة حرارة التحضير. ويساعد ذلك على ثبات الاستخلاص من تحضير إلى آخر. ويجعل تصميمه العملي تحضير القهوة ومشاركتها أمراً سهلاً.' },
  'eureka-filtro': { en: 'The Eureka Filtro is made for filter coffee. Its flat steel burrs grind evenly across the range. This helps make the coffee grounds more consistent for brewing.', ar: 'صُممت Eureka Filtro للقهوة المقطرة. تطحن الشفرات الفولاذية المسطحة القهوة بتجانس عبر نطاق الطحن. ويساعد ذلك على الحصول على طحن أكثر اتساقاً للتحضير.' },
  'stagg-ekg': { en: 'A PID controller maintains the temperature you select. The balanced spout helps you pour in a measured way. Together, they give you control over water temperature and pouring pace.', ar: 'يحافظ متحكم PID على درجة الحرارة التي تختارها. وتساعد الفوهة المتوازنة على صب الماء بتحكم. ويمنحك ذلك تحكماً بدرجة حرارة الماء وسرعة الصب.' },
  'hario-scale': { en: 'The scale measures coffee and water as you brew. Its built-in timer tracks the duration of each pour. Both measurements are available together while you prepare your coffee.', ar: 'تزن الأداة القهوة والماء أثناء التحضير. ويتابع المؤقت المدمج مدة كل صبّة. ويجمع ذلك القياس والتوقيت في أداة واحدة.' },
};
const origins: Record<string, { en: string; ar: string }> = {
  konga: { en: 'Ethiopia', ar: 'إثيوبيا' }, webanchi: { en: 'Ethiopia', ar: 'إثيوبيا' },
  'caramel-candy': { en: 'Blend · country not listed', ar: 'خلطة · لم يُذكر بلد المنشأ' }, 'brazil-samba': { en: 'Brazil', ar: 'البرازيل' },
};

export const seedProducts: Product[] = products.map(product => {
  const origin = origins[product.id];
  return {
    ...product,
    descriptionAr: arabic[product.id]?.description ?? '',
    whyAr: product.category === 'bean' ? 'تحميص Brew في الكويت' : arabic[product.id]?.why ?? '',
    why: product.category === 'bean' ? 'Roasted in Kuwait by Brew' : product.why,
    origin: origin?.en ?? '',
    originAr: origin?.ar ?? '',
    bagSize: product.category === 'bean' ? '250g' : '',
    detailDescription: details[product.id]?.en ?? `The listed origin for this coffee is ${origin?.en}. This 250g bag is roasted in Kuwait by Brew. The product information does not include tasting notes.`,
    detailDescriptionAr: details[product.id]?.ar ?? `المنشأ المسجل لهذه القهوة هو ${origin?.ar}. يحتوي الكيس على ٢٥٠ غراماً، وتحمّصه Brew في الكويت. لا تتضمن معلومات المنتج ملاحظات تذوق.`,
  };
});
const bundleNotes = ['طقس صباحي متكامل، جاهز لتبدأ يومك.', 'تحضير يومي موثوق، مع مساحة للاكتشاف.', 'أساسيات التقطير لصبّة مدروسة.'];
export const seedBundles = bundles.map((bundle, index) => ({ ...bundle, noteAr: bundleNotes[index] ?? '' }));
