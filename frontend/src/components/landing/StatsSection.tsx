import { useTranslation } from "@/i18n/config";

export function StatsSection() {
  const t = useTranslation();
  return (
    <section className="bg-indigo-600 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-indigo-400/30">
          <div className="flex flex-col items-center justify-center pt-8 sm:pt-0">
            <span className="text-4xl md:text-5xl font-bold text-white mb-2">{t("landing.stats.students_number")}</span>
            <span className="text-indigo-100 font-medium text-lg">{t("landing.stats.students_label")}</span>
          </div>
          <div className="flex flex-col items-center justify-center pt-8 sm:pt-0">
            <span className="text-4xl md:text-5xl font-bold text-white mb-2">{t("landing.stats.success_rate_number")}</span>
            <span className="text-indigo-100 font-medium text-lg">{t("landing.stats.success_rate_label")}</span>
          </div>
          <div className="flex flex-col items-center justify-center pt-8 sm:pt-0">
            <span className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center justify-center">
              {t("landing.stats.reviews_number")}
              <svg className="w-8 h-8 md:w-10 md:h-10 ml-2 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </span>
            <span className="text-indigo-100 font-medium text-lg">{t("landing.stats.reviews_label")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
