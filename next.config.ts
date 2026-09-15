import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CANLI KANIT (2026-09-15): Turbopack, sharp'ın dlopen ile yüklediği
  // libvips-cpp.so'yu kendi modül izleme (output file tracing) adımına
  // dahil edemiyordu — Vercel'de "cannot open shared object file" hatasıyla
  // /api/sosyal-gorsel/[id] ve /api/gorsel-webp production'da 500
  // dönüyordu (sürüm çakışmasını gidermek TEK BAŞINA yetmedi, hata aynı
  // şekilde devam etti). sharp'ı Next'in kendi bundling/tracing
  // sürecinden tamamen çıkarıp normal Node native-modül çözümlemesine
  // bırakmak (resmi, belgelenen çözüm) sorunu gideriyor.
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
