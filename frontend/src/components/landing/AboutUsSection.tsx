import { useTranslation } from "@/i18n/config";
import Image from "next/image";

export function AboutUsSection() {
  const t = useTranslation();
  return (
    <section id="scopri-di-piu" className="py-16 md:py-24 px-6 bg-white dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 lg:gap-20">
        <div className="flex-1 w-full order-2 md:order-1 relative group cursor-pointer">
          <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-[2rem] overflow-hidden flex items-center justify-center relative shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-800">
            <Image
              src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1000&auto=format&fit=crop"
              alt="Driving student"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors z-10">
              <button className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center shadow-2xl text-red-500 transform group-hover:scale-110 transition-all duration-300">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
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
              {t("landing.about.p2_intro")}
            </p>
            <ul className="space-y-4 mt-6 text-base md:text-lg">
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3 text-indigo-500 dark:text-indigo-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <span>{t("landing.about.list_item_1")}</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3 text-indigo-500 dark:text-indigo-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <span>{t("landing.about.list_item_2")}</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3 text-indigo-500 dark:text-indigo-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-1.89M5 12H3m14 0a9 9 0 11-18 0 9 9 0 0118 0z" /><circle cx="12" cy="12" r="3" /></svg>
                </div>
                <span>{t("landing.about.list_item_3")}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
