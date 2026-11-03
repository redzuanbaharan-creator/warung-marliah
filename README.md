# Warung Nasi Ambeng Hajah Marliah — laman web

Live: https://warunghjhmarliah.envirovera.com (Cloudflare Pages, projek `warung-marliah`)

## Di mana nak ubah apa

Hampir semua perkara diubah dalam **`index.html`**, di bahagian `ZON EDIT` (cari perkataan `ZON EDIT`):

| Nak ubah | Cari dalam ZON EDIT |
|---|---|
| Nombor telefon / WhatsApp (Ijah, Wan) | `INFO.contacts` — nombor pertama dipakai untuk semua butang "Tempah" |
| Waktu buka | `HOURS` — **ubah juga `openingHoursSpecification` di bahagian atas fail** (itu yang Google baca) |
| Menu & harga | `MENU_ITEMS` |
| Hidangan dalam dunia 3D | `MENU_ITEMS` dengan `featured: true` dan `tex` |
| Ulasan | `REVIEWS` — salin ulasan sebenar, perkataan demi perkataan |
| Galeri | `GALLERY_IMAGES` — bahagian Galeri muncul bila ada sekurang-kurangnya satu gambar |
| Teks BM / English | `STRINGS` |

## Gambar

- `images/menu/` — gambar hidangan untuk senarai menu (lebar ±900px, `.webp`)
- `images/tex/` — gambar segi empat sama 512×512 untuk pinggan 3D; makanan mesti di tengah, tanpa tulisan
- `og-image.jpg` / `og-image.png` — gambar yang keluar bila link dikongsi di WhatsApp/Facebook (ada nombor telefon tertulis di dalamnya)

Guna gambar sebenar warung sahaja.

## 3D

- `js/world.js` — dunia 3D (dulang, pinggan, daun pisang)
- `vendor/three.module.min.js` — three.js r170, disimpan di sini supaya laman tidak bergantung pada laman lain
- Telefon lama, mod "kurangkan animasi" dan mod jimat data mendapat gambar biasa, bukan 3D. Kandungan sama.

## Cara terbit (publish)

Repo ini disambung ke Cloudflare Pages. Setiap kali kod di-push ke cawangan `main`, Cloudflare terbitkan laman secara automatik. Cawangan lain mendapat pautan pratonton `<nama-cawangan>.warung-marliah.pages.dev`.

Tetapan Cloudflare: build command kosong, output directory `/`.
