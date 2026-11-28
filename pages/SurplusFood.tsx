import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Store,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Info,
  ShoppingBag,
  ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { civicActionService, SurplusOffer, SurplusStatus } from '../services/civicActionService';
import { notificationService } from '../services/notificationService';
import { useApp } from '../context/AppContext';

const STATUS_META: Record<SurplusStatus, { label: string; labelEn: string; cls: string }> = {
  available: { label: 'متاح', labelEn: 'Available', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40' },
  reserved: { label: 'محجوز', labelEn: 'Reserved', cls: 'bg-amber-500/15 text-amber-300 border-amber-400/40' },
  picked_up: { label: 'تم الاستلام', labelEn: 'Picked up', cls: 'bg-sky-500/15 text-sky-300 border-sky-400/40' },
  expired: { label: 'انتهى', labelEn: 'Expired', cls: 'bg-slate-700/60 text-slate-300 border-slate-500/40' },
};

const PARTNER_TYPE_AR: Record<SurplusOffer['partnerType'], string> = {
  bakery: 'مخبز',
  store: 'متجر / سوق',
  restaurant: 'مطعم',
};

const PARTNER_TYPE_EN: Record<SurplusOffer['partnerType'], string> = {
  bakery: 'Bakery',
  store: 'Store / market',
  restaurant: 'Restaurant',
};

const SurplusFood: React.FC = () => {
  const { language } = useApp();
  const ar = language === 'ar';
  const [offers, setOffers] = useState<SurplusOffer[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | SurplusStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | SurplusOffer['partnerType']>('all');

  useEffect(() => {
    setOffers(civicActionService.getSurplusOffers());
  }, []);

  const handleReserveToggle = (offer: SurplusOffer) => {
    const updated = civicActionService.toggleDemoSurplusReservation(offer.id);
    setOffers(updated);
    if (offer.reservedByMe) {
      notificationService.info(ar ? 'تم إلغاء الحجز التجريبي (لا يترتب عليه أي التزام فعلي).' : 'Demo reservation cancelled (no real obligation).');
    } else {
      notificationService.success(ar ? 'تم تسجيل حجز تجريبي للعرض في جهازك فقط.' : 'Demo reservation recorded on your device only.');
    }
  };

  const handleMarkPickedUp = (offer: SurplusOffer) => {
    const updated = civicActionService.markDemoSurplusPickedUp(offer.id);
    setOffers(updated);
    notificationService.success(ar ? 'تم تحديث حالة العرض التجريبي إلى «تم الاستلام».' : 'Demo offer status updated to picked up.');
  };

  const filtered = offers.filter((o) => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchType = typeFilter === 'all' || o.partnerType === typeFilter;
    return matchStatus && matchType;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 pb-32 space-y-6" dir={ar ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 md:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-white">{ar ? 'الفائض بدل الرمي' : 'Surplus instead of waste'}</h1>
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-400/40">
                  {ar ? 'عروض تجريبية للعرض فقط' : 'Demo offers for display only'}
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                {ar
                  ? 'نموذج لتقليل هدر الطعام عبر ربط فائض المخابز والمطاعم والمتاجر بالمستفيدين ضمن نطاق المنطقة.'
                  : 'A model for reducing food waste by connecting surplus from bakeries, restaurants and stores with beneficiaries within the district.'}
              </p>
            </div>
          </div>

          <Link
            to="/eco-food"
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 border border-white/10 font-bold text-xs hover:bg-slate-700 transition focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
          >
            <span>{ar ? 'المؤن الدائرية والغذاء' : 'Circular pantry & food'}</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Critical Food Safety & Demo Disclaimers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-rose-500/10 border border-rose-400/30 rounded-2xl p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-rose-100 leading-relaxed">
              <p className="font-black text-rose-200">{ar ? 'تنبيه سلامة الغذاء والمسؤولية' : 'Food safety & liability notice'}</p>
              <p>
                {ar
                  ? 'العارض أو الشريك هو المسؤول الوحيد عن سلامة الطعام وجودته وشروط حفظه وصلاحيته. لا يقدّم MoEco فحصاً مخبرياً ولا يضمن سلامة المنتجات المعروضة.'
                  : 'The partner or poster is solely responsible for food safety, quality, storage conditions and validity. MoEco provides no lab inspection and does not guarantee the safety of listed products.'}
              </p>
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-amber-100 leading-relaxed">
              <p className="font-black text-amber-200">{ar ? 'وضع العرض التجريبي (بدون دفع أو طلب فعلي)' : 'Demo display mode (no payment or real order)'}</p>
              <p>
                {ar
                  ? 'جميع العروض أدناه بيانات تجريبية، وأزرار الحجز تحفظ الحالة محلياً فقط دون إرسال طلب حقيقي لأي متجر أو إجراء أي عملية دفع.'
                  : 'All offers below are demo data, and reservation buttons save state locally only, without sending a real order to any store or making any payment.'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <section className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={ar ? 'تصفية حسب الحالة' : 'Filter by status'}>
          {(
            [
              { id: 'all', label: ar ? 'كل الحالات' : 'All statuses' },
              { id: 'available', label: ar ? 'متاح' : 'Available' },
              { id: 'reserved', label: ar ? 'محجوز' : 'Reserved' },
              { id: 'picked_up', label: ar ? 'تم الاستلام' : 'Picked up' },
              { id: 'expired', label: ar ? 'انتهى' : 'Expired' },
            ] as const
          ).map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold border transition focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
                statusFilter === st.id
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-slate-950/60 text-slate-300 border-white/10 hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={ar ? 'تصفية حسب نوع النشاط' : 'Filter by business type'}>
          {(
            [
              { id: 'all', label: ar ? 'الكل' : 'All' },
              { id: 'bakery', label: ar ? 'مخابز' : 'Bakeries' },
              { id: 'store', label: ar ? 'متاجر' : 'Stores' },
              { id: 'restaurant', label: ar ? 'مطاعم' : 'Restaurants' },
            ] as const
          ).map((tp) => (
            <button
              key={tp.id}
              type="button"
              onClick={() => setTypeFilter(tp.id)}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border transition focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
                typeFilter === tp.id
                  ? 'bg-sky-500/20 text-sky-300 border-sky-400/50'
                  : 'bg-slate-950/60 text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              {tp.label}
            </button>
          ))}
        </div>
      </section>

      {/* Offers Grid */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-10 text-center space-y-2">
          <Utensils className="w-10 h-10 text-slate-500 mx-auto" />
          <h2 className="text-lg font-black text-white">{ar ? 'لا توجد عروض مطابقة للتصفية الحالية' : 'No offers match the current filter'}</h2>
          <p className="text-xs text-slate-400">{ar ? 'جرّب اختيار حالة أو فئة أخرى لعرض النماذج التجريبية.' : 'Try another status or category to view the demo samples.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((offer) => {
            const st = STATUS_META[offer.status];
            return (
              <article
                key={offer.id}
                className="bg-slate-900/75 border border-white/10 rounded-3xl p-6 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold border border-white/10">
                        <Store className="w-3.5 h-3.5 text-amber-400" />
                        {ar ? PARTNER_TYPE_AR[offer.partnerType] : PARTNER_TYPE_EN[offer.partnerType]}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800/80 text-amber-300 border border-amber-400/30">
                        {offer.isVerifiedPartner ? (ar ? 'شريك موثق' : 'Verified partner') : (ar ? 'شريك تجريبي غير موثق' : 'Unverified demo partner')}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-black border ${st.cls}`}>
                      {ar ? st.label : st.labelEn}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-white">{offer.partnerName}</h2>
                    <p className="text-sm font-bold text-emerald-300 mt-1">{offer.foodType}</p>
                  </div>

                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs bg-slate-950/70 border border-white/5 rounded-2xl p-4">
                    <div>
                      <dt className="text-slate-400 font-bold">{ar ? 'الكمية المتاحة' : 'Available quantity'}</dt>
                      <dd className="text-white font-black mt-0.5">
                        {offer.quantityAvailable || (ar ? 'غير محددة' : 'Unspecified')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-bold">{ar ? 'السعر / التبرع' : 'Price / donation'}</dt>
                      <dd className="text-amber-300 font-black mt-0.5">{offer.priceText}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-sky-400" />
                        {ar ? 'فترة الاستلام والانتهاء' : 'Pickup window & expiry'}
                      </dt>
                      <dd className="text-slate-200 font-bold mt-0.5">
                        {offer.pickupWindow} ({ar ? 'ينتهي' : 'expires'}: {offer.expiresAt})
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-bold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        {ar ? 'النطاق الجغرافي' : 'Geographic range'}
                      </dt>
                      <dd className="text-slate-200 font-bold mt-0.5">{offer.areaRange}</dd>
                    </div>
                  </dl>

                  <div className="text-xs text-slate-300 bg-slate-950/40 rounded-xl p-3 border border-white/5">
                    <span className="font-black text-slate-200">{ar ? 'شروط الاستلام: ' : 'Pickup terms: '}</span>
                    {offer.pickupTerms}
                  </div>
                </div>

                {/* Demo Actions */}
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    {ar ? 'تفاعل تجريبي بدون دفع' : 'Demo interaction, no payment'}
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {offer.status === 'available' && (
                      <button
                        type="button"
                        onClick={() => handleReserveToggle(offer)}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:outline-none"
                      >
                        {ar ? 'حجز تجريبي (عرض فقط)' : 'Demo reservation (display only)'}
                      </button>
                    )}

                    {offer.status === 'reserved' && offer.reservedByMe && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleMarkPickedUp(offer)}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-black text-xs hover:bg-sky-400 transition focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:outline-none"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 inline ml-1" />
                          {ar ? 'تأكيد استلام تجريبي' : 'Confirm demo pickup'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReserveToggle(offer)}
                          className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-800 text-slate-200 border border-white/10 font-bold text-xs hover:bg-rose-500/20 hover:text-rose-200 transition focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
                        >
                          {ar ? 'إلغاء الحجز' : 'Cancel reservation'}
                        </button>
                      </>
                    )}

                    {offer.status === 'reserved' && !offer.reservedByMe && (
                      <span className="text-xs font-bold text-amber-300 px-3 py-2">
                        {ar ? 'محجوز في النموذج التجريبي' : 'Reserved in the demo model'}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SurplusFood;
