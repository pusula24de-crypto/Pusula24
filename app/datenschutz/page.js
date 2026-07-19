// ============================================================
// DOSYA: app/datenschutz/page.js
// Sitenin GERÇEK teknik yığınına göre yazılmıştır:
// Supabase (Frankfurt), Cloudflare (canlıya çıkınca), yerel fontlar
// (next/font — Google'a bağlantı YOK), hava/döviz widget'ının dış
// API'leri (Open-Meteo, Frankfurter, gold-api), tarayıcı konum izni,
// localStorage önbelleği ve yalnızca admin alanındaki oturum çerezi.
//
// ⚠️ DOLDURULACAK: info@verixis.de (Impressum'dakiyle aynı olabilir).
// ⚠️ İleride ANALİTİK, REKLAM, YORUM veya BÜLTEN eklerseniz bu metin
//    GÜNCELLENMEK ZORUNDA (ve reklam/analitik için consent banner gerekir).
// ⚠️ Hosting Cloudflare dışında olacaksa 3. bölümü uyarlayın.
// ============================================================

export const metadata = {
  title: "Datenschutzerklärung",
  robots: { index: false, follow: true },
};

export default function DatenschutzPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-black">Datenschutzerklärung</h1>

      <section className="mt-8 space-y-7 text-sm leading-relaxed text-neutral-700">
        <div>
          <h2 className="text-base font-bold text-neutral-900">
            1. Verantwortlicher
          </h2>
          <p className="mt-2">
            Mustafa Yigit Ege
            <br />
            Theresienstraße 2A, 86153 Augsburg, Deutschland
            <br />
            E-Mail: info@verixis.de
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-neutral-900">
            2. Allgemeines zur Datenverarbeitung
          </h2>
          <p className="mt-2">
            Wir verarbeiten personenbezogene Daten nur, soweit dies zur
            Bereitstellung einer funktionsfähigen Website sowie unserer
            Inhalte erforderlich ist. Der öffentliche Bereich dieser
            Website verwendet keine Tracking-Cookies, keine Analyse-Tools
            und keine Werbenetzwerke.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-neutral-900">
            3. Hosting und Content Delivery
          </h2>
          <p className="mt-2">
            Diese Website wird über die Infrastruktur von Cloudflare, Inc.
            bereitgestellt. Beim Aufruf der Seiten verarbeitet Cloudflare
            technisch notwendige Verbindungsdaten (IP-Adresse, Datum und
            Uhrzeit des Zugriffs, aufgerufene Seite, Browsertyp), um die
            Website sicher und performant auszuliefern (Art. 6 Abs. 1
            lit. f DSGVO — berechtigtes Interesse an einem stabilen und
            sicheren Betrieb). Mit Cloudflare besteht ein
            Auftragsverarbeitungsvertrag; etwaige Übermittlungen in die
            USA erfolgen auf Grundlage des EU-US Data Privacy Framework.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-neutral-900">
            4. Datenbank und Speicher (Supabase)
          </h2>
          <p className="mt-2">
            Redaktionelle Inhalte und Bilder werden über Supabase
            gehostet (Serverstandort: Frankfurt am Main, Deutschland).
            Beim Abruf von Inhalten werden technisch notwendige
            Verbindungsdaten verarbeitet (Art. 6 Abs. 1 lit. f DSGVO).
            Ein Auftragsverarbeitungsvertrag besteht.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-neutral-900">
            5. Lokal eingebundene Schriftarten
          </h2>
          <p className="mt-2">
            Die auf dieser Website verwendeten Schriftarten sind lokal auf
            unserem Server eingebunden. Beim Seitenaufruf wird keine
            Verbindung zu Servern von Google oder anderen
            Schriftanbietern hergestellt.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-neutral-900">
            6. Wetter-, Devisen- und Goldpreis-Anzeige (externe
            Datendienste)
          </h2>
          <p className="mt-2">
            Auf der Startseite zeigen wir aktuelle Wetterdaten,
            Wechselkurse und Goldpreise an. Hierzu ruft Ihr Browser Daten
            direkt bei folgenden Anbietern ab, wobei technisch bedingt
            Ihre IP-Adresse an den jeweiligen Anbieter übermittelt wird:
            Open-Meteo (Wetterdaten), Frankfurter API (Wechselkurse auf
            Basis der Europäischen Zentralbank) und gold-api.com
            (Goldpreis). Rechtsgrundlage ist unser berechtigtes Interesse
            an der Bereitstellung aktueller Serviceinformationen (Art. 6
            Abs. 1 lit. f DSGVO). Es werden dabei keine Cookies gesetzt
            und keine Profile gebildet.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-neutral-900">
            7. Standortabfrage (Wetteranzeige)
          </h2>
          <p className="mt-2">
            Für die ortsbezogene Wetteranzeige fragt Ihr Browser Sie
            aktiv um Erlaubnis, Ihren ungefähren Standort zu verwenden
            (Einwilligung, Art. 6 Abs. 1 lit. a DSGVO). Die Koordinaten
            werden ausschließlich in Ihrem Browser verarbeitet und nur
            zur Abfrage der Wetterdaten an Open-Meteo übermittelt; wir
            speichern Ihren Standort nicht auf unseren Servern. Ohne
            Einwilligung wird ersatzweise das Wetter für einen
            Standardort angezeigt. Sie können die Berechtigung jederzeit
            in Ihren Browsereinstellungen widerrufen.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-neutral-900">
            8. Local Storage
          </h2>
          <p className="mt-2">
            Zur Vermeidung unnötiger Datenabrufe speichert die Website
            die zuletzt geladenen Kurs- und Wetterdaten für kurze Zeit im
            Local Storage Ihres Browsers. Dies ist für die
            Bereitstellung des von Ihnen aufgerufenen Dienstes technisch
            erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG); eine
            Nachverfolgung findet nicht statt. Die Daten verbleiben auf
            Ihrem Gerät und können jederzeit über die
            Browsereinstellungen gelöscht werden.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-neutral-900">
            9. Cookies
          </h2>
          <p className="mt-2">
            Der öffentliche Bereich dieser Website setzt keine Cookies.
            Ausschließlich im passwortgeschützten Redaktionsbereich
            werden technisch notwendige Sitzungs-Cookies für die
            Anmeldung gesetzt (§ 25 Abs. 2 Nr. 2 TDDDG); diese betreffen
            nur redaktionelle Nutzer.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-neutral-900">
            10. Kontaktaufnahme
          </h2>
          <p className="mt-2">
            Bei Kontaktaufnahme per E-Mail werden die übermittelten
            Daten zur Bearbeitung der Anfrage verarbeitet (Art. 6 Abs. 1
            lit. b bzw. f DSGVO) und gelöscht, sobald sie nicht mehr
            erforderlich sind und keine gesetzlichen
            Aufbewahrungspflichten entgegenstehen.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-neutral-900">
            11. Journalistische Datenverarbeitung (Medienprivileg)
          </h2>
          <p className="mt-2">
            Für die Verarbeitung personenbezogener Daten zu
            journalistischen Zwecken gelten die Sonderregelungen des
            Medienprivilegs (Art. 85 DSGVO i.&nbsp;V.&nbsp;m. dem
            einschlägigen Landesrecht). Anliegen zur Berichterstattung
            richten Sie bitte an die im Impressum genannte
            E-Mail-Adresse.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-neutral-900">
            12. Ihre Rechte
          </h2>
          <p className="mt-2">
            Sie haben nach Maßgabe der Art. 15–21 DSGVO das Recht auf
            Auskunft, Berichtigung, Löschung, Einschränkung der
            Verarbeitung, Datenübertragbarkeit sowie Widerspruch gegen
            Verarbeitungen auf Grundlage berechtigter Interessen. Erteilte
            Einwilligungen können Sie jederzeit mit Wirkung für die
            Zukunft widerrufen. Zudem besteht ein Beschwerderecht bei
            einer Datenschutzaufsichtsbehörde; für uns zuständig ist das
            Bayerische Landesamt für Datenschutzaufsicht (BayLDA),
            Promenade 18, 91522 Ansbach.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-neutral-900">
            13. Stand dieser Erklärung
          </h2>
          <p className="mt-2">
            Stand: Juli 2026. Wir passen diese Erklärung an, sobald sich
            die eingesetzten Dienste oder Funktionen der Website ändern.
          </p>
        </div>
      </section>
    </main>
  );
}
