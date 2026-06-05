import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white py-10 text-gray-400 text-xs">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-5">
          <Link href="/legal" className="hover:text-[#1e3a5f] transition">特定商取引法に基づく表記</Link>
          <Link href="/privacy" className="hover:text-[#1e3a5f] transition">プライバシーポリシー</Link>
          <Link href="/terms" className="hover:text-[#1e3a5f] transition">利用規約</Link>
          <Link href="/contact" className="hover:text-[#1e3a5f] transition">お問い合わせ</Link>
        </div>
        <div className="text-center space-y-1">
          <p>運営：八街ワークス｜1枚会社紹介メーカー</p>
          <p>
            <a href="mailto:support@1mai.jp" className="hover:text-[#1e3a5f] transition">support@1mai.jp</a>
          </p>
          <p className="mt-3">© 2025 1枚会社紹介メーカー</p>
        </div>
      </div>
    </footer>
  )
}
