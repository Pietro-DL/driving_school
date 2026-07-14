import { useTranslation } from "@/i18n/config";

export function PricingSection() {
  const t = useTranslation();
  return (
    <section className="py-16 md:py-24 px-6 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-zinc-50 mb-4 tracking-tight">
            {t("landing.pricing.title")}
          </h2>
          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            {t("landing.pricing.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Livello 1: Essenziale */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-shadow border border-zinc-200 dark:border-zinc-800 flex flex-col">
            <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
              {t("landing.pricing.tier1.name")}
            </h3>
            <div className="mb-6 flex items-end gap-1">
              <span className="text-5xl font-extrabold text-zinc-900 dark:text-zinc-50">{t("landing.pricing.tier1.price")}</span>
              <span className="text-zinc-500 dark:text-zinc-400 font-medium mb-1">{t("landing.pricing.month")}</span>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start">
                <svg className="w-6 h-6 text-indigo-500 dark:text-indigo-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-zinc-700 dark:text-zinc-300">{t("landing.pricing.tier1.features.0")}</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-indigo-500 dark:text-indigo-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-zinc-700 dark:text-zinc-300">{t("landing.pricing.tier1.features.1")}</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-indigo-500 dark:text-indigo-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-zinc-700 dark:text-zinc-300">{t("landing.pricing.tier1.features.2")}</span>
              </li>
            </ul>

            <button className="w-full py-4 px-6 rounded-2xl font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-zinc-800 dark:text-indigo-400 dark:hover:bg-zinc-700 transition-colors">
              {t("landing.pricing.tier1.cta")}
            </button>
          </div>
          
          {/* Livello 2: Premium (Popolare) */}
          <div className="bg-indigo-600 rounded-[2rem] p-8 shadow-xl border-2 border-indigo-500 flex flex-col relative transform md:-translate-y-4">
            <div className="absolute -top-4 left-0 right-0 flex justify-center">
              <span className="bg-red-500 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-sm">
                {t("landing.pricing.tier2.badge")}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-indigo-100 mb-2 mt-2">
              {t("landing.pricing.tier2.name")}
            </h3>
            <div className="mb-6 flex items-end gap-1">
              <span className="text-5xl font-extrabold text-white">{t("landing.pricing.tier2.price")}</span>
              <span className="text-indigo-200 font-medium mb-1">{t("landing.pricing.month")}</span>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start">
                <svg className="w-6 h-6 text-indigo-200 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white font-medium">{t("landing.pricing.tier2.features.0")}</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-indigo-200 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-indigo-50">{t("landing.pricing.tier2.features.1")}</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-indigo-200 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-indigo-50">{t("landing.pricing.tier2.features.2")}</span>
              </li>
            </ul>

            <button className="w-full py-4 px-6 rounded-2xl font-semibold text-indigo-600 bg-white hover:bg-zinc-50 transition-colors shadow-sm">
              {t("landing.pricing.tier2.cta")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
