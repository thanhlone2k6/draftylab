# Phase 2 — mapping & decisions (APPROVED 17/10/2026, mapping kept as is)

Everything below is already wired and easy to change: stage mapping and copy live in `src/data/content.ts`; per-asset labels, roles and crops in `scripts/media-roles.json` (guarded by a test so ids cannot silently drift).

| # | Item | What I did | Decision needed |
|---|---|---|---|
| 1 | **Case Studies images** (3 PNG, no brand in file name) | Opened each image. `f bản của bạn.png` = Lee Chloe Coffee (Facebook), `…cgủa bạn.png` = DINH House (Facebook), `…của bạn.png` = Kazaki (Instagram). | OK to publish these profile screenshots? |
| 2 | **Contact details in those screenshots** | DINH House and Kazaki screenshots showed phone / e-mail lines → **cropped out** (`media-roles.json`, `crop`). Test asserts no phone number on the page. | — |
| 3 | **“Results”** | The only numbers available are follower counts visible in the screenshots (5,9K / 12K / 10,3 N). They are shown as **“Người theo dõi hiện tại”, source “ảnh chụp trang …, 17/10/2026”**, with the caveat “không phải kết quả đo lường của chiến dịch”. No growth, reach, revenue or percentage is shown. | Keep as account size, or hide until real campaign metrics exist? |
| 4 | **“Đã sản xuất” counts** | Computed from the real Social Production folders (e.g. Lee Chloe 12 ảnh · 3 video). | — |
| 5 | **How I Work mapping** (10 photos + 1 video → 4 folders) | Draft by what each image shows: Discover = video call video + Meet call + working with doc; Concept = idea/planning documents; Production = Photoshop menu design + editing software + café laptop; Delivery = review at café + lunch break. | Re-assign any image (edit `howIWork.stages[].mediaIds`). Photos are casual working shots; no stage is a perfect fit. |
| 6 | **AI Workflow images** | `raw.png` is **345×373**, `final.png` is **1920×2400** (different ratio 0.925 vs 0.8) and the final is a designed poster, so the subject is the same drink but **not pixel-registered**. The slider reveals one over the other in a single 4:5 frame (cover crop); a note under it says the original is lower resolution. | Is that the intended “before”? A same-composition raw would make a cleaner comparison. |
| 7 | **Duplicate asset** | `lee chloe/hoi trong.png` is byte-identical to `AI workflow/final.png`. Both are used (Lee Chloe carousel, AI Workflow “after”). | Is it a Lee Chloe post? |
| 8 | **Raw → Final** | `raw.MP4` is HEVC 2688×2016 with rotation −90° → shown **3:4 portrait**; `video final.mp4` is 9:16. Each keeps its own ratio (not cropped). Lightbox group “1 / 2”. | — |
| 9 | **Trusted By** | 7 logos from V1 (V1_TEMP). Dark line-art logos are inverted for the dark theme. Maison and Saraya have no folder in DFL2 Social Production. | Confirm each partner may be shown; supply V2 logos. |
| 10 | **Website & Landing Page** | No assets in DFL2 → **section not rendered, no nav link** (`TODO: ASSETS_WEBSITE`). | Provide site screenshots/links, or drop the section. |
| 11 | **About copy** | Only the storyboard opening line (“Chào quý anh chị, em là Thành, Founder của Drafty Lab.”) + a one-sentence summary built from the tagline printed on the V1 portrait (AI Creative · Video Editing · Hybrid Production). **No years, awards or client claims.** | Provide the official bio. |
| 12 | **Reflective Card** | Used with `webcam={false}`; the camera API is never called (test overrides `getUserMedia` and asserts 0 calls). Card face = V1 portrait + name/role/badge (no fake ID numbers). Static card on touch / <900px / reduced motion / no WebGL2. | Optional: supply a short reflection loop video. |
| 13 | **Case-study card links** | Platform links come from V1 (`temporaryFromV1`). | Confirm. |
