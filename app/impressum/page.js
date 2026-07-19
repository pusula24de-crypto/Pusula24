// ============================================================
// DOSYA: app/impressum/page.js
// §5 DDG (genel künye) + §18 Abs. 2 MStV (gazetecilik içeriği
// sorumlusu) yapısına göre hazırlanmıştır.
//
// ⚠️ YAYINA ALMADAN ÖNCE DOLDURULACAK 2 ALAN: info@verixis.de ve +49 176 70095829.
//    §5 DDG "hızlı elektronik iletişim" ister; e-posta ZORUNLU,
//    telefon şiddetle tavsiye edilir (Abmahnung riskini düşürür).
// ⚠️ İsim yazımı: Resmi kimlikteki yazımla birebir aynı olmalı
//    (Yiğit/Yigit farkına dikkat — kimlikte nasılsa öyle yazın).
// ⚠️ Not: Site reklam geliri elde etmeye başlayınca Gewerbeanmeldung
//    ve varsa USt-IdNr. eklenmesi gündeme gelir; o gün bu sayfaya
//    "Umsatzsteuer-ID" satırı eklenmelidir.
// ============================================================

export const metadata = {
  title: "Impressum",
  robots: { index: false, follow: true },
};

export default function ImpressumPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-black">Impressum</h1>

      <section className="mt-8 space-y-7 text-sm leading-relaxed text-neutral-700">
        <div>
          <h2 className="text-base font-bold text-neutral-900">
            Angaben gemäß § 5 DDG
          </h2>
          <p className="mt-2">
            Mustafa Yigit Ege
            <br />
            Theresienstraße 2A
            <br />
            86153 Augsburg
            <br />
            Deutschland
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-neutral-900">Kontakt</h2>
          <p className="mt-2">
            Telefon: +49 176 70095829
            <br />
            E-Mail: info@verixis.de
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-neutral-900">
            Verantwortlich für journalistisch-redaktionelle Inhalte gemäß
            § 18 Abs. 2 MStV
          </h2>
          <p className="mt-2">
            Mustafa Yigit Ege
            <br />
            Theresienstraße 2A
            <br />
            86153 Augsburg
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-neutral-900">
            Redaktionelle Grundsätze
          </h2>
          <p className="mt-2">
            Unsere Berichterstattung basiert auf offiziellen Quellen
            (u.&nbsp;a. Pressemitteilungen von Polizei, Zoll und Behörden),
            die in den jeweiligen Beiträgen verlinkt werden. Es gilt die
            Unschuldsvermutung. Betroffene können sich mit Anliegen zur
            Berichterstattung, Richtigstellungen oder Gegendarstellungen an
            die oben genannte E-Mail-Adresse wenden.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-neutral-900">
            EU-Streitschlichtung
          </h2>
          <p className="mt-2">
            Die Europäische Kommission stellt eine Plattform zur
            Online-Streitbeilegung (OS) bereit:{" "}
            <a
              href="https://ec.europa.eu/consumers/odr/"
              rel="noopener noreferrer"
              target="_blank"
              className="text-red-600 underline-offset-2 hover:underline"
            >
              https://ec.europa.eu/consumers/odr/
            </a>
            . Wir sind nicht bereit oder verpflichtet, an
            Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-neutral-900">
            Haftung für Inhalte und Links
          </h2>
          <p className="mt-2">
            Als Diensteanbieter sind wir für eigene Inhalte auf diesen
            Seiten nach den allgemeinen Gesetzen verantwortlich. Für die
            Inhalte externer Links sind ausschließlich deren Betreiber
            verantwortlich; zum Zeitpunkt der Verlinkung waren keine
            Rechtsverstöße erkennbar. Bei Bekanntwerden von
            Rechtsverletzungen werden wir derartige Links umgehend
            entfernen.
          </p>
        </div>
      </section>
    </main>
  );
}
