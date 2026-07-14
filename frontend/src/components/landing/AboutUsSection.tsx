import { useTranslation } from "@/i18n/config";

export function AboutUsSection() {
  const t = useTranslation();
  return (
    <section id="scopri-di-piu" className="py-16 md:py-24 px-6 bg-white dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 lg:gap-20">
        <div className="flex-1 w-full order-2 md:order-1 relative group cursor-pointer">
          <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-[2rem] overflow-hidden flex items-center justify-center relative shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-800">
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/5 group-hover:bg-black/10 transition-colors">
              <button className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center shadow-2xl text-red-500 transform group-hover:scale-110 transition-all duration-300">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
            <span className="text-zinc-400 dark:text-zinc-600 font-medium text-lg flex flex-col items-center gap-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              {t("landing.about.video_placeholder")}
            </span>
          </div>
          {/* Decorative element behind video */}
          <div className="absolute -inset-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2.5rem] -z-10 transform rotate-2"></div>
        </div>
        
        <div className="flex-1 text-center md:text-left order-1 md:order-2">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-zinc-50 mb-6 tracking-tight">
            {t("landing.about.title")}
          </h2>
          <div className="space-y-6 text-lg md:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <p>
              {t("landing.about.p1")}
            </p>
            <p>
              {t("landing.about.p2")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
