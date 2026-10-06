# Nadira — Balalar massaji (Q&A montaj)

Vertikal video 1080×1920, 25 fps, ~50 soniya. Rang (C "Kino"), animatsiyalar,
karaoke subtitrlar, 3D ikonkalar va fon musiqasi shu loyiha ichida.

Videoning o'zi repozitoriyada **yo'q** — uni o'zingiz `public/` papkasiga qo'yasiz.

## Ishga tushirish

1. Bu papkaga kiring va paketlarni o'rnating:

   ```bash
   cd nadira-montaj
   npm install
   ```

2. Asl videoni (`nadira_Q.A.mov`) `public/` papkasiga ko'chiring.

3. Videoni tayyorlang (bir marta, ~3–5 daqiqa). Bu Remotion ichidagi ffmpeg bilan
   yuqori sifatli `public/nadira.mp4` yaratadi va ovoz balandligini normallashtiradi:

   ```bash
   npm run prepare-video
   ```

4. Remotion Studio'ni oching:

   ```bash
   npm run dev
   ```

   Brauzerda `Nadira` kompozitsiyasini tanlang va **Render** tugmasini bosing.
   Maksimal sifat sozlamalari (`remotion.config.ts`) avtomatik qo'llanadi:
   PNG kadrlar, H.264, CRF 12, `slow` preset.

   Yoki terminaldan:

   ```bash
   npm run render
   ```

   Natija: `out/nadira_montaj.mp4`.

## Fayllar

- `src/data.ts` — savol/javob matnlari va ularning vaqtlari (soniyada).
- `src/Montage.tsx` — barcha animatsiyalar, subtitrlar, musiqa va effektlar.
- `src/grade.tsx` — rang (color grading) filtri va vinyetka.
- `public/music.wav`, `public/sfx/` — fon musiqasi va ovoz effektlari (shu loyiha uchun sintez qilingan).
- `public/icons/` — Microsoft Fluent Emoji 3D (MIT litsenziyasi, `@lobehub/fluent-emoji-3d`).
- `public/fonts/` — Montserrat (SIL Open Font License).
