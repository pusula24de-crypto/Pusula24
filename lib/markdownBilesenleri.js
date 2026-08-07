// react-markdown'ın <Markdown components={...}> prop'una verilir. Haber ve
// rehber gövdelerindeki (ör. "Kaynak:" satırlarına eklenen resmi kurum/kanun
// linkleri) TÜM bağlantıları yeni sekmede açar — kullanıcı dış bir siteye
// gidince site içeriğinden kopmasın diye. Hem sunucu hem istemci bileşeninde
// kullanılabilir (hook/state içermez).
export const MARKDOWN_BILESENLERI = {
  // "node" react-markdown'ın kendi AST düğümü — DOM'a yayılırsa geçersiz
  // bir "node" attribute'u olarak sızar, bilinçli olarak dışarıda bırakılıyor.
  a: ({ href, children, node, ...props }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  ),
}
