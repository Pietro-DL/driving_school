import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from "@/i18n/config";

export function HeroSection() {
  const t = useTranslation();
  return (
    <section className="px-6 py-16 md:py-24 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
      <div className="flex-1 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mb-6">
          {t("landing.hero.title_part1")}<span className="text-indigo-600 dark:text-indigo-400">{t("landing.hero.title_highlight")}</span>{t("landing.hero.title_part2")}
        </h1>
        <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto md:mx-0">
          {t("landing.hero.subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full transition-colors text-center"
          >
            {t("landing.hero.register_cta")}
          </Link>
          <Link
            href="#scopri-di-piu"
            className="w-full sm:w-auto px-8 py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-50 font-semibold rounded-full transition-colors text-center"
          >
            {t("landing.hero.discover_cta")}
          </Link>
        </div>
      </div>
      <div className="flex-1 w-full relative">
        <div className="aspect-square md:aspect-[4/3] relative rounded-[2.5rem] overflow-hidden drop-shadow-2xl border-4 border-white dark:border-zinc-900">
          <Image
            src="/hero-mockup.png"
            alt={t("landing.hero.image_alt") as string}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority={true}
          />
        </div>
      </div>
    </section>
  );
}
