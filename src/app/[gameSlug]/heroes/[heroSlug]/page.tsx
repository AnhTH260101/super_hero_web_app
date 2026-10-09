import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGameMeta, getHeroBySlug } from '@/lib/games';
import { Header } from '@/components/layout/Header';
import { MonetizationBanner } from '@/components/monetization/MonetizationBanner';
import { HeroInteractiveHub } from '@/components/heroes/HeroInteractiveHub';
import { HeroSkillsSection } from '@/components/heroes/HeroSkillsSection';
import { ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
  params: Promise<{ gameSlug: string; heroSlug: string }>;
}

export default async function HeroDetailPage({ params }: Props) {
  const { gameSlug, heroSlug } = await params;
  const game = getGameMeta(gameSlug);
  if (!game) notFound();

  const hero = getHeroBySlug(gameSlug, heroSlug);
  if (!hero) notFound();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header currentGame={game} />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Link
            href={`/${gameSlug}/heroes`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Kho Tướng {game.name}</span>
          </Link>

          {(hero.isAfterlifeForm || hero.isSkinForm) && hero.baseHero && (
            <Link
              href={`/${gameSlug}/heroes/${hero.baseHero.slug}`}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 hover:border-purple-400 text-xs font-bold text-purple-200 hover:text-white transition-all shadow-md group"
              title={`Quay về tướng mặc định: ${hero.baseHero.name}`}
            >
              <ArrowLeft className="w-3.5 h-3.5 text-purple-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Về tướng mặc định:</span>
              <span className="text-amber-400 font-extrabold">{hero.baseHero.name}</span>
            </Link>
          )}
        </div>

        {/* Hero Interactive Hub: Header Card + Chuyển Sinh + Siêu Tiến Hóa Mô Phỏng */}
        <HeroInteractiveHub hero={hero} gameSlug={gameSlug} />

        {/* Skills Section (Component chuẩn hóa riêng biệt) */}
        <HeroSkillsSection skills={hero.skills} />

        {/* Base Hero Section (Lối tắt về Tướng Mặc Định Gốc cho Tướng Chuyển Thế / Trang Phục) */}
        {(hero.isAfterlifeForm || hero.isSkinForm) && hero.baseHero && (
          <section className="mb-10 p-6 rounded-3xl bg-gradient-to-r from-purple-950/30 via-slate-900 to-slate-900 border border-purple-500/40 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <span className="text-amber-400">↩️</span>
                  <span>Bản Thể Gốc (Tướng Mặc Định)</span>
                </h2>
                <p className="text-xs text-purple-300/80 mt-1">
                  Bản thể nguyên bản ban đầu trước khi thức tỉnh Cảnh Giới Chuyển Thế:
                </p>
              </div>
              <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Bản Thể Ban Đầu
              </span>
            </div>

            <div className="mt-4 max-w-md">
              <Link
                href={`/${gameSlug}/heroes/${hero.baseHero.slug}`}
                className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 hover:border-amber-400 group transition-all flex items-center gap-4 hover:shadow-lg hover:shadow-amber-500/10"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-amber-500/50 overflow-hidden flex items-center justify-center shrink-0">
                  {hero.baseHero.avatar && hero.baseHero.avatar.startsWith('/') ? (
                    <img src={hero.baseHero.avatar} alt={hero.baseHero.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  ) : (
                    <span className="text-3xl">🦸</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-sm text-white group-hover:text-amber-300 transition-colors truncate">
                      {hero.baseHero.name}
                    </span>
                    {hero.baseHero.rarity && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        {hero.baseHero.rarity}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                    <span>Xem bộ chiêu thức tướng mặc định</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* Afterlife Forms Section (Các Dạng Chuyển Thế) */}
        {hero.afterlifeForms && hero.afterlifeForms.length > 0 && (
          <section className="mb-10 p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/40 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <span className="text-purple-400">⚡</span>
                  <span>Cảnh Giới Chuyển Thế ({hero.afterlifeForms.length} Dạng)</span>
                </h2>
                <p className="text-xs text-purple-300/80 mt-1">
                  Khi đạt Tiến hóa +35 và vượt ải Thí Luyện, tướng sẽ thức tỉnh thành các dạng sức mạnh tối thượng dưới đây:
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                End-Game Meta
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {hero.afterlifeForms.map((form) => (
                <Link
                  key={form.slug}
                  href={`/${gameSlug}/heroes/${form.slug}`}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30 hover:border-purple-400 group transition-all flex items-center gap-4 hover:shadow-lg hover:shadow-purple-500/10"
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-purple-500/50 overflow-hidden flex items-center justify-center shrink-0">
                    {form.avatar && form.avatar.startsWith('/') ? (
                      <img src={form.avatar} alt={form.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    ) : (
                      <span className="text-3xl">🦸</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-extrabold text-sm text-white group-hover:text-purple-300 transition-colors truncate">
                        {form.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-purple-400 flex items-center gap-1">
                      <span>Khám phá bộ chiêu thức</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Hero Skins Section (Trang Phục / Skin Đặc Biệt) */}
        {hero.skins && hero.skins.length > 0 && (
          <section className="mb-10 p-6 rounded-3xl bg-gradient-to-r from-pink-950/40 via-slate-900 to-slate-950 border border-pink-500/40 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <span className="text-pink-400">✨</span>
                  <span>Trang Phục Đặc Biệt / Skin ({hero.skins.length})</span>
                </h2>
                <p className="text-xs text-pink-300/80 mt-1">
                  Ngoại trang độc quyền giúp thay đổi ngoại hình và kích hoạt hiệu ứng bổ trợ kĩ năng tối thượng:
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-pink-500/20 text-pink-300 border border-pink-500/40">
                Hiệu Ứng Skin
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {hero.skins.map((skin) => (
                <Link
                  key={skin.slug}
                  href={`/${gameSlug}/heroes/${skin.slug}`}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-pink-500/30 hover:border-pink-400 group transition-all flex items-center gap-4 hover:shadow-lg hover:shadow-pink-500/10"
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-pink-500/50 overflow-hidden flex items-center justify-center shrink-0">
                    {skin.avatar && skin.avatar.startsWith('/') ? (
                      <img src={skin.avatar} alt={skin.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    ) : (
                      <span className="text-3xl">👘</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-extrabold text-sm text-white group-hover:text-pink-300 transition-colors truncate">
                        {skin.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-pink-400 flex items-center gap-1">
                      <span>Xem bộ chiêu thức Skin</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Affiliate Placement In-Content */}
        <MonetizationBanner
          gameName={game.name}
          affiliateUrl={game.affiliateLinks?.pcEmulator}
        />

        {/* Vận Mệnh (Layout tướng sang bên phải cuối cùng kèm tên bên dưới icon) */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 my-10 shadow-xl">
          <div className="mb-4 pb-3 border-b border-slate-800">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Vận Mệnh</span>
            </h3>
          </div>

          <ul className="space-y-3">
            {hero.destiny && hero.destiny.length > 0 ? (
              hero.destiny.map((dest, idx) => (
                <li key={idx} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                  {/* Text sang bên trái */}
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="font-bold text-sm text-white">
                      {dest.name}
                    </h4>
                    <p className="text-xs text-emerald-400 font-medium mt-1 leading-relaxed">
                      {dest.effect}
                    </p>
                  </div>

                  {/* Layout tướng ra bên phải cuối cùng, có tên tướng phía dưới */}
                  <div className="flex flex-wrap items-center gap-4 sm:shrink-0">
                    {dest.heroes.map((h, hIdx) => {
                      const cardContent = (
                        <>
                          <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-xl bg-slate-900 border-2 border-amber-500/50 hover:border-amber-400 overflow-hidden shadow-md transition-all group-hover:scale-105">
                            <img src={h.avatar} alt={h.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-xs text-slate-200 group-hover:text-amber-400 font-semibold text-center leading-tight mt-1.5 whitespace-nowrap">
                            {h.name}
                          </span>
                        </>
                      );

                      return h.slug ? (
                        <Link
                          key={hIdx}
                          href={`/${gameSlug}/heroes/${h.slug}`}
                          className="group flex flex-col items-center"
                        >
                          {cardContent}
                        </Link>
                      ) : (
                        <div
                          key={hIdx}
                          className="group flex flex-col items-center cursor-default"
                        >
                          {cardContent}
                        </div>
                      );
                    })}
                  </div>
                </li>
              ))
            ) : (
              hero.bestSynergies?.map((syn, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{syn}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}
